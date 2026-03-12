'use client'

import { useState } from 'react'

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

// ── Ícones SVG ────────────────────────────────────────────
const IconMoney    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="4" width="14" height="9" rx="2"/><circle cx="8" cy="8.5" r="2"/><path d="M4.5 4V3M11.5 4V3"/></svg>
const IconCheck    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>
const IconClock    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/></svg>
const IconX        = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 5l6 6M11 5l-6 6"/></svg>
const IconTrend    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10l3-4 3 2.5 2.5-3.5L13 3"/><path d="M9 3h4v4"/></svg>
const IconCard     = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M1 6h12"/></svg>
const IconEmpty    = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.4" strokeLinecap="round"><rect x="6" y="8" width="28" height="24" rx="3"/><path d="M12 16h16M12 21h10M12 26h6"/></svg>

export default function GraficosFinanceiro({ pedidos }: Props) {
  const [periodo, setPeriodo] = useState<'3m' | '6m' | '12m'>('6m')

  const agora = new Date()
  const mesesAtras = periodo === '3m' ? 3 : periodo === '6m' ? 6 : 12

  const mesesPeriodo = Array.from({ length: mesesAtras }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (mesesAtras - 1 - i), 1)
    return { ano: d.getFullYear(), mes: d.getMonth(), label: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` }
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

  const maxReceita = Math.max(...receitaPorMes.map(m => m.total), 1)

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

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  const metricCards = [
    { label: 'Total geral',  value: fmt(totalGeral),     sub: 'Exceto cancelados', icon: <IconMoney />,  accent: '#7700ff' },
    { label: 'Recebido',     value: fmt(totalRecebido),  sub: 'Pedidos concluídos', icon: <IconCheck />,  accent: '#059669' },
    { label: 'A receber',    value: fmt(totalPendente),  sub: 'Pendentes + confirmados', icon: <IconClock />,  accent: '#d97706' },
    { label: 'Cancelado',    value: fmt(totalCancelado), sub: 'Pedidos cancelados', icon: <IconX />,     accent: '#dc2626' },
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

      {/* ── Gráfico de barras ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '22px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ color: '#7700ff' }}><IconTrend /></span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>Receita por mês</p>
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

        {/* Barras */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', overflowX: 'auto' }}>
          {receitaPorMes.map((m, i) => {
            const h = maxReceita > 0 ? Math.max((m.total / maxReceita) * 120, m.total > 0 ? 4 : 0) : 0
            const isCurrent = i === receitaPorMes.length - 1
            return (
              <div key={i} style={{ flex: 1, minWidth: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {m.total > 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', fontWeight: 700, color: '#7700ff', margin: 0, whiteSpace: 'nowrap' }}>
                    {m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : `${m.total.toFixed(0)}`}
                  </p>
                )}
                <div style={{
                  width: '100%', height: `${h}px`,
                  background: isCurrent
                    ? 'linear-gradient(180deg, #ff33cc, #9900ff)'
                    : 'linear-gradient(180deg, #e9d5ff, #c4b5fd)',
                  borderRadius: '5px 5px 0 0',
                  minHeight: m.total > 0 ? '4px' : '0',
                }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: isCurrent ? '#111827' : '#9ca3af', fontWeight: isCurrent ? 700 : 400, margin: 0, whiteSpace: 'nowrap' }}>
                  {m.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Linha base */}
        <div style={{ height: '1px', background: '#f3f4f6', marginTop: '6px' }} />
      </div>

      {/* ── Status + Formas de pagamento ── */}
      <div className="fin-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Status financeiro */}
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 16px 0' }}>Status financeiro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {[
              { label: 'Recebido', value: totalRecebido,  color: '#059669' },
              { label: 'A receber', value: totalPendente, color: '#d97706' },
              { label: 'Cancelado', value: totalCancelado, color: '#dc2626' },
            ].map((item, i) => {
              const base = totalGeral + totalCancelado
              const pct = base > 0 ? Math.round((item.value / base) * 100) : 0
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#374151' }}>{item.label}</span>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                      {fmt(item.value)}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '99px', transition: 'width .4s ease' }} />
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

          {Object.keys(pagamentos).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {Object.entries(pagamentos)
                .sort((a, b) => b[1] - a[1])
                .map(([forma, valor], i) => {
                  const pct = Math.round((valor / totalPag) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: '#374151' }}>{forma}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#7700ff', background: '#f5f0ff', padding: '1px 7px', borderRadius: '5px' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '4px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff33cc, #9900ff)', borderRadius: '99px', transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  )
                })}
            </div>
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