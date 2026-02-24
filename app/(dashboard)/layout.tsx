import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavItem from './componentes/NavItem'
import BotaoLogout from './componentes/BotaoLogout'
import BottomNav from './componentes/BottomNav'
import { Package, LayoutDashboard, Upload, Calculator, FileText, Settings } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, expira_em, trial_expira_em')
    .eq('usuario_id', user.id)
    .single()

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const agora = new Date()
  const isTrial = assinatura?.trial_expira_em && new Date(assinatura.trial_expira_em) > agora
  const diasRestantes = isTrial
    ? Math.ceil((new Date(assinatura.trial_expira_em!).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome_loja')
    .eq('id', user.id)
    .single()

  const inicial = (perfil?.nome_loja ?? user.email ?? 'U')[0].toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#140033' }}>

      {/* Sidebar — apenas desktop */}
      <aside style={{
        width: '240px', flexShrink: 0, background: '#0d0022',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40,
      }} className="sidebar-desktop">

        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #ffffff08' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg viewBox="0 0 144 108" width="28" height="21">
              <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
              <circle fill="#9900ff" cx="108" cy="36" r="36"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px', color: '#fff', letterSpacing: '-0.5px' }}>
              Encantiva
            </span>
          </div>
        </div>

        {/* Badge trial na sidebar */}
        {isTrial && !isAdmin && (
          <div style={{
            margin: '12px', padding: '10px 14px',
            background: 'rgba(255,51,204,0.1)',
            border: '1px solid rgba(255,51,204,0.25)',
            borderRadius: '10px',
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', margin: '0 0 2px 0', letterSpacing: '0.5px' }}>
              🧪 MODO TESTE
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>
              {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '0 0 4px 0' }}>
            Menu
          </p>
          <NavItem href="/materiais" icon={<Package size={16} style={{ color: '#ff33cc' }} />} label="Materiais" />
          <NavItem href="/calculadora" icon={<Calculator size={16} style={{ color: '#ff33cc' }} />} label="Calculadora" />
          <NavItem href="/contratos" icon={<FileText size={16} style={{ color: '#ff33cc' }} />} label="Contratos" />
          <NavItem href="/configuracoes" icon={<Settings size={16} style={{ color: '#ff33cc' }} />} label="Configurações" />

          {isAdmin && (
            <>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>
                Admin
              </p>
              <NavItem href="/admin" icon={<LayoutDashboard size={16} style={{ color: '#9900ff' }} />} label="Painel Admin" />
              <NavItem href="/admin/materiais/novo" icon={<Upload size={16} style={{ color: '#9900ff' }} />} label="Novo Material" />
              <NavItem href="/admin/materiais" icon={<Package size={16} style={{ color: '#9900ff' }} />} label="Ver Materiais" />
            </>
          )}
        </nav>

        {/* Perfil */}
        <div style={{ padding: '16px', borderTop: '1px solid #ffffff08' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0,
            }}>
              {inicial}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {perfil?.nome_loja ?? user.email}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: isTrial ? '#ff33cc' : isAdmin ? '#ff33cc' : '#ffffff44', margin: 0 }}>
                {isAdmin ? 'Admin' : isTrial ? `Teste · ${diasRestantes}d` : 'Assinante'}
              </p>
            </div>
          </div>
          <BotaoLogout />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main style={{ marginLeft: '240px', flex: 1 }} className="main-desktop">

        {/* Banner trial — topo */}
        {isTrial && !isAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,51,204,0.15), rgba(153,0,255,0.15))',
            borderBottom: '1px solid rgba(255,51,204,0.2)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>🧪</span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff99', margin: 0 }}>
              Você está no <strong style={{ color: '#ff33cc' }}>modo de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} de acesso gratuito.
            </p>
          </div>
        )}

        {children}
      </main>

      {/* Bottom Nav — apenas mobile */}
      <BottomNav isAdmin={isAdmin} />

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-desktop { margin-left: 0 !important; padding-bottom: 72px !important; }
        }
        @media (min-width: 769px) {
          .bottom-nav-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}