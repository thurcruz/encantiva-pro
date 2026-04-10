import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ASAAS_URL = process.env.ASAAS_API_URL ?? 'https://api.asaas.com/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY!

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ pago: false })

  try {
    const res = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
      headers: { 'access_token': ASAAS_KEY },
    })
    const data = await res.json()

    const pago = data.status === 'CONFIRMED' || data.status === 'RECEIVED'

    if (pago) {
      // Ativar modulo no banco
      const supabase = createAdminClient()
      await supabase
        .from('modulos_avulsos')
        .update({ status: 'active' })
        .eq('asaas_payment_id', paymentId)
    }

    return NextResponse.json({ pago, status: data.status })
  } catch (err) {
    console.error('[modulos/verificar]', err)
    return NextResponse.json({ pago: false })
  }
}