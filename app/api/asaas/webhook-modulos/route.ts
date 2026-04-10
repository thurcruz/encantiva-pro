import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

function verificarToken(token: string): boolean {
  const secret = process.env.ASAAS_WEBHOOK_MODULOS_TOKEN
  if (!secret) return true
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('asaas-access-token') ?? ''
    if (!verificarToken(token)) {
      return NextResponse.json({ erro: 'Token invalido' }, { status: 401 })
    }
    const payload = await req.json()
    const evento: string = payload.event

    if (evento !== 'PAYMENT_CONFIRMED' && evento !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ ok: true })
    }

    const payment = payload.payment
    if (!payment?.id) return NextResponse.json({ ok: true })

    const extRef: string = payment?.externalReference ?? ''

    // So processa se for referencia de modulo avulso
    if (!extRef || !extRef.includes('::modulo::')) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    await supabase
      .from('modulos_avulsos')
      .update({ status: 'active' })
      .eq('asaas_payment_id', payment.id)

    console.log('[webhook-modulos] modulo ativado para payment:', payment.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook-modulos]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}