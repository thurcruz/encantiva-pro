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

// ── Ícones SVG inline ──────────────────────────────────────
const IconBag = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7V5a3 3 0 0 1 6 0v2"/>
    <rect x="2" y="7" width="14" height="10" rx="2"/>
    <path d="M9 11v2"/>
  </svg>
)
const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="16" height="11" rx="2"/>
    <circle cx="9" cy="9.5" r="2.5"/>
    <path d="M5 4V3M13 4V3"/>
  </svg>
)
const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13l4-5 3.5 3 3-4L17 5"/>
    <path d="M13 5h4v4"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="14" height="13" rx="2"/>
    <path d="M2 7h14"/>
    <path d="M6 2v2M12 2v2"/>
    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M7 1l6 11H1L7 1z"/>
    <path d="M7 6v3M7 10.5v.5"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7l3 3 6-6"/>
  </svg>
)
const IconEmpty = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round">
    <rect x="4" y="4" width="24" height="24" rx="4"/>
    <path d="M10 16h12M16 10v12"/>
  </svg>
)

export default async function PaginaInicio() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]
  const inicioMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: pedidosMes },
    { data: pedidosTodos },
    { data: proximosEventos },
    { data: temas },
  ] = await Promise.all([
    // pedidos do mês atual
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id').eq('usuario_id', user.id).gte('data_evento', inicioMes).lte('data_evento', fimMes),
    // todos os pedidos
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    // próximos 5 eventos a partir de hoje
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, data_evento, tema_id, catalogo_temas(nome)').eq('usuario_id', user.id).gte('data_evento', hoje).order('data_evento', { ascending: true }).limit(5),
    supabase.from('catalogo_temas').select('id, nome').eq('usuario_id', user.id),
  ])

  const pedidosMesArr = (pedidosMes ?? []) as unknown as Pedido[]
  const pedidosTodosArr = (pedidosTodos ?? []) as unknown as Pedido[]
  const proximosArr = (proximosEventos ?? []) as unknown as Pedido[]
  const temasArr = (temas ?? []) as Tema[]

  const receitaMes = pedidosMesArr.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
  const receitaTotal = pedidosTodosArr.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
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
    pendente:   { bar: '#f59e0b', dot: '#fef3c7', label: 'Pendente' },
    confirmado: { bar: '#10b981', dot: '#d1fae5', label: 'Confirmado' },
    concluido:  { bar: '#8b5cf6', dot: '#ede9fe', label: 'Concluído' },
    cancelado:  { bar: '#ef4444', dot: '#fee2e2', label: 'Cancelado' },
  }

  const metricCards = [
    { label: 'Pedidos este mês', value: pedidosMesArr.length, sub: `${pedidosTodosArr.length} no total`, icon: <IconBag />, accent: '#7700ff' },
    { label: 'Receita este mês', value: `R$ ${receitaMes.toFixed(2).replace('.', ',')}`, sub: `R$ ${receitaTotal.toFixed(2).replace('.', ',')} no total`, icon: <IconMoney />, accent: '#10b981' },
    { label: 'Receita prevista', value: `R$ ${receitaPrevista.toFixed(2).replace('.', ',')}`, sub: 'Pendentes + confirmados', icon: <IconTrend />, accent: '#f59e0b' },
    { label: 'Próximos eventos', value: proximosArr.length, sub: 'A partir de hoje', icon: <IconCalendar />, accent: '#ff33cc' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Início" subtitulo="Visão geral do seu negócio" />

      <div className="page-content inicio-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* ── Métricas ── */}
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {metricCards.map((card, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${card.accent}12`, color: card.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{card.label}</p>
                <p className="card-value" style={{ fontFamily: 'Inter, sans-serif', fontSize: '21px', fontWeight: 800, color: '#111827', margin: '0 0 3px 0', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#d1d5db', margin: 0 }}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Status + Temas ── */}
        <div className="graficos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>

          {/* Status */}
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '22px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 18px 0', letterSpacing: '-0.2px' }}>Pedidos por status</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {Object.keys(statusConfig).map(status => {
                const s = statusConfig[status]
                const count = statusCount[status] ?? 0
                const total = pedidosTodosArr.length
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.bar, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#374151' }}>{s.label}</span>
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827' }}>{count}</span>
                    </div>
                    <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.bar, borderRadius: '99px', transition: 'width .4s ease' }} />
                    </div>
                  </div>
                )
              })}
              {pedidosTodosArr.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <IconEmpty />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: '8px 0 0' }}>Nenhum pedido ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Temas */}
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '22px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 18px 0', letterSpacing: '-0.2px' }}>Temas mais pedidos</p>
            {temasMaisPedidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {temasMaisPedidos.map((tema, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < temasMaisPedidos.length - 1 ? '1px solid #f3f4f6' : 'none', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 800, color: '#7700ff', flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '13px', color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.nome}</p>
                    </div>
                    <span style={{ background: '#f5f0ff', borderRadius: '6px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#7700ff', flexShrink: 0 }}>{tema.count}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <IconEmpty />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: '8px 0 0' }}>Nenhum pedido ainda</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Próximos eventos ── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '22px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 16px 0', letterSpacing: '-0.2px' }}>Próximos eventos</p>

          {proximosArr.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {proximosArr.map(pedido => {
                const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
                const diasRestantes = Math.ceil((dataEvento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
                const urgente = diasRestantes <= 7
                const temaNome = (pedido.catalogo_temas as { nome: string } | null)?.nome ?? '—'
                const diaStr = urgente
                  ? diasRestantes === 0 ? 'Hoje'
                  : diasRestantes === 1 ? 'Amanhã'
                  : `${diasRestantes}d`
                  : `${diasRestantes} dias`

                return (
                  <div key={pedido.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 14px',
                    background: urgente ? '#fffbf0' : '#fafafa',
                    borderRadius: '10px',
                    border: `1px solid ${urgente ? '#fde68a' : '#efefef'}`,
                    gap: '12px',
                  }}>
                    {/* Data */}
                    <div style={{ width: '38px', textAlign: 'center', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: urgente ? '#d97706' : '#7700ff', margin: 0, lineHeight: 1 }}>{dataEvento.getDate()}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: urgente ? '#d97706' : '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {dataEvento.toLocaleString('pt-BR', { month: 'short' })}
                      </p>
                    </div>

                    {/* Separador */}
                    <div style={{ width: '1px', height: '28px', background: '#e5e7eb', flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.nome_cliente}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{temaNome}</p>
                    </div>

                    {/* Prazo */}
                    {urgente && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', borderRadius: '6px', padding: '3px 8px', color: '#d97706', flexShrink: 0 }}>
                        <IconAlert />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}>{diaStr}</span>
                      </div>
                    )}
                    {!urgente && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#d1d5db', flexShrink: 0 }}>{diaStr}</span>
                    )}

                    {/* Valor */}
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0, flexShrink: 0, letterSpacing: '-0.2px' }}>
                      R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <IconEmpty />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', margin: '10px 0 0' }}>Nenhum evento nos próximos dias</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}