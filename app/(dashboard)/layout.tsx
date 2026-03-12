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
  CalendarDays, Crown,
} from 'lucide-react'
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

  // Busca assinatura existente
  let { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, trial_expira_em, plano, is_beta')
    .eq('usuario_id', user.id)
    .single()

  // Se não tem assinatura, cria o trial agora (primeira vez no dashboard)
  if (!assinatura) {
    const trialExpira = new Date()
    trialExpira.setDate(trialExpira.getDate() + 7)

    await supabase.from('assinaturas').insert({
      usuario_id:      user.id,
      status:          'trial',
      trial_expira_em: trialExpira.toISOString(),
    })

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

  const assinaturaAtiva = isAdmin || assinatura?.status === 'active' || isTrial

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
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar-desktop" style={{
        width: '240px', flexShrink: 0, background: '#0d0022',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 40,
        borderTopRightRadius: '16px', borderBottomRightRadius: '16px',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #ffffff08', display: 'flex', alignItems: 'center' }}>
          <Image src="/enc_logotipo.svg" width={160} height={27} alt="Encantiva" />
        </div>

        {/* Badge trial */}
        {isTrial && !isAdmin && (
          <div style={{ margin: '12px', padding: '10px 14px', background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.25)', borderRadius: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', margin: '0 0 2px 0' }}>
              🧪 MODO TESTE
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>
              {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}
            </p>
          </div>
        )}

        {/* Badge trial expirado */}
        {trialExpirado && !isAdmin && (
          <div style={{ margin: '12px', padding: '10px 14px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff4444', margin: '0 0 2px 0' }}>
              ⏰ TESTE EXPIRADO
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>
              Assine para continuar
            </p>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '0 0 4px 0' }}>Geral</p>
          <NavItem href="/inicio" icon={<Home size={16} />} label="Início" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Pedidos</p>
          <NavItem href="/agenda" icon={<CalendarDays size={16} />} label="Agenda" />
          <NavItem href="/catalogo" icon={<ShoppingBag size={16} />} label="Catálogo" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Financeiro</p>
          <NavItem href="/financeiro" icon={<TrendingUp size={16} />} label="Financeiro" />
          <NavItem href="/calculadora" icon={<Calculator size={16} />} label="Calculadora" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Clientes</p>
          <NavItem href="/clientes" icon={<Users size={16} />} label="Clientes" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Biblioteca</p>
          <NavItem href="/paineis" icon={<LayoutTemplate size={16} />} label="Painéis" />
          <NavItem href="/materiais" icon={<Package size={16} />} label="Materiais" />
          <NavItem href="/contratos" icon={<FileText size={16} />} label="Contratos" />

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Conta</p>
          <NavItem href="/configuracoes" icon={<Settings size={16} />} label="Configurações" />
          <NavItem href="/gerenciar-plano" icon={<Crown size={16} />} label="Meu Plano" />

          {isAdmin && (
            <>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px', margin: '16px 0 4px 0' }}>Admin</p>
              <NavItem href="/admin" icon={<LayoutDashboard size={16} />} label="Painel Admin" />
              <NavItem href="/admin/materiais/novo" icon={<Upload size={16} />} label="Novo Material" />
              <NavItem href="/admin/materiais" icon={<Package size={16} />} label="Ver Materiais" />
            </>
          )}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #ffffff08' }}>
          <BotaoLogout />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-desktop">

        {/* Banner trial ativo */}
        {isTrial && !isAdmin && (
          <div style={{
            background: '#ff33cc',
            borderBottom: 'none',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>🧪</span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#fff', margin: 0 }}>
                Você está no <strong>modo de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}.{' '}
                <Link href="/planos" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Assinar agora →</Link>
              </p>
          </div>
        )}

        {/* Banner trial expirado */}
        {trialExpirado && !isAdmin && (
          <div style={{
            background: 'rgba(255,0,0,0.1)',
            borderBottom: '1px solid rgba(255,0,0,0.2)',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>⏰</span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff99', margin: 0 }}>
              Seu período de teste <strong style={{ color: '#ff4444' }}>expirou</strong>.{' '}
              <Link href="/planos" style={{ color: '#ff4444', fontWeight: 700 }}>Escolha um plano para continuar →</Link>
            </p>
          </div>
        )}

        {/* Bloqueio quando trial expirado */}
        {trialExpirado && !isAdmin && !assinaturaAtiva ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', padding: '40px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#140033', margin: '0 0 8px 0' }}>
              Seu teste gratuito expirou
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000055', margin: '0 0 24px 0', maxWidth: 400 }}>
              Escolha um plano para continuar usando a Encantiva Pro sem interrupções.
            </p>
            <Link href="/planos" style={{
              background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
              borderRadius: '12px', padding: '14px 32px',
              color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
              textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,51,204,0.3)',
            }}>
              Ver planos →
            </Link>
          </div>
        ) : (
          children
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav-wrapper">
        <BottomNav isAdmin={isAdmin} isBeta={isBeta} />
      </div>

    </div>
  )
}