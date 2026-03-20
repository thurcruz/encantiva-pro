import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload, Package, Users } from 'lucide-react'

export default async function PaginaAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const [
    { count: totalMateriais },
    { count: totalAssinantes },
    { count: totalDownloads },
    { count: totalUsuarios },
  ] = await Promise.all([
    supabase.from('materiais').select('*', { count: 'exact', head: true }),
    supabase.from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'active').in('plano', ['iniciante', 'avancado', 'elite']),
    supabase.from('historico_downloads').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const cards: { label: string; valor: number; icon: React.ReactNode; cor: string; href: string | null }[] = [
    { label: 'Usuários',         valor: totalUsuarios   ?? 0, icon: <Users size={20} />,   cor: '#cc66ff', href: '/admin/usuarios'  },
    { label: 'Assinantes ativos',valor: totalAssinantes ?? 0, icon: <Users size={20} />,   cor: '#00ff88', href: '/admin/usuarios'  },
    { label: 'Materiais',        valor: totalMateriais  ?? 0, icon: <Package size={20} />, cor: '#ff33cc', href: '/admin/materiais' },
    { label: 'Downloads totais', valor: totalDownloads  ?? 0, icon: <Upload size={20} />,  cor: '#9900ff', href: null              },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
        <div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
            Painel Admin
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
            Visão geral da plataforma
          </p>
        </div>
      </div>

      {/* Cards — clicáveis quando têm href */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {cards.map(card => {
          const inner = (
            <div style={{ background: '#ffffff08', border: `1px solid ${card.cor}22`, borderRadius: '16px', padding: '24px', transition: 'border-color .15s', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.cor + '22', border: `1px solid ${card.cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.cor }}>
                  {card.icon}
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>{card.label}</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#fff', margin: 0, letterSpacing: '-1px' }}>
                {card.valor}
              </p>
            </div>
          )

          return card.href ? (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none', display: 'block' }}>
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      {/* Ações rápidas */}
      <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', margin: '0 0 16px 0' }}>
          Ações rápidas
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/usuarios" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #cc66ff, #9900ff)', borderRadius: '12px', padding: '12px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            <Users size={16} />
            Gerenciar Usuários
          </Link>
          <Link href="/admin/materiais/novo" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '12px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            <Upload size={16} />
            Novo Material
          </Link>
          <Link href="/admin/materiais" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '12px', padding: '12px 20px', color: '#ffffffcc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            <Package size={16} />
            Ver Materiais
          </Link>
        </div>
      </div>
    </div>
  )
}