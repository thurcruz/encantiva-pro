'use client'

import { useState, useRef } from 'react'

interface Pedido {
  id: string
  nome_cliente: string
  valor_total: number
  status: string
  criado_em: string
  data_evento: string
  forma_pagamento: string | null
}

interface Props {
  pedidos: Pedido[]
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const IconMoney  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="4" width="14" height="9" rx="2"/><circle cx="8" cy="8.5" r="2"/></svg>
const IconCheck  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>
const IconClock  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/></svg>
const IconX      = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 5l6 6M11 5l-6 6"/></svg>
const IconCard   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="3" width="11" height="7" rx="1.5"/><path d="M1 6h11"/></svg>
const IconEmpty  = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.4" strokeLinecap="round"><rect x="6" y="8" width="28" height="24" rx="3"/><path d="M12 16h16M12 21h10M12 26h6"/></svg>

// ── Gráfico de linha/área SVG ────────────────────────────
function GraficoLinha({ dados }: { dados: { label: string; total: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 600
  const H = 160
  const padL = 48
  const padR = 16
  const padT = 16
  const padB = 32

  const max = Math.max(...dados.map(d => d.total), 1)
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const pts = dados.map((d, i) => ({
    x: padL + (i / Math.max(dados.length - 1, 1)) * innerW,
    y: padT + innerH - (d.total / max) * innerH,
    ...d,
  }))

  // Linha suavizada via bezier
  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`
  }, '')

  // Área preenchida
  const areaD = pts.length
    ? `${pathD} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`
    : ''

  // Grades horizontais
  const grades = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    y: padT + innerH - pct * innerH,
    label: max * pct >= 1000
      ? `R$${((max * pct) / 1000).toFixed(1)}k`
      : `R$${(max * pct).toFixed(0)}`,
  }))

  const fmt = (v: number) =>
    v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9900ff" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#9900ff" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff33cc"/>
            <stop offset="100%" stopColor="#9900ff"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Grades horizontais */}
        {grades.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#f0f0f4" strokeWidth="1"/>
            <text x={padL - 6} y={g.y + 4} textAnchor="end" fontSize="8" fill="#c4c4cc" fontFamily="Inter, sans-serif">
              {g.label}
            </text>
          </g>
        ))}

        {/* Área */}
        {pts.length > 1 && (
          <path d={areaD} fill="url(#areaGrad)"/>
        )}

        {/* Linha */}
        {pts.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Eixo X */}
        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - 4}
            textAnchor="middle"
            fontSize="8"
            fill={hoverIdx === i ? '#7700ff' : '#c4c4cc'}
            fontFamily="Inter, sans-serif"
            fontWeight={hoverIdx === i ? '700' : '400'}
          >
            {p.label}
          </text>
        ))}

        {/* Pontos interativos */}
        {pts.map((p, i) => (
          <g key={i}>
            {/* Área hover */}
            <rect
              x={i === 0 ? p.x - 20 : pts[i - 1].x + (p.x - pts[i - 1].x) / 2}
              y={padT}
              width={
                i === 0 ? (pts[1]?.x ?? p.x + 40) - p.x + 20
                : i === pts.length - 1 ? p.x - (pts[i - 1].x + (p.x - pts[i - 1].x) / 2) + 20
                : (pts[i + 1]?.x ?? p.x) / 2 - pts[i - 1].x / 2
              }
              height={innerH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoverIdx(i)}
            />

            {/* Linha vertical hover */}
            {hoverIdx === i && (
              <line x1={p.x} y1={padT} x2={p.x} y2={padT + innerH} stroke="#e5d0ff" strokeWidth="1" strokeDasharray="3 3"/>
            )}

            {/* Ponto */}
            <circle
              cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3}
              fill={hoverIdx === i ? '#fff' : '#9900ff'}
              stroke={hoverIdx === i ? '#9900ff' : 'transparent'}
              strokeWidth="2"
              style={{ transition: 'r .15s' }}
            />

            {/* Tooltip */}
            {hoverIdx === i && p.total > 0 && (
              <g>
                <rect
                  x={Math.min(Math.max(p.x - 40, padL), W - padR - 80)}
                  y={p.y - 36}
                  width="80" height="26" rx="6"
                  fill="#1a0040"
                />
                <text
                  x={Math.min(Math.max(p.x, padL + 40), W - padR - 40)}
                  y={p.y - 19}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#ffffff88"
                  fontFamily="Inter, sans-serif"
                >
                  {p.label}
                </text>
                <text
                  x={Math.min(Math.max(p.x, padL + 40), W - padR - 40)}
                  y={p.y - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#fff"
                  fontFamily="Inter, sans-serif"
                  fontWeight="700"
                >
                  {fmt(p.total)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Gráfico de barras para pagamentos ────────────────────
function GraficoBarras({ dados }: { dados: { label: string; pct: number; value: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {dados.map((d, i) => (
        <div
          key={i}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ cursor: 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: hoverIdx === i ? '#111827' : '#374151', transition: 'color .15s' }}>
              {d.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af' }}>
                R$ {d.value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#7700ff', background: '#f5f0ff', padding: '1px 7px', borderRadius: '5px' }}>
                {d.pct}%
              </span>
            </div>
          </div>
          <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${d.pct}%`,
              background: hoverIdx === i
                ? 'linear-gradient(90deg, #ff33cc, #cc00ff)'
                : 'linear-gradient(90deg, #e879f9, #9900ff)',
              borderRadius: '99px',
              transition: 'width .5s cubic-bezier(.4,0,.2,1), background .2s',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────
export default function GraficosFinanceiro({ pedidos }: Props) {
  const [periodo, setPeriodo] = useState<'3m' | '6m' | '12m'>('6m')

  const agora = new Date()
  const mesesAtras = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12

  const mesesPeriodo = Array.from({ length: mesesAtras }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (mesesAtras - 1 - i), 1)
    return { ano: d.getFullYear(), mes: d.getMonth(), label: MESES[d.getMonth()] }
  })

  const receitaPorMes = mesesPeriodo.map(({ ano, mes, label }) => {
    const total = pedidos
      .filter(p => {
        const d = new Date(p.criado_em)
        return d.getFullYear() === ano && d.getMonth() === mes && p.status !== 'cancelado'
      })
      .reduce((s, p) => s + Number(p.valor_total), 0)
    return { label, total }
  })

  const totalRecebido  = pedidos.filter(p => p.status === 'concluido').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalPendente  = pedidos.filter(p => p.status === 'pendente' || p.status === 'confirmado').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalCancelado = pedidos.filter(p => p.status === 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalGeral     = pedidos.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)

  const pagamentos = pedidos
    .filter(p => p.status !== 'cancelado' && p.forma_pagamento)
    .reduce((acc, p) => {
      const f = p.forma_pagamento!
      acc[f] = (acc[f] || 0) + Number(p.valor_total)
      return acc
    }, {} as Record<string, number>)

  const totalPag = Object.values(pagamentos).reduce((s, v) => s + v, 0) || 1

  const pagDados = Object.entries(pagamentos)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, pct: Math.round((value / totalPag) * 100) }))

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  const metricCards = [
    { label: 'Total geral',  value: fmt(totalGeral),    sub: 'Exceto cancelados',       icon: <IconMoney />,  accent: '#7700ff' },
    { label: 'Recebido',     value: fmt(totalRecebido), sub: 'Pedidos concluídos',       icon: <IconCheck />,  accent: '#059669' },
    { label: 'A receber',    value: fmt(totalPendente), sub: 'Pendentes + confirmados',  icon: <IconClock />,  accent: '#d97706' },
    { label: 'Cancelado',    value: fmt(totalCancelado),sub: 'Pedidos cancelados',       icon: <IconX />,      accent: '#dc2626' },
  ]

  const statusBars = [
    { label: 'Recebido',  value: totalRecebido,  color: '#059669' },
    { label: 'A receber', value: totalPendente,  color: '#d97706' },
    { label: 'Cancelado', value: totalCancelado, color: '#dc2626' },
  ]

  return (
    <div>

      {/* ── Cards métricas ── */}
      <div className="fin-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {metricCards.map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${card.accent}12`, color: card.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{card.label}</p>
              <p className="fin-card-value" style={{ fontFamily: 'Inter, sans-serif', fontSize: '17px', fontWeight: 800, color: card.accent, margin: '0 0 1px 0', letterSpacing: '-0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db', margin: 0 }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráfico de linha ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '22px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px 0' }}>Receita por mês</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
              Total no período: {fmt(receitaPorMes.reduce((s, m) => s + m.total, 0))}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#f6f6f8', borderRadius: '8px', padding: '3px' }}>
            {(['3m', '6m', '12m'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                  background: periodo === p ? '#fff' : 'transparent',
                  color: periodo === p ? '#111827' : '#9ca3af',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px',
                  cursor: 'pointer',
                  boxShadow: periodo === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all .15s',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <GraficoLinha dados={receitaPorMes} />
      </div>

      {/* ── Status + Pagamentos ── */}
      <div className="fin-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Status financeiro */}
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 16px 0' }}>Status financeiro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {statusBars.map((item, i) => {
              const base = totalGeral + totalCancelado
              const pct = base > 0 ? Math.round((item.value / base) * 100) : 0
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#374151' }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827' }}>{fmt(item.value)}</span>
                  </div>
                  <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '99px', transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Formas de pagamento */}
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <span style={{ color: '#7700ff' }}><IconCard /></span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>Formas de pagamento</p>
          </div>
          {pagDados.length > 0 ? (
            <GraficoBarras dados={pagDados} />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><IconEmpty /></div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: 0 }}>Nenhum dado ainda</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}