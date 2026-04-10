import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Upload, Package, Users, HandCoins } from 'lucide-react'

export default async function PaginaAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const [
    { count: totalMateriais },
    { count: totalDownloads },
    { count: totalProfiles },
    { count: totalPerfis },
    { data: assinaturasData },
  ] = await Promise.all([
    supabase.from('materiais').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('historico_downloads').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('perfis').select('*', { count: 'exact', head: true }),
    supabase.from('assinaturas').select('plano, status, trial_expira_em, is_beta'),
  ])

  // Usa o maior entre as duas tabelas como total real de usuários
  const totalUsuarios = Math.max(totalProfiles ?? 0, totalPerfis ?? 0)

  const agora = new Date()
  const assinaturas = assinaturasData ?? []

  const totalAssinantes = assinaturas.filter(
    a => a.status === 'active' && ['iniciante', 'avancado', 'elite'].includes(a.plano)
  ).length

  const totalTrial = assinaturas.filter(
    a => a.status === 'trial' && a.trial_expira_em && new Date(a.trial_expira_em) > agora
  ).length

  const totalTrialExpirado = assinaturas.filter(
    a => a.status === 'trial' && a.trial_expira_em && new Date(a.trial_expira_em) <= agora
  ).length

  const totalBeta = assinaturas.filter(a => a.is_beta).length

  const porPlano = {
    iniciante: assinaturas.filter(a => a.status === 'active' && a.plano === 'iniciante').length,
    avancado:  assinaturas.filter(a => a.status === 'active' && a.plano === 'avancado').length,
    elite:     assinaturas.filter(a => a.status === 'active' && a.plano === 'elite').length,
  }

  const cards: {
    label: string
    valor: number
    sub?: string
    icon: React.ReactNode
    cor: string
    href: string | null
  }[] = [
    {
      label: 'Usuários cadastrados',
      valor: totalUsuarios,
      sub: `profiles: ${totalProfiles ?? 0}  ·  perfis: ${totalPerfis ?? 0}`,
      icon: <Users size={20} />,
      cor: '#cc66ff',
      href: '/admin/usuarios',
    },
    {
      label: 'Assinantes ativos',
      valor: totalAssinantes,
      sub: `Inic: ${porPlano.iniciante}  ·  Av: ${porPlano.avancado}  ·  Elite: ${porPlano.elite}`,
      icon: <Users size={20} />,
      cor: '#00ff88',
      href: '/admin/usuarios',
    },
    {
      label: 'Em trial ativo',
      valor: totalTrial,
      sub: `${totalTrialExpirado} expirado${totalTrialExpirado !== 1 ? 's' : ''}`,
      icon: <Users size={20} />,
      cor: '#ffcc00',
      href: '/admin/usuarios',
    },
    {
      label: 'Beta',
      valor: totalBeta,
      sub: 'Acesso especial',
      icon: <Users size={20} />,
      cor: '#ff33cc',
      href: '/admin/usuarios',
    },
    {
      label: 'Materiais publicados',
      valor: totalMateriais ?? 0,
      icon: <Package size={20} />,
      cor: '#ff33cc',
      href: '/admin/materiais',
    },
    {
      label: 'Downloads totais',
      valor: totalDownloads ?? 0,
      icon: <Upload size={20} />,
      cor: '#9900ff',
      href: null,
    },
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

      {/* Cards de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {cards.map(card => {
          const inner = (
            <div style={{
              background: '#ffffff08',
              border: `1px solid ${card.cor}22`,
              borderRadius: '16px',
              padding: '20px 24px',
              height: '100%',
              boxSizing: 'border-box',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: card.cor + '22',
                  border: `1px solid ${card.cor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.cor,
                }}>
                  {card.icon}
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>
                  {card.label}
                </span>
              </div>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px',
                color: '#fff', margin: '0 0 4px', letterSpacing: '-1px',
              }}>
                {card.valor.toLocaleString('pt-BR')}
              </p>
              {card.sub && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff44', margin: 0 }}>
                  {card.sub}
                </p>
              )}
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

      {/* Breakdown por plano */}
      <div style={{
        background: '#ffffff08', border: '1px solid #ffffff12',
        borderRadius: '16px', padding: '24px', marginBottom: '24px',
      }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 16px' }}>
          Assinantes por plano
        </h2>
        {totalAssinantes === 0 ? (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff33', margin: 0 }}>
            Nenhum assinante ativo ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Iniciante', valor: porPlano.iniciante, cor: '#00ccff' },
              { label: 'Avançado',  valor: porPlano.avancado,  cor: '#ff33cc' },
              { label: 'Elite',     valor: porPlano.elite,     cor: '#ffcc00' },
            ].map(p => {
              const pct = totalAssinantes > 0 ? Math.round((p.valor / totalAssinantes) * 100) : 0
              return (
                <div key={p.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc' }}>{p.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff55' }}>
                        {p.valor} usuário{p.valor !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700,
                        color: p.cor, background: p.cor + '22',
                        borderRadius: '6px', padding: '2px 8px',
                      }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: '#ffffff10', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: p.cor, borderRadius: '999px' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Debug — remova após confirmar os números */}
      <div style={{
        background: '#ffffff05', border: '1px solid #ffffff10',
        borderRadius: '12px', padding: '16px', marginBottom: '24px',
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff44',
      }}>
        <p style={{ margin: '0 0 6px', color: '#ffffff66', fontWeight: 700 }}>Debug — contagens brutas</p>
        <p style={{ margin: '0 0 2px' }}>tabela profiles: {totalProfiles ?? 'erro / sem acesso'}</p>
        <p style={{ margin: '0 0 2px' }}>tabela perfis: {totalPerfis ?? 'erro / sem acesso'}</p>
        <p style={{ margin: '0 0 2px' }}>tabela assinaturas (total rows): {assinaturas.length}</p>
        <p style={{ margin: 0 }}>status únicos: {[...new Set(assinaturas.map(a => a.status))].join(', ') || 'nenhum'}</p>
      </div>

      {/* Ações rápidas */}
      <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 16px' }}>
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
          <Link href="/admin/materiais/lote" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ff33cc22', border: '1px solid #ff33cc55', borderRadius: '12px', padding: '12px 20px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            <Upload size={16} />
            Upload em Lote
          </Link>
          <Link href="/admin/materiais" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '12px', padding: '12px 20px', color: '#ffffffcc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            <Package size={16} />
            Ver Materiais
          </Link>
          <Link href="/admin/afiliados" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '12px', padding: '12px 20px', color: '#ffffffcc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
            <HandCoins size={16} />
            Afiliados
          </Link>
        </div>
      </div>
    </div>
  )
}