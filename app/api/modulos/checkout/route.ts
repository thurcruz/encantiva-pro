import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ASAAS_URL = process.env.ASAAS_API_URL ?? 'https://api.asaas.com/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY!

async function asaas(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { modulo, nome, email, senha, cpf, metodoPagamento, cartao } = await req.json()

    if (!modulo || !nome || !email || !senha || !cpf) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    if (!['biblioteca', 'contratos'].includes(modulo)) {
      return NextResponse.json({ erro: 'Modulo invalido' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Criar ou buscar usuario no Supabase Auth
    let userId: string

    const { data: userBuscado } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const encontrado = userBuscado?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (encontrado) {
      userId = encontrado.id
    } else {
      const { data: novoUser, error: errUser } = await supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome_loja: nome },
      })
      if (errUser || !novoUser.user) {
        return NextResponse.json({ erro: 'Erro ao criar conta: ' + errUser?.message }, { status: 400 })
      }
      userId = novoUser.user.id

      await supabase.from('perfis').upsert({ id: userId, nome_loja: nome })
      await supabase.from('assinaturas').insert({ usuario_id: userId, status: 'free', plano: 'free' })
    }

    // 2. Verificar se ja tem o modulo ativo — evitar duplicata
    const { data: moduloExistente } = await supabase
      .from('modulos_avulsos')
      .select('id, status')
      .eq('usuario_id', userId)
      .eq('modulo', modulo)
      .maybeSingle()

    if (moduloExistente?.status === 'active') {
      return NextResponse.json({ erro: 'Voce ja tem acesso a este modulo.' }, { status: 400 })
    }

    // 3. Criar ou buscar cliente no Asaas
    let asaasCustomerId: string

    const clienteExistente = await asaas(`/customers?email=${encodeURIComponent(email)}`, 'GET')
    if (clienteExistente?.data?.length > 0) {
      asaasCustomerId = clienteExistente.data[0].id
    } else {
      const novoCliente = await asaas('/customers', 'POST', { name: nome, email, cpfCnpj: cpf })
      if (!novoCliente.id) {
        return NextResponse.json({ erro: 'Erro ao criar cliente no Asaas: ' + JSON.stringify(novoCliente) }, { status: 400 })
      }
      asaasCustomerId = novoCliente.id
    }

    // 4. Criar cobranca no Asaas
    const nomeModulo = modulo === 'biblioteca' ? 'Biblioteca de Materiais - Vitalicio' : 'Contratos Ilimitados - Vitalicio'
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 1)
    const dueDate = vencimento.toISOString().split('T')[0]

    const pagamentoBody: Record<string, unknown> = {
      customer: asaasCustomerId,
      billingType: metodoPagamento,
      value: 19.90,
      dueDate,
      description: nomeModulo,
      externalReference: `${userId}::modulo::${modulo}`,
    }

    if (metodoPagamento === 'CREDIT_CARD' && cartao) {
      const [expMonth, expYear] = cartao.validade.split('/')
      pagamentoBody.creditCard = {
        holderName: cartao.nome,
        number: cartao.numero.replace(/\s/g, ''),
        expiryMonth: expMonth,
        expiryYear: expYear.length === 2 ? `20${expYear}` : expYear,
        ccv: cartao.cvv,
      }
      pagamentoBody.creditCardHolderInfo = {
        name: nome,
        email,
        cpfCnpj: cpf,
      }
    }

    const pagamento = await asaas('/payments', 'POST', pagamentoBody)

    if (!pagamento.id) {
      return NextResponse.json({ erro: 'Erro ao criar cobranca: ' + JSON.stringify(pagamento) }, { status: 400 })
    }

    // 5. Verificar status real do pagamento para cartao
    let statusModulo = 'pending'
    let pago = false

    if (metodoPagamento === 'CREDIT_CARD') {
      const statusReal = pagamento.status
      if (statusReal === 'CONFIRMED' || statusReal === 'RECEIVED') {
        statusModulo = 'active'
        pago = true
      } else if (statusReal === 'DECLINED' || statusReal === 'REFUNDED') {
        return NextResponse.json({ erro: 'Cartao recusado. Verifique os dados e tente novamente.' }, { status: 400 })
      }
      // Se PENDING — aguarda webhook confirmar
    }

    // 6. Registrar ou atualizar modulo no banco
    if (moduloExistente) {
      await supabase
        .from('modulos_avulsos')
        .update({ status: statusModulo, asaas_payment_id: pagamento.id })
        .eq('id', moduloExistente.id)
    } else {
      await supabase.from('modulos_avulsos').insert({
        usuario_id: userId,
        modulo,
        status: statusModulo,
        asaas_payment_id: pagamento.id,
        asaas_customer_id: asaasCustomerId,
        valor: 19.90,
      })
    }

    // PIX — retornar QR Code
    if (metodoPagamento === 'PIX') {
      const pixInfo = await asaas(`/payments/${pagamento.id}/pixQrCode`, 'GET')
      return NextResponse.json({
        ok: true,
        pago: false,
        paymentId: pagamento.id,
        qrCode: pixInfo.encodedImage ?? null,
        pixKey: pixInfo.payload ?? null,
      })
    }

    return NextResponse.json({ ok: true, pago })

  } catch (err) {
    console.error('[modulos/checkout]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}