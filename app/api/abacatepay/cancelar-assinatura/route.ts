import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('abacatepay_subscription_id, status')
      .eq('usuario_id', user.id)
      .single()

    if (!assinatura?.abacatepay_subscription_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 400 })
    }

    if (assinatura.status === 'cancelado') {
      return NextResponse.json({ error: 'Assinatura já cancelada.' }, { status: 400 })
    }

    const cancelRes = await fetch(
      `https://api.abacatepay.com/v1/billing/subscription/${assinatura.abacatepay_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACATEPAY_SECRET_KEY}`,
        },
      }
    )

    const cancelData = await cancelRes.json()

    if (!cancelRes.ok) {
      console.error('AbacatePay cancel error:', cancelData)
      return NextResponse.json({ error: 'Erro ao cancelar no AbacatePay.' }, { status: 500 })
    }

    await supabase.from('assinaturas').update({
      status: 'cancelando',
      atualizado_em: new Date().toISOString(),
    }).eq('usuario_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro cancelar-assinatura:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}