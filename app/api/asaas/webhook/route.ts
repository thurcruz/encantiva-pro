import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_CONFIRMED:    'active',
  PAYMENT_RECEIVED:     'active',
  PAYMENT_OVERDUE:      'overdue',
  PAYMENT_DELETED:      'canceled',
  PAYMENT_REFUNDED:     'canceled',
  SUBSCRIPTION_DELETED: 'canceled',
}

function verificarToken(token: string): boolean {
  const secret = process.env.ASAAS_WEBHOOK_TOKEN
  if (!secret) return true // dev sem token configurado
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const token = req.headers.get('asaas-access-token') ?? ''

    if (!verificarToken(token)) {
      return NextResponse.json({ erro: 'Token inválido' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const evento: string = payload.event
    console.log('[asaas-webhook] evento:', evento)

    const supabase = await createClient()

    // Eventos de cobrança
    if (evento.startsWith('PAYMENT_')) {
      const payment = payload.payment
      const subscriptionId: string | null = payment?.subscription ?? null
      if (!subscriptionId) return NextResponse.json({ ok: true })

      const novoStatus = STATUS_MAP[evento]
      if (!novoStatus) return NextResponse.json({ ok: true })

      const extRef: string = payment.externalReference ?? ''
      const [userId, plano] = extRef.split('::')

      if (userId) {
        const patch: Record<string, string> = {
          status:        novoStatus,
          atualizado_em: new Date().toISOString(),
        }
        if (novoStatus === 'active') {
          const expira = new Date()
          expira.setDate(expira.getDate() + 32)
          patch.trial_expira_em = expira.toISOString()
          if (plano) patch.plano = plano
        }

        await supabase
          .from('assinaturas')
          .upsert(
            { usuario_id: userId, asaas_subscription_id: subscriptionId, ...patch },
            { onConflict: 'usuario_id' }
          )
      }
    }

    // Assinatura cancelada
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