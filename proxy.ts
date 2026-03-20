import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Rotas do dashboard (com sidebar) — sem /admin ──
  const rotasDashboard = [
    '/inicio', '/agenda', '/calculadora', '/catalogo', '/clientes',
    '/configuracoes', '/contratos', '/financeiro', '/gerenciar-plano',
    '/materiais', '/paineis', '/acervo',
  ]

  const acessandoDashboard = rotasDashboard.some(rota =>
    pathname.startsWith(rota)
  )

  if (acessandoDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Admin standalone (sem sidebar) — requer login + email admin ──
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/inicio', request.url))
    }
  }

  // ── Logado tentando acessar login/cadastro/raiz ──
  const rotasAuth = ['/login', '/cadastro', '/']
  if (rotasAuth.includes(pathname) && user) {
    // Admin vai direto pro painel admin, usuário normal pro dashboard
    const destino = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? '/admin' : '/inicio'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/inicio/:path*',
    '/agenda/:path*',
    '/calculadora/:path*',
    '/catalogo/:path*',
    '/clientes/:path*',
    '/configuracoes/:path*',
    '/contratos/:path*',
    '/financeiro/:path*',
    '/gerenciar-plano/:path*',
    '/materiais/:path*',
    '/paineis/:path*',
    '/acervo/:path*',
    '/planos/:path*',
    '/admin/:path*',
    '/cortador-de-paineis/:path*',
    '/pagamento/:path*',
    '/login',
    '/cadastro',
  ],
}