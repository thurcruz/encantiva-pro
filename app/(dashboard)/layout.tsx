import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, LayoutDashboard, Upload, Calculator } from 'lucide-react'
import NavItem from './componentes/NavItem'
import BotaoLogout from './componentes/BotaoLogout'


export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#140033' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        minHeight: '100vh',
        background: '#0d0022',
        borderRight: '1px solid #ffffff0f',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          padding: '28px 24px',
          borderBottom: '1px solid #ffffff0f',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <svg viewBox="0 0 144 108" width="36" height="27" style={{ flexShrink: 0 }}>
            <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
            <circle fill="#9900ff" cx="108" cy="36" r="36"/>
          </svg>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '15px',
            color: '#fff',
            margin: 0,
            letterSpacing: '-0.3px',
          }}>
            Encantiva Pro
          </p>
        </div>

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            color: '#ffffff33',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '8px 12px',
            margin: '0 0 4px 0',
          }}>
            Menu
          </p>

          <NavItem
            href="/materiais"
            icon={<Package size={16} style={{ color: '#ff33cc' }} />}
            label="Materiais"
          />

          <NavItem
            href="/calculadora"
            icon={<Calculator size={16} style={{ color: '#ff33cc' }} />}
            label="Calculadora"
          />

          {isAdmin && (
            <>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: 600,
                color: '#ffffff33',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '8px 12px',
                margin: '16px 0 4px 0',
              }}>
                Admin
              </p>

              <NavItem
                href="/admin"
                icon={<LayoutDashboard size={16} style={{ color: '#9900ff' }} />}
                label="Painel Admin"
              />
              <NavItem
                href="/admin/materiais/novo"
                icon={<Upload size={16} style={{ color: '#9900ff' }} />}
                label="Novo Material"
              />
              <NavItem
                href="/admin/materiais"
                icon={<Package size={16} style={{ color: '#9900ff' }} />}
                label="Ver Materiais"
              />
            </>
          )}
        </nav>

        {/* Usuário + Logout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #ffffff0f',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            marginBottom: '4px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '13px',
              color: '#fff',
              flexShrink: 0,
            }}>
              {user.email?.[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffffcc',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {isAdmin ? 'Admin' : 'Assinante'}
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                color: '#ffffff44',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user.email}
              </p>
            </div>
          </div>

          <BotaoLogout />
        </div>
      </aside>

      
      {/* Conteúdo principal */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}