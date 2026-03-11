import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Mapeamento de eventos Asaas → status interno
const STATUS_MAP: Record<string, string> = {
  PAYMENT_CONFIRMED:        'active',
  PAYMENT_RECEIVED:         'active',
  PAYMENT_OVERDUE:          'overdue',
  PAYMENT_DELETED:          'canceled',
  PAYMENT_REFUNDED:         'canceled',
  SUBSCRIPTION_DELETED:     'canceled',
  // Asaas não tem SUBSCRIPTION_PAID, acompanha via cobranças
}

function verificarAssinatura(body: string, token: string): boolean {
  const secret = process.env.ASAAS_WEBHOOK_TOKEN
  if (!secret) return true // Se não configurado, aceita (dev)
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const asaasToken = req.headers.get('asaas-access-token') ?? ''

    if (!verificarAssinatura(body, asaasToken)) {
      return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const evento: string = payload.event

    console.log('[asaas-webhook] evento:', evento, payload)

    const supabase = await createClient()

    // ── Evento de cobrança ──────────────────────────────────────────
    if (evento.startsWith('PAYMENT_')) {
      const payment = payload.payment
      const subscriptionId: string | null = payment?.subscription ?? null
      if (!subscriptionId) return NextResponse.json({ ok: true })

      const novoStatus = STATUS_MAP[evento]
      if (!novoStatus) return NextResponse.json({ ok: true })

      // Extrai usuario_id e plano do externalReference da assinatura
      // externalReference = "userId::plano"
      const extRef: string = payment.externalReference ?? ''
      const [userId, plano] = extRef.split('::')

      if (userId) {
        const patch: Record<string, string> = {
          status:        novoStatus,
          atualizado_em: new Date().toISOString(),
        }
        if (novoStatus === 'active') {
          const expira = new Date()
          expira.setDate(expira.getDate() + 32) // margem de 2 dias
          patch.trial_expira_em = expira.toISOString()
          if (plano) patch.plano = plano
        }

        await supabase
          .from('assinaturas')
          .upsert({ usuario_id: userId, asaas_subscription_id: subscriptionId, ...patch }, { onConflict: 'usuario_id' })
      }
    }

    // ── Evento de assinatura cancelada ──────────────────────────────
    if (evento === 'SUBSCRIPTION_DELETED') {
      const sub = payload.subscription
      if (sub?.id) {
        await supabase
          .from('assinaturas')
          .update({ status: 'canceled', atualizado_em: new Date().toISOString() })
          .eq('asaas_subscription_id', sub.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[asaas-webhook]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}