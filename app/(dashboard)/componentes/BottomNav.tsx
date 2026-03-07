'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home, Package, CalendarDays, Users, TrendingUp,
  LayoutTemplate, ShoppingBag, FileText, Calculator, Clock,
  BarChart2, Scissors,
  type LucideIcon,
} from 'lucide-react'

interface Item {
  href: string
  icon: LucideIcon
  label: string
  atalho?: boolean
  emBreve?: boolean
}

interface Grupo {
  id: string
  label: string
  icon: LucideIcon
  rotas: string[]
  itens: Item[]
}

const GRUPOS: Grupo[] = [
  {
    id: 'inicio',
    label: 'Início',
    icon: Home,
    rotas: ['/inicio'],
    itens: [
      { href: '/inicio', icon: BarChart2, label: 'Dashboard' },
      { href: '/agenda', icon: CalendarDays, label: 'Próximos eventos', atalho: true },
      { href: '/financeiro', icon: TrendingUp, label: 'Financeiro', atalho: true },
    ],
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: CalendarDays,
    rotas: ['/agenda', '/catalogo'],
    itens: [
      { href: '/agenda', icon: CalendarDays, label: 'Agenda' },
      { href: '/catalogo', icon: ShoppingBag, label: 'Catálogo' },
    ],
  },
  {
    id: 'materiais',
    label: 'Materiais',
    icon: Package,
    rotas: ['/materiais', '/paineis'],
    itens: [
      { href: '/materiais', icon: Package, label: 'Biblioteca' },
      { href: '/paineis', icon: Scissors, label: 'Criador de Painéis' },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
    rotas: ['/clientes', '/contratos'],
    itens: [
      { href: '/clientes', icon: Users, label: 'Lista de Clientes' },
      { href: '/contratos', icon: FileText, label: 'Contratos' },
      { href: '#', icon: Clock, label: 'Fidelidade', emBreve: true },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: TrendingUp,
    rotas: ['/financeiro', '/calculadora'],
    itens: [
      { href: '/financeiro', icon: TrendingUp, label: 'Dashboard' },
      { href: '/calculadora', icon: Calculator, label: 'Calculadora' },
    ],
  },
]

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)

  function toggleGrupo(id: string) {
    setGrupoAberto(prev => prev === id ? null : id)
  }

  function fechar() {
    setGrupoAberto(null)
  }

  return (
    <>
      {/* Overlay para fechar */}
      {grupoAberto && (
        <div
          onClick={fechar}
          style={{
            position: 'fixed', inset: 0, zIndex: 48,
            background: 'rgba(20,0,51,0.5)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Submenus */}
      {GRUPOS.map(grupo => {
        if (grupoAberto !== grupo.id) return null
        const larguraItem = `${100 / GRUPOS.length}%`
        const indice = GRUPOS.findIndex(g => g.id === grupo.id)
        // Posição horizontal centrada no botão
        const left = `calc(${indice} * ${larguraItem} + ${larguraItem} / 2)`

        return (
          <div
            key={grupo.id}
            style={{
              position: 'fixed',
              bottom: '76px',
              left,
              transform: 'translateX(-50%)',
              zIndex: 49,
              background: '#0d0022',
              border: '1px solid #ffffff14',
              borderRadius: '18px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
              minWidth: '200px',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Label do grupo */}
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600,
              color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '6px 12px 4px', margin: 0,
            }}>
              {grupo.label}
            </p>

            {grupo.itens.map(({ href, icon: Icon, label, emBreve }) => {
              const ativo = pathname === href || pathname.startsWith(href + '/')
              if (emBreve) {
                return (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px',
                    opacity: 0.4, cursor: 'not-allowed',
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '9px',
                      background: '#ffffff0a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} style={{ color: '#ffffff55' }} />
                    </div>
                    <div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#ffffff77' }}>
                        {label}
                      </span>
                      <span style={{
                        marginLeft: '6px', fontFamily: 'Inter, sans-serif', fontSize: '9px',
                        fontWeight: 700, color: '#ff33cc', background: 'rgba(255,51,204,0.15)',
                        padding: '2px 6px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        Em breve
                      </span>
                    </div>
                  </div>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={fechar}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px', textDecoration: 'none',
                    background: ativo
                      ? 'linear-gradient(135deg, rgba(255,51,204,0.15), rgba(153,0,255,0.15))'
                      : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                    background: ativo
                      ? 'linear-gradient(135deg, rgba(255,51,204,0.25), rgba(153,0,255,0.25))'
                      : '#ffffff0a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} style={{ color: ativo ? '#ff33cc' : '#ffffff77' }} />
                  </div>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '14px',
                    fontWeight: ativo ? 700 : 500,
                    color: ativo ? '#ff33cc' : '#ffffffcc',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        )
      })}

      {/* Barra inferior */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '64px', background: '#0d0022',
        borderTop: '1px solid #ffffff12',
        display: 'flex', alignItems: 'center',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="bottom-nav-mobile">
        {GRUPOS.map(({ id, label, icon: Icon, rotas }) => {
          const ativo = rotas.some(r => pathname === r || pathname.startsWith(r + '/'))
          const aberto = grupoAberto === id

          return (
            <button
              key={id}
              onClick={() => toggleGrupo(id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '3px', padding: '8px 4px',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '11px',
                background: aberto
                  ? 'linear-gradient(135deg, #ff33cc, #9900ff)'
                  : ativo
                  ? 'linear-gradient(135deg, rgba(255,51,204,0.2), rgba(153,0,255,0.2))'
                  : 'transparent',
                border: !aberto && ativo ? '1px solid rgba(255,51,204,0.3)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: aberto ? '0 4px 14px rgba(255,51,204,0.4)' : 'none',
              }}>
                <Icon size={18} style={{
                  color: aberto ? '#fff' : ativo ? '#ff33cc' : '#ffffff44',
                }} />
              </div>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: '10px',
                fontWeight: aberto || ativo ? 700 : 400,
                color: aberto ? '#ff33cc' : ativo ? '#ff33cc' : '#ffffff44',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}