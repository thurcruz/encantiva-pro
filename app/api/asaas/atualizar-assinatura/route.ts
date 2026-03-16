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
  iniciante: { nome: 'Encantiva Pro — Iniciante', valor: 19.90, descricao: 'Plano Iniciante — acesso mensal' },
  avancado:  { nome: 'Encantiva Pro — Avançado',  valor: 34.90, descricao: 'Plano Avançado — acesso mensal'  },
  elite:     { nome: 'Encantiva Pro — Elite',      valor: 54.90, descricao: 'Plano Elite — acesso mensal'     },
}

const URL_SUCESSO = 'https://encantivapro.com.br/pagamento/sucesso'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

    const { plano } = await req.json()
    const config = PLANOS[plano]
    if (!config) return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 })

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('asaas_subscription_id, plano, status')
      .eq('usuario_id', user.id)
      .single()

    if (!assinatura?.asaas_subscription_id) {
      return NextResponse.json({ erro: 'Assinatura não encontrada.' }, { status: 404 })
    }

    if (assinatura.status !== 'active' && assinatura.status !== 'ativo') {
      return NextResponse.json({ erro: 'Assinatura não está ativa.' }, { status: 400 })
    }

    if (assinatura.plano === plano) {
      return NextResponse.json({ erro: 'Você já está neste plano.' }, { status: 400 })
    }

    const { key, url } = getAsaasConfig()

    // Atualiza a assinatura no Asaas com novo valor + callback de sucesso
    // updatePendingPayments: true → gera cobrança imediata da diferença proporcional (prorate)
    const res = await fetch(`${url}/subscriptions/${assinatura.asaas_subscription_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        access_token: key,
      },
      body: JSON.stringify({
        value:                 config.valor,
        description:           config.descricao,
        externalReference:     `${user.id}::${plano}`,
        updatePendingPayments: true,
        callback: {
          successUrl:   URL_SUCESSO,
          autoRedirect: true,
        },
      }),
    })

    const subAtualizada = await res.json()
    if (subAtualizada.errors || !subAtualizada.id) {
      throw new Error(`Erro Asaas: ${JSON.stringify(subAtualizada)}`)
    }

    // Busca cobrança de diferença (prorate) — é a mais recente com status PENDING
    const cobrancasRes = await fetch(
      `${url}/payments?subscription=${assinatura.asaas_subscription_id}&status=PENDING`,
      { headers: { accept: 'application/json', access_token: key } }
    )
    const cobrancas = await cobrancasRes.json()
    const cobrancaProrate = cobrancas?.data?.[0]
    const checkoutUrl = cobrancaProrate?.invoiceUrl ?? null

    // Atualiza plano no Supabase — status final confirmado pelo webhook
    await supabase
      .from('assinaturas')
      .update({ plano, atualizado_em: new Date().toISOString() })
      .eq('usuario_id', user.id)

    console.log('[atualizar-assinatura] upgrade de', assinatura.plano, '→', plano)

    return NextResponse.json({ ok: true, checkoutUrl, plano })

  } catch (err) {
    console.error('[atualizar-assinatura]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}