import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '../componentes/PageHeader'

interface Pedido {
  id: string
  nome_cliente: string
  valor_total: number
  status: string
  criado_em?: string
  data_evento: string
  tema_id: string | null
  catalogo_temas?: { nome: string } | null
}

interface Tema {
  id: string
  nome: string
}

// ── SVG Icons ──────────────────────────────────────────────
const IconBag = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 7V5a3 3 0 0 1 6 0v2"/>
    <rect x="2" y="7" width="14" height="10" rx="2"/>
    <path d="M9 12v-2m0 0v-1m0 1h1m-1 0H8" strokeLinecap="round"/>
  </svg>
)
const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="9" r="7"/>
    <path d="M9 5v1.5m0 5V13m2.5-6.5C11 6 10.1 5.5 9 5.5S6.5 6.2 6.5 7.5C6.5 9.5 11.5 8.5 11.5 10.5c0 1.3-1.1 2-2.5 2s-2.5-.7-2.5-2" strokeLinecap="round"/>
  </svg>
)
const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 13l4-5 3.5 3.5 3-4L16 5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 5h3v3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="14" height="13" rx="2"/>
    <path d="M2 7h14" strokeLinecap="round"/>
    <path d="M6 2v2M12 2v2" strokeLinecap="round"/>
    <circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)
const IconChart = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="1" y="8" width="3" height="6" rx="1"/>
    <rect x="6" y="5" width="3" height="9" rx="1"/>
    <rect x="11" y="2" width="3" height="12" rx="1"/>
  </svg>
)
const IconPalette = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7.5 1.5a6 6 0 1 0 4.5 10c.8-1 .3-2-1-2H10a1.5 1.5 0 0 1 0-3h.5a6 6 0 0 0-3-5z"/>
    <circle cx="4" cy="7.5" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="5.5" cy="4.5" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="3.5" r=".8" fill="currentColor" stroke="none"/>
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="7" cy="7" r="5.5"/>
    <path d="M7 4v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M7 1L1 12h12L7 1z" strokeLinejoin="round"/>
    <path d="M7 5.5v3M7 10v.5" strokeLinecap="round"/>
  </svg>
)

