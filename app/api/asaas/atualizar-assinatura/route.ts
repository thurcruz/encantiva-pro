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

// Calcula o valor proporcional dos dias restantes do ciclo atual
function calcularProrate(valorAtual: number, valorNovo: number, diasRestantes: number): number {
  const diferencaDiaria = (valorNovo - valorAtual) / 30
  const prorate = diferencaDiaria * diasRestantes
  return Math.max(0, Math.round(prorate * 100) / 100) // arredonda 2 casas, mínimo 0
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

    const { plano } = await req.json()
    const configNovo = PLANOS[plano]
    if (!configNovo) return NextResponse.json({ erro: 'Plano inválido' }, { status: 400 })

    // Busca assinatura + dados do cliente no Supabase
    const [{ data: assinatura }, { data: perfil }] = await Promise.all([
      supabase
        .from('assinaturas')
        .select('asaas_subscription_id, asaas_customer_id, plano, status')
        .eq('usuario_id', user.id)
        .single(),
      supabase
        .from('perfis')
        .select('asaas_customer_id')
        .eq('id', user.id)
        .single(),
    ])

    if (!assinatura?.asaas_subscription_id) {
      return NextResponse.json({ erro: 'Assinatura não encontrada.' }, { status: 404 })
    }
    if (assinatura.status !== 'active' && assinatura.status !== 'ativo') {
      return NextResponse.json({ erro: 'Assinatura não está ativa.' }, { status: 400 })
    }
    if (assinatura.plano === plano) {
      return NextResponse.json({ erro: 'Você já está neste plano.' }, { status: 400 })
    }

    const configAtual = PLANOS[assinatura.plano]
    const valorAtual  = configAtual?.valor ?? 0
    const valorNovo   = configNovo.valor
    const isUpgrade   = valorNovo > valorAtual

    const { key, url } = getAsaasConfig()
    const customerId = perfil?.asaas_customer_id ?? assinatura.asaas_customer_id

    if (!customerId) {
      return NextResponse.json({ erro: 'Cliente Asaas não encontrado.' }, { status: 400 })
    }

    // ── UPGRADE: cria cobrança avulsa pelo prorate ──────────────────────────
    if (isUpgrade) {
      // Busca a próxima cobrança da assinatura para saber o próximo vencimento
      const proximaCobrancaRes = await fetch(
        `${url}/payments?subscription=${assinatura.asaas_subscription_id}&status=PENDING`,
        { headers: { accept: 'application/json', access_token: key } }
      )
      const proximaCobrancaJson = await proximaCobrancaRes.json()
      const proximaCobranca     = proximaCobrancaJson?.data?.[0]

      // Calcula dias restantes até o próximo vencimento
      let diasRestantes = 15 // fallback de meio ciclo
      if (proximaCobranca?.dueDate) {
        const hoje      = new Date()
        const vencimento = new Date(proximaCobranca.dueDate)
        diasRestantes   = Math.max(1, Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)))
        diasRestantes   = Math.min(diasRestantes, 30) // máximo 30 dias
      }

      const valorProrate = calcularProrate(valorAtual, valorNovo, diasRestantes)

      // Cria cobrança avulsa pelo valor proporcional
      // O externalReference usa o formato userId::planNovo para o webhook ativar o plano certo
      const hoje = new Date()
      const dueDateStr = hoje.toISOString().split('T')[0]

      const cobrancaRes = await fetch(`${url}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
        body: JSON.stringify({
          customer:          customerId,
          billingType:       'UNDEFINED',
          dueDate:           dueDateStr,
          value:             valorProrate,
          description:       `Upgrade para ${configNovo.nome} — proporcional (${diasRestantes} dias)`,
          externalReference: `${user.id}::${plano}`,
          callback: {
            successUrl:   URL_SUCESSO,
            autoRedirect: true,
          },
        }),
      })

      const cobranca = await cobrancaRes.json()
      if (!cobranca.id) {
        throw new Error(`Erro ao criar cobrança: ${JSON.stringify(cobranca)}`)
      }

      // Atualiza assinatura no Asaas com novo valor (para próximo ciclo)
      // NÃO atualiza o plano no Supabase aqui — o webhook faz isso após pagamento
      await fetch(`${url}/subscriptions/${assinatura.asaas_subscription_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
        body: JSON.stringify({
          value:             valorNovo,
          description:       configNovo.descricao,
          externalReference: `${user.id}::${plano}`,
        }),
      })

      const checkoutUrl = cobranca.invoiceUrl ?? null

      console.log(`[atualizar-assinatura] upgrade ${assinatura.plano} → ${plano} | prorate: R$${valorProrate} | ${diasRestantes} dias`)

      return NextResponse.json({
        ok: true,
        checkoutUrl,
        valorProrate,
        diasRestantes,
        plano,
      })
    }

    // ── DOWNGRADE: sem cobrança, só atualiza a assinatura no Asaas ─────────
    // Não atualiza o plano no Supabase — aguarda próximo ciclo de cobrança
    // O webhook atualizará quando a próxima cobrança (com novo valor) for paga
    await fetch(`${url}/subscriptions/${assinatura.asaas_subscription_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', accept: 'application/json', access_token: key },
      body: JSON.stringify({
        value:             valorNovo,
        description:       configNovo.descricao,
        externalReference: `${user.id}::${plano}`,
      }),
    })

    // Para downgrade atualiza o plano imediatamente no Supabase
    // (não há risco: o acesso vai diminuir, não aumentar)
    await supabase
      .from('assinaturas')
      .update({ plano, atualizado_em: new Date().toISOString() })
      .eq('usuario_id', user.id)

    console.log(`[atualizar-assinatura] downgrade ${assinatura.plano} → ${plano}`)

    return NextResponse.json({ ok: true, checkoutUrl: null, plano })

  } catch (err) {
    console.error('[atualizar-assinatura]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}