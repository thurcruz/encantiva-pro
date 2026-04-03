import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
import AgendaCliente from './AgendaCliente'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaAgenda() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, plano, trial_expira_em, is_beta')
    .eq('usuario_id', user.id)
    .single()

  const isBeta = assinatura?.is_beta === true
  const planoId = getPlanoId(assinatura?.status ?? null, assinatura?.plano ?? null, assinatura?.trial_expira_em ?? null, isAdmin)
  const limites = getLimites(planoId)

  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0)
  const { count: eventosMes } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id)
    .eq('origem', 'manual')
    .gte('criado_em', inicioMes.toISOString())

  const limiteEventos = limites.eventosPorMes
  const limiteNumerico = typeof limiteEventos === 'number' ? limiteEventos : null
  const eventosMesCount = eventosMes ?? 0
  const limiteAtingido = limiteNumerico !== null && eventosMesCount >= limiteNumerico && !isAdmin && !isBeta

  const [{ data: pedidos }, { data: temas }, { data: kits }, { data: clientes }] = await Promise.all([
    supabase.from('pedidos').select('*, catalogo_temas(nome), catalogo_kits(nome)').eq('usuario_id', user.id).order('data_evento', { ascending: true }),
    supabase.from('catalogo_temas').select('id, nome, categorias, categoria').eq('usuario_id', user.id).order('nome'),
    supabase.from('catalogo_kits').select('id, nome, catalogo_tema_id').eq('usuario_id', user.id).order('nome'),
    supabase.from('clientes').select('id, nome, telefone, email').eq('usuario_id', user.id).order('nome'),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Agenda" subtitulo="Seus eventos organizados por data" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>

        {limiteNumerico !== null && !isAdmin && !isBeta && (
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 3px' }}>Eventos manuais este mês</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: limiteAtingido ? '#dc2626' : '#111827', fontWeight: 700, margin: 0 }}>
                  {eventosMesCount} de {limiteNumerico} usados
                </p>
              </div>
              <div style={{ flex: 1, minWidth: '80px' }}>
                <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (eventosMesCount / limiteNumerico) * 100)}%`, height: '100%', background: limiteAtingido ? '#dc2626' : eventosMesCount / limiteNumerico >= 0.7 ? '#f59e0b' : '#10b981', borderRadius: '999px', transition: 'width .4s' }} />
                </div>
              </div>
            </div>
            {limiteAtingido && (
              <a href="/planos" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', borderRadius: '999px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', flexShrink: 0 }}>
                Fazer upgrade →
              </a>
            )}
          </div>
        )}

        <AgendaCliente
          pedidos={pedidos ?? []}
          usuarioId={user.id}
          temas={temas ?? []}
          kits={kits ?? []}
          clientes={clientes ?? []}
          limiteAtingido={limiteAtingido}
        />
      </div>
    </div>
  )
}