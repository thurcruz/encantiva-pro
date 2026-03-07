'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, TrendingUp, CalendarDays, Users, LayoutTemplate, Package, FileText, Calculator, ShoppingBag, LayoutDashboard, Grid2X2, X, Settings } from 'lucide-react'

const FIXOS = [
  { href: '/inicio', icon: Home, label: 'Início', grupo: ['/inicio'] },
  { href: '/agenda', icon: CalendarDays, label: 'Pedidos', grupo: ['/agenda', '/catalogo'] },
  { href: '/financeiro', icon: TrendingUp, label: 'Financeiro', grupo: ['/financeiro', '/calculadora'] },
  { href: '/clientes', icon: Users, label: 'Clientes', grupo: ['/clientes'] },
]

const MAIS = [
  { href: '/paineis', icon: LayoutTemplate, label: 'Painéis' },
  { href: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
  { href: '/materiais', icon: Package, label: 'Materiais' },
  { href: '/contratos', icon: FileText, label: 'Contratos' },
  { href: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { href: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  const maisItens = [
    ...MAIS,
    ...(isAdmin ? [{ href: '/admin', icon: LayoutDashboard, label: 'Admin' }] : []),
  ]

  const maisAtivo = maisItens.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))

  return (
    <>
      {menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }} />
      )}

      {menuAberto && (
        <div style={{
          position: 'fixed', bottom: '72px', right: '12px', zIndex: 49,
          background: '#0d0022', border: '1px solid #ffffff14',
          borderRadius: '20px', padding: '8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          minWidth: '190px', animation: 'slideUp 0.2s ease',
        }}>
          {maisItens.map(({ href, icon: Icon, label }) => {
            const ativo = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={() => setMenuAberto(false)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
                background: ativo ? 'linear-gradient(135deg, rgba(255,51,204,0.15), rgba(153,0,255,0.15))' : 'transparent',
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                  background: ativo ? 'linear-gradient(135deg, rgba(255,51,204,0.25), rgba(153,0,255,0.25))' : '#ffffff0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} style={{ color: ativo ? '#ff33cc' : '#ffffff77' }} />
                </div>
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '14px',
                  fontWeight: ativo ? 700 : 500,
                  color: ativo ? '#ff33cc' : '#ffffffcc',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      <nav className="bottom-nav-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '64px', background: '#0d0022',
        borderTop: '1px solid #ffffff12',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {FIXOS.map(({ href, icon: Icon, label, grupo }) => {
          const ativo = grupo.some(g => pathname === g || pathname.startsWith(g + '/'))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '8px 12px', textDecoration: 'none', flex: 1,
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

        <button onClick={() => setMenuAberto(v => !v)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '3px', padding: '8px 12px', flex: 1,
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: menuAberto || maisAtivo ? 'linear-gradient(135deg, rgba(255,51,204,0.2), rgba(153,0,255,0.2))' : 'transparent',
            border: menuAberto || maisAtivo ? '1px solid rgba(255,51,204,0.3)' : '1px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {menuAberto
              ? <X size={18} style={{ color: '#ff33cc' }} />
              : <Grid2X2 size={18} style={{ color: maisAtivo ? '#ff33cc' : '#ffffff44' }} />
            }
          </div>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: '10px',
            fontWeight: menuAberto || maisAtivo ? 700 : 400,
            color: menuAberto || maisAtivo ? '#ff33cc' : '#ffffff44',
          }}>
            Mais
          </span>
        </button>

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </nav>
    </>
  )
}