export default async function PaginaInicio() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]

  const [
    { data: pedidosMes },
    { data: pedidosTodos },
    { data: proximosEventos },
    { data: temas },
  ] = await Promise.all([
    supabase.from('gestorPedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id, catalogo_temas(nome)').eq('usuario_id', user.id).gte('data_evento', hoje).order('data_evento', { ascending: true }).limit(5),
    supabase.from('gestorPedidos').select('*').eq('usuario_id', user.id),
    supabase.from('gestorPedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id, catalogo_temas(nome)').eq('usuario_id', user.id).gte('data_evento', hoje).order('data_evento', { ascending: true }).limit(5),
    supabase.from('catalogo_temas').select('id, nome').eq('usuario_id', user.id),
  ])

  const pedidosMesArr  = (pedidosMes      ?? []) as unknown as Pedido[]
  const pedidosTodosArr = (pedidosTodos   ?? []) as unknown as Pedido[]
  const proximosArr    = (proximosEventos ?? []) as unknown as Pedido[]
  const temasArr       = (temas           ?? []) as Tema[]

  const receitaMes      = pedidosMesArr.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
  const receitaTotal    = pedidosTodosArr.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
  const receitaPrevista = pedidosTodosArr.filter(p => p.status === 'pendente' || p.status === 'confirmado').reduce((s, p) => s + Number(p.valor_total), 0)

  const statusCount = pedidosTodosArr.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const temaCount = pedidosTodosArr.reduce((acc, p) => {
    if (p.tema_id) acc[p.tema_id] = (acc[p.tema_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const temasMaisPedidos = Object.entries(temaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ nome: temasArr.find(t => t.id === id)?.nome ?? 'Desconhecido', count }))

  const statusConfig: Record<string, { bar: string; label: string; dot: string }> = {
    pendente:   { bar: '#f59e0b', dot: '#fef3c7', label: 'Pendente'   },
    confirmado: { bar: '#10b981', dot: '#d1fae5', label: 'Confirmado' },
    concluido:  { bar: '#8b5cf6', dot: '#ede9fe', label: 'Concluído'  },
    cancelado:  { bar: '#ef4444', dot: '#fee2e2', label: 'Cancelado'  },
  }

  const metricCards = [
    { label: 'Pedidos este mês',  value: String(pedidosMesArr.length),   sub: `${pedidosTodosArr.length} no total`,                     Icon: IconBag,      accent: '#7c3aed' },
    { label: 'Receita este mês',  value: `R$ ${receitaMes.toFixed(2).replace('.', ',')}`,    sub: `R$ ${receitaTotal.toFixed(2).replace('.', ',')} no total`, Icon: IconMoney,    accent: '#059669' },
    { label: 'Receita prevista',  value: `R$ ${receitaPrevista.toFixed(2).replace('.', ',')}`, sub: 'Pendentes + confirmados',               Icon: IconTrend,    accent: '#d97706' },
    { label: 'Próximos eventos',  value: String(proximosArr.length),      sub: 'A partir de hoje',                                        Icon: IconCalendar, accent: '#2563eb' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f7f8' }}>
      <PageHeader titulo="Início" subtitulo="Visão geral do seu negócio" />

      <div className="page-content inicio-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 40px' }}>

        {/* ── Métricas ── */}
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {metricCards.map((card) => (
            <div key={card.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${card.accent}10`, border: `1px solid ${card.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.accent, flexShrink: 0 }}>
                <card.Icon />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500, color: '#9ca3af', margin: '0 0 5px 0', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{card.label}</p>
                <p className="card-value" style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 3px 0', letterSpacing: '-0.8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: 0 }}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Status + Temas ── */}
        <div className="graficos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>

          {/* Status */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ color: '#6b7280' }}><IconChart /></div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>Pedidos por status</h2>
            </div>
            {pedidosTodosArr.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>Nenhum pedido ainda</p>
            ) : (
              Object.keys(statusConfig).map(status => {
                const cfg = statusConfig[status]
                const count = statusCount[status] ?? 0
                const total = pedidosTodosArr.length
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.bar, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#374151' }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{count}</span>
                    </div>
                    <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: cfg.bar, borderRadius: '99px', transition: 'width .4s ease' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Temas */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <div style={{ color: '#6b7280' }}><IconPalette /></div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>Temas mais pedidos</h2>
            </div>
            {temasMaisPedidos.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }}>Nenhum pedido ainda</p>
            ) : (
              temasMaisPedidos.map((tema, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < temasMaisPedidos.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px', color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.nome}</p>
                  </div>
                  <span style={{ background: '#f5f3ff', borderRadius: '6px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#7c3aed', flexShrink: 0, marginLeft: '8px' }}>{tema.count}×</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Próximos eventos ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ color: '#6b7280' }}><IconCalendar /></div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>Próximos eventos</h2>
          </div>

          {proximosArr.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#9ca3af' }}><IconCalendar /></div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>Nenhum evento nos próximos dias</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proximosArr.map(pedido => {
                const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
                const diasRestantes = Math.ceil((dataEvento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
                const urgente = diasRestantes <= 7
                const temaNome = (pedido.catalogo_temas as { nome: string } | null)?.nome ?? '—'

                const diasLabel =
                  diasRestantes === 0 ? 'Hoje'
                  : diasRestantes === 1 ? 'Amanhã'
                  : `${diasRestantes} dias`

                return (
                  <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: urgente ? '#fffbeb' : '#fafafa', borderRadius: '10px', border: `1px solid ${urgente ? '#fde68a' : '#e5e7eb'}`, gap: '12px' }}>

                    {/* Data box */}
                    <div style={{ width: '42px', flexShrink: 0, textAlign: 'center' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 900, color: urgente ? '#d97706' : '#111827', margin: 0, lineHeight: 1 }}>{dataEvento.getDate()}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dataEvento.toLocaleString('pt-BR', { month: 'short' })}</p>
                    </div>

                    <div style={{ width: '1px', height: '32px', background: '#e5e7eb', flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.nome_cliente}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>{temaNome}</p>
                    </div>

                    {/* Urgência */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <span style={{ color: urgente ? '#d97706' : '#9ca3af' }}>
                        {urgente ? <IconAlert /> : <IconClock />}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: urgente ? '#d97706' : '#6b7280', whiteSpace: 'nowrap' }}>{diasLabel}</span>
                    </div>

                    {/* Valor */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
                        R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}