'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, Package, FileText, Users, Settings, LayoutTemplate, ShoppingBag, Calculator, LayoutDashboard } from 'lucide-react'

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const itens = [
    { href: '/inicio', icon: Home, label: 'Início' },
    { href: '/financeiro', icon: TrendingUp, label: 'Financeiro' },
    { href: '/materiais', icon: Package, label: 'Materiais' },
    { href: '/contratos', icon: FileText, label: 'Contratos' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
    { href: '/calculadora', icon: Calculator, label: 'Calculadora' },
    { href: '/paineis', icon: LayoutTemplate, label: 'Painéis' },
    { href: '/configuracoes', icon: Settings, label: 'Config.' },
    ...(isAdmin ? [{ href: '/admin', icon: LayoutDashboard, label: 'Admin' }] : []),
  ]

  return (
    <nav className="bottom-nav-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px', background: '#0d0022',
      borderTop: '1px solid #ffffff12',
      display: 'flex', alignItems: 'center',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <style>{`
        .bottom-nav-mobile::-webkit-scrollbar { display: none; }  
      `}</style>
      {itens.map(({ href, icon: Icon, label }) => {
        const ativo = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '3px', padding: '8px 14px', textDecoration: 'none',
            flexShrink: 0,
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: ativo ? 'linear-gradient(135deg, rgba(255,51,204,0.2), rgba(153,0,255,0.2))' : 'transparent',
              border: ativo ? '1px solid rgba(255,51,204,0.3)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <Icon size={18} style={{ color: ativo ? '#ff33cc' : '#ffffff44' }} />
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '10px',
              fontWeight: ativo ? 700 : 400,
              color: ativo ? '#ff33cc' : '#ffffff44',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}