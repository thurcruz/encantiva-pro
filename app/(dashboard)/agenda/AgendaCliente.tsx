'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Pedido {
  id: string
  nome_cliente: string
  valor_total: number
  status: string
  data_evento: string
  forma_pagamento: string | null
  observacoes: string | null
  catalogo_temas: { nome: string } | null
  catalogo_kits: { nome: string } | null
}

interface Props {
  pedidos: Pedido[]
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const statusCor: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
  pendente:   { bg: '#fff8ec', color: '#cc7700', label: 'Pendente',   emoji: '⏳' },
  confirmado: { bg: '#ecfff5', color: '#007744', label: 'Confirmado', emoji: '✅' },
  concluido:  { bg: '#f5f0ff', color: '#6600cc', label: 'Concluído',  emoji: '🎉' },
  cancelado:  { bg: '#fff0f0', color: '#cc0000', label: 'Cancelado',  emoji: '❌' },
}

export default function AgendaCliente({ pedidos }: Props) {
  const agora = new Date()
  const [mesAtual, setMesAtual] = useState(agora.getMonth())
  const [anoAtual, setAnoAtual] = useState(agora.getFullYear())
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [visualizacao, setVisualizacao] = useState<'calendario' | 'lista'>('calendario')
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  function mesAnterior() {
    if (mesAtual === 0) { setMesAtual(11); setAnoAtual(a => a - 1) }
    else setMesAtual(m => m - 1)
  }

  function proximoMes() {
    if (mesAtual === 11) { setMesAtual(0); setAnoAtual(a => a + 1) }
    else setMesAtual(m => m + 1)
  }

  const pedidosFiltrados = pedidos.filter(p => filtroStatus === 'todos' || p.status === filtroStatus)

  // Alertas: eventos nos próximos 7 dias
  const alertas = pedidos.filter(p => {
    if (p.status === 'cancelado' || p.status === 'concluido') return false
    const d = new Date(p.data_evento + 'T00:00:00')
    const dias = Math.ceil((d.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
    return dias >= 0 && dias <= 7
  })

  // Calendário
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay()
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate()

  function pedidosNoDia(dia: number) {
    const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return pedidosFiltrados.filter(p => p.data_evento === dataStr)
  }

  const pedidosDiaSelecionado = diaSelecionado
    ? pedidosFiltrados.filter(p => p.data_evento === diaSelecionado)
    : []

  const cardStyle = { background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '20px' }

  return (
    <div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #fff8ec, #fff5fd)', border: '1px solid #ffcc0033', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#cc7700', margin: '0 0 10px 0' }}>
            🔔 {alertas.length} evento{alertas.length > 1 ? 's' : ''} nos próximos 7 dias
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alertas.map(p => {
              const d = new Date(p.data_evento + 'T00:00:00')
              const dias = Math.ceil((d.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', padding: '10px 14px' }}>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#140033', margin: '0 0 1px 0' }}>{p.nome_cliente}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>{p.catalogo_temas?.nome ?? '—'}</p>
                  </div>
                  <span style={{ background: dias === 0 ? '#ff333315' : '#ff990015', color: dias === 0 ? '#cc0000' : '#cc7700', borderRadius: '8px', padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}>
                    {dias === 0 ? 'Hoje!' : dias === 1 ? 'Amanhã' : `em ${dias} dias`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pendente', label: '⏳ Pendente' },
            { key: 'confirmado', label: '✅ Confirmado' },
            { key: 'concluido', label: '🎉 Concluído' },
            { key: 'cancelado', label: '❌ Cancelado' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltroStatus(f.key)} style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${filtroStatus === f.key ? 'transparent' : '#e5e5e5'}`, background: filtroStatus === f.key ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff', color: filtroStatus === f.key ? '#fff' : '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['calendario', 'lista'] as const).map(v => (
            <button key={v} onClick={() => setVisualizacao(v)} style={{ padding: '8px 14px', borderRadius: '10px', border: `1px solid ${visualizacao === v ? 'transparent' : '#e5e5e5'}`, background: visualizacao === v ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff', color: visualizacao === v ? '#fff' : '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              {v === 'calendario' ? '📅 Calendário' : '📋 Lista'}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDÁRIO */}
      {visualizacao === 'calendario' && (
        <div style={cardStyle}>
          {/* Navegação mês */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={mesAnterior} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} style={{ color: '#140033' }} />
            </button>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: 0 }}>
              {MESES[mesAtual]} {anoAtual}
            </p>
            <button onClick={proximoMes} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #e5e5e5', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} style={{ color: '#140033' }} />
            </button>
          </div>

          {/* Dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {DIAS_SEMANA.map(d => (
              <p key={d} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#00000044', textAlign: 'center', margin: 0, padding: '4px 0', textTransform: 'uppercase' }}>{d}</p>
            ))}
          </div>

          {/* Grid de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
              const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const pedidosDia = pedidosNoDia(dia)
              const isHoje = dataStr === agora.toISOString().split('T')[0]
              const isSelecionado = diaSelecionado === dataStr
              return (
                <button key={dia} onClick={() => setDiaSelecionado(isSelecionado ? null : dataStr)} style={{ aspectRatio: '1', borderRadius: '10px', border: `2px solid ${isSelecionado ? '#ff33cc' : isHoje ? '#9900ff33' : 'transparent'}`, background: isSelecionado ? '#fff5fd' : isHoje ? '#f5f0ff' : pedidosDia.length > 0 ? '#fff' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '4px', position: 'relative' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: isHoje ? 900 : 600, color: isHoje ? '#9900ff' : '#140033', margin: 0 }}>{dia}</p>
                  {pedidosDia.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {pedidosDia.slice(0, 3).map((p, i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusCor[p.status]?.color ?? '#9900ff' }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Pedidos do dia selecionado */}
          {diaSelecionado && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #eeeeee', paddingTop: '20px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 12px 0' }}>
                📅 {new Date(diaSelecionado + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {pedidosDiaSelecionado.length > 0 ? pedidosDiaSelecionado.map(p => (
                <PedidoCard key={p.id} pedido={p} />
              )) : (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', margin: 0 }}>Nenhum evento neste dia</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* LISTA */}
      {visualizacao === 'lista' && (
        <div>
          {pedidosFiltrados.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📋</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 4px 0' }}>Nenhum pedido encontrado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>Tente mudar o filtro de status</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pedidosFiltrados.map(p => <PedidoCard key={p.id} pedido={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  const s = statusCor[pedido.status] ?? { bg: '#f9f9f9', color: '#140033', label: pedido.status, emoji: '•' }
  const agora = new Date()
  const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
  const diasRestantes = Math.ceil((dataEvento.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 900, color: '#9900ff', margin: 0, lineHeight: 1 }}>
            {dataEvento.getDate()}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: '#9900ff', margin: 0, textTransform: 'uppercase' }}>
            {dataEvento.toLocaleString('pt-BR', { month: 'short' })}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 2px 0' }}>{pedido.nome_cliente}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 6px 0' }}>
            {pedido.catalogo_temas?.nome ?? '—'} • {pedido.catalogo_kits?.nome ?? '—'}
          </p>
          <span style={{ background: s.bg, color: s.color, borderRadius: '8px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}>
            {s.emoji} {s.label}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px', color: '#9900ff', margin: '0 0 4px 0' }}>
          R$ {Number(pedido.valor_total).toFixed(2)}
        </p>
        {pedido.status !== 'cancelado' && pedido.status !== 'concluido' && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: diasRestantes < 0 ? '#cc0000' : diasRestantes <= 7 ? '#cc7700' : '#00000044', margin: 0, fontWeight: 600 }}>
            {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrás` : diasRestantes === 0 ? 'Hoje!' : diasRestantes === 1 ? 'Amanhã' : `em ${diasRestantes}d`}
          </p>
        )}
      </div>
    </div>
  )
}