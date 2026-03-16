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

  // ── Atualiza sessão em TODAS as requests (mantém login persistente) ──
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Rotas do dashboard — redireciona para login se não autenticado ──
  // NOTA: /planos e /cortador-de-paineis são públicos — NÃO estão nessa lista
  const rotasDashboard = [
    '/inicio', '/agenda', '/calculadora', '/catalogo', '/clientes',
    '/configuracoes', '/contratos', '/financeiro', '/gerenciar-plano',
    '/materiais', '/paineis', '/acervo', '/admin',
  ]

  const acessandoDashboard = rotasDashboard.some(rota =>
    pathname.startsWith(rota)
  )

  if (acessandoDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Se já está logado e tenta acessar login/cadastro/raiz → vai pro início ──
  const rotasAuth = ['/login', '/cadastro', '/']
  if (rotasAuth.includes(pathname) && user) {
    return NextResponse.redirect(new URL('/inicio', request.url))
  }

  // ── Admin ──
  if (pathname.startsWith('/admin')) {
    if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/inicio', request.url))
    }
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