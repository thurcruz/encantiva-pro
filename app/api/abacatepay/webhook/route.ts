import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET ?? ''

export async function POST(req: NextRequest) {
  try {
    const headerSecret = req.headers.get('x-abacatepay-secret') ?? ''
    if (WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const event: string = body.event ?? body.type ?? ''
    const data = body.data ?? body

    console.log('[AbacatePay Webhook]', event, JSON.stringify(data))

    const supabase = await createClient()

    const userId: string | undefined =
      data?.subscription?.metadata?.userId ??
      data?.metadata?.userId ??
      data?.userId

    const subscriptionId: string | undefined =
      data?.subscription?.id ??
      data?.id

    const periodEnd: string | undefined =
      data?.subscription?.currentPeriodEnd ??
      data?.currentPeriodEnd ??
      data?.expiresAt

    if (!userId) {
      console.warn('[AbacatePay Webhook] userId não encontrado no metadata')
      return NextResponse.json({ received: true })
    }

    switch (event) {
      case 'subscription.activated':
      case 'subscription.renewed':
      case 'billing.paid': {
        const expira_em = periodEnd
          ? new Date(periodEnd).toISOString()
          : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

        await supabase.from('assinaturas').upsert(
          {
            usuario_id: userId,
            status: 'ativo',
            expira_em,
            abacatepay_subscription_id: subscriptionId ?? null,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'usuario_id' }
        )
        break
      }

      case 'subscription.payment_failed':
      case 'billing.failed': {
        await supabase.from('assinaturas').upsert(
          {
            usuario_id: userId,
            status: 'inadimplente',
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'usuario_id' }
        )
        break
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        await supabase.from('assinaturas').upsert(
          {
            usuario_id: userId,
            status: 'cancelado',
            expira_em: periodEnd ? new Date(periodEnd).toISOString() : new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'usuario_id' }
        )
        break
      }

      default:
        console.log('[AbacatePay Webhook] Evento não tratado:', event)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[AbacatePay Webhook] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}