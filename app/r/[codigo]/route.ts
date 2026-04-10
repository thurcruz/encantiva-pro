import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const codigoUpper = codigo.toUpperCase()

  const supabase = createAdminClient()

  const { data: afiliado } = await supabase
    .from('afiliados')
    .select('id, ativo')
    .ilike('codigo', codigoUpper)
    .single()

  const redirectUrl = new URL('/planos', req.url)
  const response = NextResponse.redirect(redirectUrl)

  if (afiliado && afiliado.ativo) {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null
    const userAgent = req.headers.get('user-agent') ?? null

    await supabase.from('afiliados_cliques').insert({
      afiliado_id: afiliado.id,
      ip,
      user_agent: userAgent,
    })

    response.cookies.set('ref', codigoUpper, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    })
  }

  return response
}
