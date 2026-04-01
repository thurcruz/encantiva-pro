import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavItem from './componentes/NavItem'
import BotaoLogout from './componentes/BotaoLogout'
import BottomNav from './componentes/BottomNav'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, LayoutDashboard, Upload, Calculator, ShoppingBag,
  FileText, Settings, Users, LayoutTemplate, Home, TrendingUp,
  CalendarDays, Crown, Archive,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: '/enc_favicon.png',
    apple: '/enc_favicon.png',
  },
}

// ── Label de seção ───────────────────────────────────────
function SecaoLabel({ label, primeiro }: { label: string; primeiro?: boolean }) {
  return (
    <p style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      fontWeight: 700,
      color: '#ffffff44',
      letterSpacing: '1.2px',
      textTransform: 'uppercase',
      padding: '0 12px',
      margin: primeiro ? '8px 0 4px 0' : '20px 0 4px 0',
    }}>
      {label}
    </p>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  let { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, trial_expira_em, plano, is_beta')
    .eq('usuario_id', user.id)
    .single()

  if (!assinatura) {
    const trialExpira = new Date()
    trialExpira.setDate(trialExpira.getDate() + 7)

    const { error: errInsert } = await supabase.from('assinaturas').insert({
      usuario_id:      user.id,
      status:          'trial',
      trial_expira_em: trialExpira.toISOString(),
    })

    if (errInsert) {
      // RLS ou outro erro — tenta via service role ou usa o admin client
      console.error('[layout] Erro ao criar trial:', errInsert.message)
    }

    // Mesmo que o insert falhe, deixa a sessão continuar como trial
    // para não bloquear o acesso da usuária
    assinatura = {
      status:          'trial',
      trial_expira_em: trialExpira.toISOString(),
      plano:           null,
      is_beta:         false,
    }
  }

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isBeta  = assinatura?.is_beta === true
  const agora   = new Date()

  const isTrial = assinatura?.status === 'trial' &&
    !!(assinatura?.trial_expira_em && new Date(assinatura.trial_expira_em) > agora)

  const trialExpirado = assinatura?.status === 'trial' &&
    !!(assinatura?.trial_expira_em && new Date(assinatura.trial_expira_em) <= agora)

  const diasRestantes = isTrial
    ? Math.ceil((new Date(assinatura!.trial_expira_em!).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const temAcervo = true  // sempre visível; acesso controlado dentro da página /acervo

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <style>{`
        .sidebar-desktop { display: flex; }
        .main-desktop { margin-left: 240px; flex: 1; min-width: 0; }
        .bottom-nav-wrapper { display: none; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-desktop { margin-left: 0 !important; padding-bottom: 90px !important; }
          .bottom-nav-wrapper { display: block; }
        }
        .sidebar-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 8px 12px;
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar-desktop" style={{
        width: '240px', flexShrink: 0, background: '#0d0022',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 40,
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center' }}>
          <Image src="/enc_logotipo.svg" width={160} height={27} alt="Encantiva" />
        </div>

        {/* Badge trial ativo */}
        {isTrial && !isAdmin && (
          <div style={{ margin: '12px 12px 0', padding: '10px 14px', background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.2)', borderRadius: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', margin: '0 0 2px 0' }}>
              MODO TESTE
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>
              {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
            </p>
          </div>
        )}

        {/* Badge trial expirado */}
        {trialExpirado && !isAdmin && (
          <div style={{ margin: '12px 12px 0', padding: '10px 14px', background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff5555', margin: '0 0 2px 0' }}>
              TESTE EXPIRADO
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>
              Assine para continuar
            </p>
          </div>
        )}

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '12px 8px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}>

          {/* Início — sem label de seção, isolado */}
          <NavItem href="/inicio" icon={<Home size={16} />} label="Início" />

          <div className="sidebar-divider" />

          {/* Negócio */}
          <SecaoLabel label="Negócio" primeiro />
          <NavItem href="/agenda"     icon={<CalendarDays size={16} />} label="Agenda" />
          <NavItem href="/catalogo"   icon={<ShoppingBag size={16} />}  label="Catálogo & Pedidos" />
          <NavItem href="/clientes"   icon={<Users size={16} />}        label="Clientes" />
          <NavItem href="/contratos"  icon={<FileText size={16} />}     label="Contratos" />

          <div className="sidebar-divider" />

          {/* Financeiro */}
          <SecaoLabel label="Financeiro" />
          <NavItem href="/financeiro"  icon={<TrendingUp size={16} />}  label="Dashboard" />
          <NavItem href="/calculadora" icon={<Calculator size={16} />}  label="Calculadora" />
          {temAcervo && (
            <NavItem href="/acervo" icon={<Archive size={16} />} label="Acervo" />
          )}

          <div className="sidebar-divider" />

          {/* Materiais */}
          <SecaoLabel label="Materiais" />
          <NavItem href="/materiais" icon={<Package size={16} />}        label="Biblioteca" />
          <NavItem href="/paineis"   icon={<LayoutTemplate size={16} />} label="Criador de Painéis" />

          <div className="sidebar-divider" />

          {/* Conta */}
          <SecaoLabel label="Conta" />
          <NavItem href="/configuracoes"  icon={<Settings size={16} />} label="Configurações" />
          <NavItem href="/planos"         icon={<Crown size={16} />}    label="Meu Plano" />

          {/* Admin */}
          {isAdmin && (
            <>
              <div className="sidebar-divider" />
              <SecaoLabel label="Admin" />
              <NavItem href="/admin"                icon={<LayoutDashboard size={16} />} label="Painel Admin" />
              <NavItem href="/admin/materiais/novo" icon={<Upload size={16} />}          label="Novo Material" />
              <NavItem href="/admin/materiais"      icon={<Package size={16} />}         label="Ver Materiais" />
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <BotaoLogout />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-desktop">

        {/* Banner trial */}
        {isTrial && !isAdmin && (
          <div style={{ background: '#ff33cc', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#fff', margin: 0 }}>
              Você está no <strong>modo de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}.{' '}
              <Link href="/planos" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Assinar agora →</Link>
            </p>
          </div>
        )}

        {/* Banner trial expirado */}
        {trialExpirado && !isAdmin && (
          <div style={{ background: 'rgba(255,0,0,0.1)', borderBottom: '1px solid rgba(255,0,0,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff99', margin: 0 }}>
              Seu período de teste <strong style={{ color: '#ff5555' }}>expirou</strong>.{' '}
              <Link href="/planos" style={{ color: '#ff5555', fontWeight: 700 }}>Escolha um plano para continuar →</Link>
            </p>
          </div>
        )}

        {children}
      </main>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav-wrapper">
        <BottomNav isAdmin={isAdmin} isBeta={isBeta} temAcervo={temAcervo} />
      </div>

    </div>
  )
}