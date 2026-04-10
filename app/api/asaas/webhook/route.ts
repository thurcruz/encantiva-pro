import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarConversaoAfiliado } from '../../afiliados/helper'
import crypto from 'crypto'

const STATUS_MAP: Record<string, string> = {
  PAYMENT_CONFIRMED:    'active',
  PAYMENT_RECEIVED:     'active',
  PAYMENT_DELETED:      'canceled',
  PAYMENT_REFUNDED:     'canceled',
  SUBSCRIPTION_DELETED: 'canceled',
}

// Eventos que NAO devem sobrescrever um status 'active' existente
const NAO_REBAIXAR_ACTIVE = new Set(['PAYMENT_OVERDUE'])

function verificarToken(token: string): boolean {
  const secret = process.env.ASAAS_WEBHOOK_TOKEN
  if (!secret) return true
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
      return NextResponse.json({ erro: 'Token invalido' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const evento: string = payload.event
    console.log('[asaas-webhook] evento:', evento)

    const supabase = createAdminClient()

    // ── Eventos de cobrança ──────────────────────────────
    if (evento.startsWith('PAYMENT_')) {
      const payment = payload.payment
      const subscriptionId: string | null = payment?.subscription ?? null
      if (!subscriptionId) return NextResponse.json({ ok: true })

      // PAYMENT_OVERDUE: so rebaixa se a assinatura NAO estiver active
      if (NAO_REBAIXAR_ACTIVE.has(evento)) {
        const { data: atual } = await supabase
          .from('assinaturas')
          .select('status')
          .eq('asaas_subscription_id', subscriptionId)
          .maybeSingle()

        if (atual?.status === 'active') {
          console.log('[asaas-webhook] ignorando', evento, '— assinatura ja esta active')
          return NextResponse.json({ ok: true })
        }

        await supabase
          .from('assinaturas')
          .update({ status: 'overdue', atualizado_em: new Date().toISOString() })
          .eq('asaas_subscription_id', subscriptionId)

        return NextResponse.json({ ok: true })
      }

      const novoStatus = STATUS_MAP[evento]
      if (!novoStatus) return NextResponse.json({ ok: true })

      const extRef: string = payment.externalReference ?? ''
      const [userId, plano] = extRef.split('::')

      console.log('[asaas-webhook] userId:', userId, '| plano:', plano, '| novoStatus:', novoStatus)

      if (userId) {
        const patch: Record<string, string | null> = {
          status:        novoStatus,
          atualizado_em: new Date().toISOString(),
        }

        if (novoStatus === 'active') {
          patch.trial_expira_em = null
          if (plano) patch.plano = plano

          if (userId && payment?.id) {
            await registrarConversaoAfiliado(userId, plano ?? '', payment.value ?? 0, payment.id)
          }
        }

        const { data, error } = await supabase
          .from('assinaturas')
          .update(patch)
          .eq('usuario_id', userId)
          .select()

        console.log('[asaas-webhook] update resultado:', JSON.stringify({ data, error }))

        if (error || !data?.length) {
          console.log('[asaas-webhook] nenhuma linha atualizada, tentando upsert...')
          const { data: data2, error: error2 } = await supabase
            .from('assinaturas')
            .upsert(
              { usuario_id: userId, asaas_subscription_id: subscriptionId, ...patch },
              { onConflict: 'usuario_id' }
            )
          console.log('[asaas-webhook] upsert resultado:', JSON.stringify({ data2, error2 }))
        }
      }
    }

    // ── Assinatura cancelada ─────────────────────────────
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