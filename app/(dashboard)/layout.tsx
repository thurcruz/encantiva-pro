import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavItem from './componentes/NavItem'
import BotaoLogout from './componentes/BotaoLogout'
import BottomNav from './componentes/BottomNav'
import Image from 'next/image'
import Link from 'next/link'
import { Package, LayoutDashboard, Upload, Calculator, ShoppingBag, FileText, Settings, Users, LayoutTemplate, Home, TrendingUp, CalendarDays, Crown } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: '/enc_favicon.png',
    apple: '/enc_favicon.png',
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

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

  const assinaturaAtiva =
    isAdmin ||
    isTrial ||
    (assinatura?.status === 'ativo' && (!assinatura.expira_em || new Date(assinatura.expira_em) > agora))

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome_loja')
    .eq('id', user.id)
    .single()

  const inicial = (perfil?.nome_loja ?? user.email ?? 'U')[0].toUpperCase()

  const nomePlano = isAdmin ? 'Admin' : isTrial ? `Teste · ${diasRestantes}d` : assinatura?.status === 'ativo' ? 'Assinante' : 'Inativo'

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
          <Image src="/enc_logotipo.svg" width={200} height={33} alt="Encantiva" />
        </div>

        {/* Badge trial */}
        {isTrial && !isAdmin && (
          <div style={{
            margin: '12px', padding: '10px 14px',
            background: 'rgba(255,51,204,0.1)',
            border: '1px solid rgba(255,51,204,0.25)',
            borderRadius: '10px',
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', margin: '0 0 2px 0' }}>
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
            Visão Geral
          </p>
          <NavItem href="/inicio" icon={<Home size={16} />} label="Início" />
          <NavItem href="/financeiro" icon={<TrendingUp size={16} />} label="Financeiro" />
          <NavItem href="/agenda" icon={<CalendarDays size={16} />} label="Agenda" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>
            Menu
          </p>
          <NavItem href="/paineis" icon={<LayoutTemplate size={16} />} label="Painéis" />
          <NavItem href="/materiais" icon={<Package size={16} />} label="Materiais" />
          <NavItem href="/calculadora" icon={<Calculator size={16} />} label="Calculadora" />
          <NavItem href="/contratos" icon={<FileText size={16} />} label="Contratos" />
          <NavItem href="/catalogo" icon={<ShoppingBag size={16} />} label="Catálogo" />
          <NavItem href="/clientes" icon={<Users size={16} />} label="Clientes" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>
            Conta
          </p>
          <NavItem href="/configuracoes" icon={<Settings size={16} />} label="Configurações" />
          <NavItem href="/gerenciar-plano" icon={<Crown size={16} />} label="Meu Plano" />

          {isAdmin && (
            <>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>
                Admin
              </p>
              <NavItem href="/admin" icon={<LayoutDashboard size={16} />} label="Painel Admin" />
              <NavItem href="/admin/materiais/novo" icon={<Upload size={16} />} label="Novo Material" />
              <NavItem href="/admin/materiais" icon={<Package size={16} />} label="Ver Materiais" />
            </>
          )}
        </nav>

        {/* Perfil */}
        <div style={{ padding: '16px', borderTop: '1px solid #ffffff08' }}>
          <Link href="/gerenciar-plano" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
              padding: '8px', borderRadius: '10px', cursor: 'pointer',
              transition: 'background 0.15s',
            }}>
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
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: isTrial ? '#ff33cc' : isAdmin ? '#9900ff' : '#ffffff44', margin: 0 }}>
                  {nomePlano}
                </p>
              </div>
            </div>
          </Link>
          <BotaoLogout />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main style={{ marginLeft: '240px', flex: 1 }} className="main-desktop">

        {/* Banner trial */}
        {isTrial && !isAdmin && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,51,204,0.15), rgba(153,0,255,0.15))',
            borderBottom: '1px solid rgba(255,51,204,0.2)',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>🧪</span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff99', margin: 0 }}>
              Você está no <strong style={{ color: '#ff33cc' }}>modo de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} de acesso gratuito.{' '}
              <Link href="/planos" style={{ color: '#ff33cc', fontWeight: 700 }}>Assinar agora →</Link>
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

  aside::-webkit-scrollbar { width: 3px; }
  aside::-webkit-scrollbar-track { background: transparent; }
  aside::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  aside::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  aside { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
`}</style>
    </div>
  )
}