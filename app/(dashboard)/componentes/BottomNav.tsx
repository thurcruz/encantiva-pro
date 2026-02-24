'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Package, Calculator, FileText, Settings, LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const itens = [
    { href: '/materiais', icon: Package, label: 'Materiais' },
    { href: '/calculadora', icon: Calculator, label: 'Calculadora' },
    { href: '/contratos', icon: FileText, label: 'Contratos' },
    { href: '/configuracoes', icon: Settings, label: 'Config.' },
    ...(isAdmin ? [{ href: '/admin', icon: LayoutDashboard, label: 'Admin' }] : []),
  ]

  return (
    <nav className="bottom-nav-mobile" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px', background: '#0d0022',
      borderTop: '1px solid #ffffff12',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-around', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {itens.map(({ href, icon: Icon, label }) => {
        const ativo = pathname.startsWith(href)
        return (
          <Link key={href} href={href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '3px', padding: '8px 12px', textDecoration: 'none', flex: 1,
          }}>
            <Icon size={20} style={{ color: ativo ? '#ff33cc' : '#ffffff44', transition: 'color 0.2s' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '10px',
              fontWeight: ativo ? 700 : 400,
              color: ativo ? '#ff33cc' : '#ffffff44',
              transition: 'color 0.2s',
            }}>
              {label}
            </span>
          </Link>
        )
      })}

      {/* Botão sair */}
      <button onClick={handleLogout} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '3px', padding: '8px 12px', flex: 1,
        background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <LogOut size={20} style={{ color: '#ffffff44' }} />
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: '10px',
          fontWeight: 400, color: '#ffffff44',
        }}>
          Sair
        </span>
      </button>
    </nav>
  )
}