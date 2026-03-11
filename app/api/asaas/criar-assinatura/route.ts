import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getAsaasConfig() {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY não configurada')

  const url = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'

  return { key, url }
}

const PLANOS: Record<string, { nome: string; valor: number; descricao: string }> = {
  iniciante: { nome: 'Encantiva Pro — Iniciante', valor: 24.90, descricao: 'Plano Iniciante — acesso mensal' },
  avancado:  { nome: 'Encantiva Pro — Avançado',  valor: 54.90, descricao: 'Plano Avançado — acesso mensal'  },
  elite:     { nome: 'Encantiva Pro — Elite',      valor: 94.00, descricao: 'Plano Elite — acesso mensal'     },
}

async function buscarOuCriarCliente(email: string, nome: string): Promise<string> {
  const { key, url } = getAsaasConfig()

  // 1. Tenta encontrar cliente existente pelo e-mail
  const busca = await fetch(`${url}/customers?email=${encodeURIComponent(email)}`, {
    headers: { accept: 'application/json', access_token: key },
  })
  const buscaJson = await busca.json()
  if (buscaJson?.data?.length > 0) return buscaJson.data[0].id

  // 2. Cria novo cliente
  const criacao = await fetch(`${url}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
    body: JSON.stringify({ name: nome, email }),
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

    const { plano } = await req.json()
    const config = PLANOS[plano]
    if (!config) return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 })

    // Dados do usuário
    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_loja, asaas_customer_id')
      .eq('id', user.id)
      .single()

    const nomeCliente = perfil?.nome_loja || user.email!.split('@')[0]

    // Busca ou cria cliente no Asaas
    let customerId = perfil?.asaas_customer_id as string | null
    if (!customerId) {
      customerId = await buscarOuCriarCliente(user.email!, nomeCliente)
      await supabase.from('perfis').upsert({ id: user.id, asaas_customer_id: customerId })
    }

    const { key, url } = getAsaasConfig()

    // Cria assinatura mensal
    const proximoVencimento = new Date()
    proximoVencimento.setDate(proximoVencimento.getDate() + 1)
    const nextDueDate = proximoVencimento.toISOString().split('T')[0]

    const subRes = await fetch(`${url}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
      body: JSON.stringify({
        customer:          customerId,
        billingType:       'CREDIT_CARD',
        nextDueDate,
        value:             config.valor,
        cycle:             'MONTHLY',
        description:       config.descricao,
        externalReference: `${user.id}::${plano}`,
      }),
    })

    const sub = await subRes.json()
    if (!sub.id) throw new Error(`Erro Asaas: ${JSON.stringify(sub)}`)

    // Salva assinatura pendente no Supabase
    await supabase.from('assinaturas').upsert({
      usuario_id:            user.id,
      status:                'pending',
      plano,
      asaas_subscription_id: sub.id,
      asaas_customer_id:     customerId,
      atualizado_em:         new Date().toISOString(),
    }, { onConflict: 'usuario_id' })

    return NextResponse.json({
      checkoutUrl:    sub.paymentLink ?? null,
      subscriptionId: sub.id,
    })

  } catch (err) {
    console.error('[criar-assinatura]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}