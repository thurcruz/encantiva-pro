import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GerenciarAfiliados from './GerenciarAfiliados'

export default async function PaginaAdminAfiliados() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: afiliados },
    { data: conversoes },
    { data: cliques },
  ] = await Promise.all([
    admin.from('afiliados').select('*').order('criado_em', { ascending: false }),
    admin.from('afiliados_conversoes').select('*'),
    admin.from('afiliados_cliques').select('afiliado_id'),
  ])

  type StatsMap = Record<string, { cliques: number; conversoes: number; ganhos: number; pendente: number }>

  const statsMap: StatsMap = {}

  for (const af of afiliados ?? []) {
    statsMap[af.id] = { cliques: 0, conversoes: 0, ganhos: 0, pendente: 0 }
  }

  for (const c of cliques ?? []) {
    if (statsMap[c.afiliado_id]) statsMap[c.afiliado_id].cliques++
  }

  for (const cv of conversoes ?? []) {
    const s = statsMap[cv.afiliado_id]
    if (!s) continue
    s.conversoes++
    if (cv.status === 'pago') s.ganhos += Number(cv.comissao)
    if (cv.status === 'pending') s.pendente += Number(cv.comissao)
  }

  const totalAfiliados  = afiliados?.length ?? 0
  const totalConversoes = conversoes?.length ?? 0
  const totalPago       = (conversoes ?? []).filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.comissao), 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              Afiliados
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              Gerencie o programa de afiliados
            </p>
          </div>
        </div>
        <Link href="/admin" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55', textDecoration: 'none' }}>
          ← Painel Admin
        </Link>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total de afiliados',    valor: totalAfiliados,                               cor: '#cc66ff' },
          { label: 'Total de conversões',   valor: totalConversoes,                              cor: '#00ff88' },
          { label: 'Comissões pagas (R$)',   valor: `R$ ${totalPago.toFixed(2).replace('.', ',')}`, cor: '#ffcc00' },
        ].map(card => (
          <div key={card.label} style={{ background: '#ffffff08', border: `1px solid ${card.cor}22`, borderRadius: '16px', padding: '20px 24px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff55', margin: '0 0 8px' }}>{card.label}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', margin: 0, letterSpacing: '-1px' }}>
              {card.valor}
            </p>
          </div>
        ))}
      </div>

      <GerenciarAfiliados afiliados={afiliados ?? []} statsMap={statsMap} />
    </div>
  )
}
