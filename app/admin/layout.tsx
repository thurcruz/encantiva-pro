import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, Upload, Package, Users, LogOut, HandCoins } from 'lucide-react'

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', color: '#ffffffaa', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', textDecoration: 'none', transition: 'all 0.15s' }}
      className="admin-nav-item"
    >
      {icon}
      {label}
    </Link>
  )
}

function SecaoLabel({ label }: { label: string }) {
  return (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#ffffff44', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 12px', margin: '20px 0 4px 0' }}>
      {label}
    </p>
  )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#140033' }}>
      <style>{`
        .admin-nav-item:hover { background: rgba(255,255,255,0.06) !important; color: #fff !important; }
        .admin-sidebar { display: flex; }
        .admin-main { margin-left: 240px; flex: 1; min-width: 0; }
        .admin-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 12px; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-main { margin-left: 0 !important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar" style={{ width: '240px', flexShrink: 0, background: '#0d0022', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center' }}>
          <Image src="/enc_logotipo.svg" width={160} height={27} alt="Encantiva" />
        </div>

        {/* Badge admin */}
        <div style={{ margin: '12px 12px 0', padding: '10px 14px', background: 'rgba(153,0,255,0.15)', border: '1px solid rgba(153,0,255,0.3)', borderRadius: '10px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#cc66ff', margin: '0 0 2px 0' }}>PAINEL ADMIN</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          <SecaoLabel label="Visão geral" />
          <NavItem href="/admin" icon={<LayoutDashboard size={16} />} label="Painel" />

          <div className="admin-divider" />

          <SecaoLabel label="Usuários" />
          <NavItem href="/admin/usuarios" icon={<Users size={16} />} label="Gerenciar Usuários" />

          <div className="admin-divider" />

          <SecaoLabel label="Materiais" />
          <NavItem href="/admin/materiais" icon={<Package size={16} />} label="Ver Materiais" />
          <NavItem href="/admin/materiais/novo" icon={<Upload size={16} />} label="Novo Material" />
          <NavItem href="/admin/materiais/lote" icon={<Upload size={16} />} label="Upload em Lote" />

          <div className="admin-divider" />

          <SecaoLabel label="Programa" />
          <NavItem href="/admin/afiliados" icon={<HandCoins size={16} />} label="Afiliados" />
        </nav>

        {/* Rodapé */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/inicio" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '13px', textDecoration: 'none' }}>
            ← Voltar ao dashboard
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', cursor: 'pointer', border: 'none', background: 'transparent', width: '100%' }}>
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}