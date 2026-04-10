import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { criarConversaoAfiliado } from '../../afiliados/helper'

function getAsaasConfig() {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY não configurada')

  const url = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'

  return { key, url }
}

const PLANOS: Record<string, { nome: string; valor: number; descricao: string }> = {
  iniciante: { nome: 'Encantiva Pro — Iniciante', valor: 19.90, descricao: 'Plano Iniciante — acesso mensal' },
  avancado:  { nome: 'Encantiva Pro — Avançado',  valor: 34.90, descricao: 'Plano Avançado — acesso mensal'  },
  elite:     { nome: 'Encantiva Pro — Elite',      valor: 54.90, descricao: 'Plano Elite — acesso mensal'     },
}

const URL_SUCESSO = 'https://encantivapro.com.br/pagamento/sucesso'

async function buscarOuCriarCliente(email: string, nome: string, cpfCnpj: string): Promise<string> {
  const { key, url } = getAsaasConfig()

  const busca = await fetch(`${url}/customers?email=${encodeURIComponent(email)}`, {
    headers: { accept: 'application/json', access_token: key },
  })
  const buscaJson = await busca.json()

  if (buscaJson?.data?.length > 0) {
    const clienteExistente = buscaJson.data[0]
    await fetch(`${url}/customers/${clienteExistente.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
      body: JSON.stringify({ name: nome, email, cpfCnpj }),
    })
    return clienteExistente.id
  }

  const criacao = await fetch(`${url}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
    body: JSON.stringify({ name: nome, email, cpfCnpj }),
  })
  const cliente = await criacao.json()
  if (!cliente.id) throw new Error(`Erro ao criar cliente Asaas: ${JSON.stringify(cliente)}`)
  return cliente.id
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

    const codigoRef = req.cookies.get('ref')?.value ?? null

    const { plano, cpfCnpj } = await req.json()
    const config = PLANOS[plano]
    if (!config) return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 })
    if (!cpfCnpj) return NextResponse.json({ erro: 'CPF/CNPJ obrigatório' }, { status: 400 })

    // Verifica se já tem assinatura ativa
    const { data: assinaturaExistente } = await supabase
      .from('assinaturas')
      .select('asaas_subscription_id, status')
      .eq('usuario_id', user.id)
      .single()

    if (assinaturaExistente?.status === 'active') {
      return NextResponse.json({ erro: 'Você já possui uma assinatura ativa.' }, { status: 400 })
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_loja, asaas_customer_id')
      .eq('id', user.id)
      .single()

    const nomeCliente = perfil?.nome_loja || user.email!.split('@')[0]

    let customerId = perfil?.asaas_customer_id as string | null
    if (!customerId) {
      customerId = await buscarOuCriarCliente(user.email!, nomeCliente, cpfCnpj)
      await supabase.from('perfis').upsert({ id: user.id, asaas_customer_id: customerId })
    } else {
      await buscarOuCriarCliente(user.email!, nomeCliente, cpfCnpj)
    }

    const { key, url } = getAsaasConfig()

    // Busca split de afiliado se houver cookie ref
    let afiliadoSplit: { walletId: string; percentual: number } | null = null
    if (codigoRef) {
      const adminSb = createAdminClient()
      const { data: afiliado } = await adminSb
        .from('afiliados')
        .select('asaas_wallet_id, comissao_pct')
        .ilike('codigo', codigoRef)
        .eq('ativo', true)
        .single()
      if (afiliado?.asaas_wallet_id) {
        afiliadoSplit = { walletId: afiliado.asaas_wallet_id, percentual: afiliado.comissao_pct }
      }
    }

    const proximoVencimento = new Date()
    proximoVencimento.setDate(proximoVencimento.getDate() + 1)
    const nextDueDate = proximoVencimento.toISOString().split('T')[0]

    // Cria a assinatura com callback de sucesso
    const subBody: Record<string, unknown> = {
      customer:          customerId,
      billingType:       'UNDEFINED',
      nextDueDate,
      value:             config.valor,
      cycle:             'MONTHLY',
      description:       config.descricao,
      externalReference: `${user.id}::${plano}`,
      callback: {
        successUrl:   URL_SUCESSO,
        autoRedirect: true,
      },
    }

    if (afiliadoSplit) {
      subBody.split = [{ walletId: afiliadoSplit.walletId, percentualValue: afiliadoSplit.percentual }]
    }

    const subRes = await fetch(`${url}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
      body: JSON.stringify(subBody),
    })

    const sub = await subRes.json()
    if (!sub.id) throw new Error(`Erro Asaas: ${JSON.stringify(sub)}`)

    await supabase.from('assinaturas').upsert({
      usuario_id:            user.id,
      status:                'pending',
      plano,
      asaas_subscription_id: sub.id,
      asaas_customer_id:     customerId,
      atualizado_em:         new Date().toISOString(),
    }, { onConflict: 'usuario_id' })

    // Busca a primeira cobrança gerada pela assinatura para obter o invoiceUrl
    const cobrancasRes = await fetch(`${url}/payments?subscription=${sub.id}`, {
      headers: { accept: 'application/json', access_token: key },
    })
    const cobrancas = await cobrancasRes.json()
    const primeiraCobranca = cobrancas?.data?.[0]
    const checkoutUrl = primeiraCobranca?.invoiceUrl ?? sub.paymentLink ?? null

    // Registra conversão de afiliado se houver ref
    if (codigoRef && primeiraCobranca?.id) {
      await criarConversaoAfiliado(user.id, codigoRef, plano, config.valor, primeiraCobranca.id)
    }

    return NextResponse.json({ checkoutUrl, subscriptionId: sub.id })

  } catch (err) {
    console.error('[criar-assinatura]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}