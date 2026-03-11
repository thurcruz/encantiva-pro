import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getAsaasConfig() {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY não configurada')

  const url = process.env.ASAAS_SANDBOX === 'true'
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3'

  return { key, url }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('asaas_subscription_id')
      .eq('usuario_id', user.id)
      .single()

    if (!assinatura?.asaas_subscription_id) {
      return NextResponse.json({ erro: 'Assinatura não encontrada' }, { status: 404 })
    }

    const { key, url } = getAsaasConfig()

    const res = await fetch(`${url}/subscriptions/${assinatura.asaas_subscription_id}`, {
      method: 'DELETE',
      headers: { accept: 'application/json', access_token: key },
    })

    if (!res.ok) {
      const erro = await res.json()
      throw new Error(`Asaas: ${JSON.stringify(erro)}`)
    }

    await supabase
      .from('assinaturas')
      .update({ status: 'canceled', atualizado_em: new Date().toISOString() })
      .eq('usuario_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cancelar-assinatura]', err)
    return NextResponse.json({ erro: String(err) }, { status: 500 })
  }
}