import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TabelaUsuarios from './TabelaUsuarios'

export default async function PaginaUsuarios() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const admin = createAdminClient()

  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const [{ data: assinaturas }, { data: perfis }] = await Promise.all([
    supabase.from('assinaturas').select('*').order('criado_em', { ascending: false }),
    supabase.from('perfis').select('id, nome_loja, telefone'),
  ])

  const lista = (authUsers?.users ?? []).map(u => {
    const assinatura = assinaturas?.filter(a => a.usuario_id === u.id) ?? []
    const perfil = perfis?.find(p => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? u.id,
      nome_loja: perfil?.nome_loja ?? null,
      telefone: perfil?.telefone ?? null,
      criado_em: u.created_at,
      assinaturas: assinatura,
    }
  }).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

  const totalAssinantes = lista.filter(u => {
    const a = u.assinaturas?.[0]
    return a?.status === 'active' || a?.status === 'ativo'
  }).length

  const totalTrial = lista.filter(u => {
    const a = u.assinaturas?.[0]
    return a?.status === 'trial' && !!a.trial_expira_em && new Date(a.trial_expira_em) > new Date()
  }).length

  const totalPendente = lista.filter(u => {
    const a = u.assinaturas?.[0]
    return a?.status === 'pending'
  }).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              Usuários
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              {lista.length} cadastrados
            </p>
          </div>
        </div>
        <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '8px 16px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          ← Painel Admin
        </a>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: lista.length, cor: '#ffffff88', bg: '#ffffff08' },
          { label: 'Assinantes', value: totalAssinantes, cor: '#00ff88', bg: '#00ff8815' },
          { label: 'Em trial', value: totalTrial, cor: '#ffcc00', bg: '#ffcc0015' },
          { label: 'Pendentes', value: totalPendente, cor: '#ff6644', bg: '#ff664415' },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.cor}22`, borderRadius: '12px', padding: '16px 18px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff44', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px' }}>{c.label}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 900, color: c.cor, margin: 0, letterSpacing: '-1px' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <TabelaUsuarios usuarios={lista as never} />
    </div>
  )
}