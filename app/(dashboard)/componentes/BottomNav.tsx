'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home, Package, CalendarDays, Users, TrendingUp,
  ShoppingBag, FileText, Calculator, Clock,
  BarChart2, Scissors, Archive,
  type LucideIcon,
} from 'lucide-react'

interface Item {
  href: string
  icon: LucideIcon
  label: string
  atalho?: boolean
  emBreve?: boolean
  eliteOnly?: boolean
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
    id: 'gestorPedidos',
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
    id: 'listaClientes',
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
    rotas: ['/financeiro', '/calculadora', '/acervo'],
    itens: [
      { href: '/financeiro', icon: TrendingUp, label: 'Dashboard' },
      { href: '/calculadora', icon: Calculator, label: 'Calculadora' },
      { href: '/acervo', icon: Archive, label: 'Acervo', eliteOnly: true },
    ],
  },
]

function submenuPos(indice: number, total: number) {
  if (indice === 0) return { left: '8px', right: 'auto', transform: 'none' }
  if (indice === total - 1) return { left: 'auto', right: '8px', transform: 'none' }
  const pct = ((indice + 0.5) / total) * 100
  return { left: `${pct}%`, right: 'auto', transform: 'translateX(-50%)' }
}

export default function BottomNav({ temAcervo }: { isAdmin: boolean; isBeta: boolean; temAcervo: boolean }) {
  const pathname = usePathname()
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)

  function toggleGrupo(id: string) {
    setGrupoAberto(prev => (prev === id ? null : id))
  }

  function fechar() {
    setGrupoAberto(null)
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .submenu-anchored {
          animation: slideUp 0.18s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }
        @keyframes slideUpCenter {
          from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .submenu-centered {
          animation: slideUpCenter 0.18s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }
        .submenu-link {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 12px; border-radius: 12px;
          text-decoration: none; transition: background 0.15s;
        }
        .submenu-link:hover { background: rgba(153,0,255,0.14) !important; }
        .nav-btn:hover .nav-icon-bg { background: rgba(255,255,255,0.07) !important; }
      `}</style>

      {/* Overlay */}
      {grupoAberto && (
        <div onClick={fechar} style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(6,0,15,0.65)', backdropFilter: 'blur(4px)' }} />
      )}

      {/* Submenus flutuantes */}
      {GRUPOS.map((grupo, indice) => {
        if (grupoAberto !== grupo.id) return null
        const pos = submenuPos(indice, GRUPOS.length)
        const isCentered = indice > 0 && indice < GRUPOS.length - 1

        // Filtra itens do acervo se não tiver acesso
        const itensVisiveis = grupo.itens.filter(item => {
          if (item.eliteOnly && !temAcervo) return false
          return true
        })

        return (
          <div
            key={grupo.id}
            className={isCentered ? 'submenu-centered' : 'submenu-anchored'}
            style={{
              position: 'fixed', bottom: '80px',
              left: pos.left, right: pos.right, transform: pos.transform,
              zIndex: 49,
              background: 'rgba(11,0,28,0.97)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '20px', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              boxShadow: '0 -2px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(153,0,255,0.08)',
              minWidth: '210px', backdropFilter: 'blur(24px)',
            }}
          >
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 12px 6px', margin: 0 }}>
              {grupo.label}
            </p>

            {itensVisiveis.map(({ href, icon: Icon, label, emBreve }) => {
              const ativo = pathname === href || pathname.startsWith(href + '/')

              if (emBreve) {
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', borderRadius: '12px', opacity: 0.35, cursor: 'not-allowed' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color="rgba(255,255,255,0.4)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '9px', fontWeight: 800, color: '#ff33cc', background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.2)', padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Em breve</span>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={fechar}
                  className="submenu-link"
                  style={{ background: ativo ? 'linear-gradient(135deg, rgba(153,0,255,0.2), rgba(255,51,204,0.1))' : 'transparent' }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0, background: ativo ? 'linear-gradient(135deg, rgba(153,0,255,0.4), rgba(255,51,204,0.25))' : 'rgba(255,255,255,0.06)', border: ativo ? '1px solid rgba(153,0,255,0.3)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={ativo ? '#cc66ff' : 'rgba(255,255,255,0.7)'} />
                  </div>
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '14px', fontWeight: ativo ? 700 : 500, color: ativo ? '#cc66ff' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        )
      })}

      {/* Barra de navegação */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', background: 'rgba(10,0,26,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: '4px', paddingRight: '4px' }}>
        {GRUPOS.map(({ id, label, icon: Icon, rotas }) => {
          const ativo = rotas.some(r => pathname === r || pathname.startsWith(r + '/'))
          const aberto = grupoAberto === id

          return (
            <button
              key={id}
              onClick={() => toggleGrupo(id)}
              className="nav-btn"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 2px', background: 'none', border: 'none', cursor: 'pointer', minWidth: 0 }}
            >
              <div
                className="nav-icon-bg"
                style={{ width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', background: aberto ? 'linear-gradient(135deg, #9900ff, #cc33ff)' : ativo ? 'rgba(153,0,255,0.18)' : 'transparent', border: aberto ? '1px solid rgba(204,51,255,0.5)' : ativo ? '1px solid rgba(153,0,255,0.3)' : '1px solid transparent', boxShadow: aberto ? '0 4px 18px rgba(153,0,255,0.5)' : 'none' }}
              >
                <Icon size={20} color={aberto ? '#ffffff' : ativo ? '#cc66ff' : 'rgba(255,255,255,0.6)'} />
              </div>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '10px', fontWeight: aberto || ativo ? 700 : 400, color: aberto || ativo ? '#cc66ff' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', letterSpacing: aberto || ativo ? '0.2px' : '0', lineHeight: 1 }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}