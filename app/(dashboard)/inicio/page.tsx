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
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id, catalogo_temas(nome)').eq('usuario_id', user.id).gte('data_evento', hoje).order('data_evento', { ascending: true }).limit(5),
    supabase.from('pedidos').select('*').eq('usuario_id', user.id),
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, data_evento, criado_em, tema_id, catalogo_temas(nome)').eq('usuario_id', user.id).gte('data_evento', hoje).order('data_evento', { ascending: true }).limit(5),
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

  const statusCor: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
    pendente:   { bg: '#fff8ec', color: '#cc7700', label: 'Pendente',   emoji: '⏳' },
    confirmado: { bg: '#ecfff5', color: '#007744', label: 'Confirmado', emoji: '✅' },
    concluido:  { bg: '#f5f0ff', color: '#6600cc', label: 'Concluído',  emoji: '🎉' },
    cancelado:  { bg: '#fff0f0', color: '#cc0000', label: 'Cancelado',  emoji: '❌' },
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader titulo="Início" subtitulo="Visão geral do seu negócio" />

      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Pedidos este mês', value: pedidosMesArr.length, sub: `${pedidosTodosArr.length} no total`, emoji: '🛍️', grad: 'linear-gradient(135deg, #ff33cc, #9900ff)' },
            { label: 'Receita este mês', value: `R$ ${receitaMes.toFixed(2)}`, sub: `R$ ${receitaTotal.toFixed(2)} no total`, emoji: '💰', grad: 'linear-gradient(135deg, #00cc88, #0066ff)' },
            { label: 'Receita prevista', value: `R$ ${receitaPrevista.toFixed(2)}`, sub: 'Pedidos pendentes + confirmados', emoji: '📈', grad: 'linear-gradient(135deg, #ff9900, #ff33cc)' },
            { label: 'Próximos eventos', value: proximosArr.length, sub: 'A partir de hoje', emoji: '📅', grad: 'linear-gradient(135deg, #9900ff, #0066ff)' },
          ].map((card, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {card.emoji}
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#00000055', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{card.label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 900, color: '#140033', margin: '0 0 2px 0', letterSpacing: '-1px' }}>{card.value}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>📊 Pedidos por status</h2>
            {Object.keys(statusCor).map(status => {
              const s = statusCor[status]
              const count = statusCount[status] ?? 0
              const total = pedidosTodosArr.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={status} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: s.color }}>{s.emoji} {s.label}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#140033' }}>{count}</span>
                  </div>
                  <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '99px' }} />
                  </div>
                </div>
              )
            })}
            {pedidosTodosArr.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', textAlign: 'center', margin: '24px 0' }}>Nenhum pedido ainda</p>}
          </div>

          <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>🎨 Temas mais pedidos</h2>
            {temasMaisPedidos.length > 0 ? temasMaisPedidos.map((tema, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < temasMaisPedidos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9900ff' }}>{i + 1}</div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#140033', margin: 0 }}>{tema.nome}</p>
                </div>
                <span style={{ background: '#f5f0ff', borderRadius: '20px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#9900ff' }}>{tema.count}x</span>
              </div>
            )) : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', textAlign: 'center', margin: '24px 0' }}>Nenhum pedido ainda</p>}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>📅 Próximos eventos</h2>
          {proximosArr.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {proximosArr.map(pedido => {
                const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
                const diasRestantes = Math.ceil((dataEvento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
                const urgente = diasRestantes <= 7
                const temaNome = (pedido.catalogo_temas as { nome: string } | null)?.nome ?? '—'
                return (
                  <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: urgente ? '#fff8ec' : '#f9f9f9', borderRadius: '12px', border: `1px solid ${urgente ? '#ffcc0033' : '#eeeeee'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: urgente ? 'linear-gradient(135deg, #ff990022, #ff33cc22)' : 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 900, color: urgente ? '#cc7700' : '#9900ff', margin: 0, lineHeight: 1 }}>{dataEvento.getDate()}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: urgente ? '#cc7700' : '#9900ff', margin: 0, textTransform: 'uppercase' }}>{dataEvento.toLocaleString('pt-BR', { month: 'short' })}</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px 0' }}>{pedido.nome_cliente}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>{temaNome}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: urgente ? '#cc7700' : '#00000055', margin: '0 0 2px 0' }}>
                        {diasRestantes === 0 ? '🔴 Hoje!' : diasRestantes === 1 ? '🟡 Amanhã' : `${diasRestantes} dias`}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9900ff', margin: 0 }}>R$ {Number(pedido.valor_total).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🎉</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>Nenhum evento nos próximos dias</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}