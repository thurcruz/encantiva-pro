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

  const totalRecebido = pedidos.filter(p => p.status === 'concluido').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalPendente = pedidos.filter(p => p.status === 'pendente' || p.status === 'confirmado').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalCancelado = pedidos.filter(p => p.status === 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)
  const totalGeral = pedidos.filter(p => p.status !== 'cancelado').reduce((s, p) => s + Number(p.valor_total), 0)

  const pagamentos = pedidos
    .filter(p => p.status !== 'cancelado' && p.forma_pagamento)
    .reduce((acc, p) => {
      const f = p.forma_pagamento!
      acc[f] = (acc[f] || 0) + Number(p.valor_total)
      return acc
    }, {} as Record<string, number>)

  const totalPag = Object.values(pagamentos).reduce((s, v) => s + v, 0) || 1

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <div>
      {/* Cards resumo */}
      <div className="fin-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total geral', value: `R$ ${totalGeral.toFixed(2).replace('.', ',')}`, sub: 'Todos exceto cancelados', emoji: '💰', color: '#9900ff' },
          { label: 'Recebido', value: `R$ ${totalRecebido.toFixed(2).replace('.', ',')}`, sub: 'Pedidos concluídos', emoji: '✅', color: '#00aa55' },
          { label: 'A receber', value: `R$ ${totalPendente.toFixed(2).replace('.', ',')}`, sub: 'Pendentes + confirmados', emoji: '⏳', color: '#ff9900' },
          { label: 'Cancelado', value: `R$ ${totalCancelado.toFixed(2).replace('.', ',')}`, sub: 'Pedidos cancelados', emoji: '❌', color: '#ff3333' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {card.emoji}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#00000055', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{card.label}</p>
              <p className="fin-card-value" style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 900, color: card.color, margin: '0 0 1px 0', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#00000044', margin: 0 }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: 0 }}>
            📈 Receita por mês
          </h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['3m', '6m', '12m'] as const).map(p => (
              <button key={p} onClick={() => setPeriodo(p)} style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${periodo === p ? 'transparent' : '#e5e5e5'}`, background: periodo === p ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff', color: periodo === p ? '#fff' : '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', padding: '0 4px', overflowX: 'auto' }}>
          {receitaPorMes.map((m, i) => {
            const height = maxReceita > 0 ? Math.max((m.total / maxReceita) * 140, m.total > 0 ? 4 : 0) : 0
            return (
              <div key={i} style={{ flex: 1, minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {m.total > 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: '#9900ff', margin: 0, whiteSpace: 'nowrap' }}>
                    {m.total >= 1000 ? `R$${(m.total / 1000).toFixed(1)}k` : `R$${m.total.toFixed(0)}`}
                  </p>
                )}
                <div style={{ width: '100%', height: `${height}px`, background: 'linear-gradient(180deg, #ff33cc, #9900ff)', borderRadius: '6px 6px 0 0', minHeight: m.total > 0 ? '4px' : '0' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#00000055', margin: 0, whiteSpace: 'nowrap' }}>{m.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status + Pagamentos */}
      <div className="fin-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>
            💳 Status financeiro
          </h2>
          {[
            { label: 'Recebido', value: totalRecebido, color: '#00aa55' },
            { label: 'A receber', value: totalPendente, color: '#ff9900' },
            { label: 'Cancelado', value: totalCancelado, color: '#ff3333' },
          ].map((item, i) => {
            const pct = totalGeral + totalCancelado > 0 ? Math.round((item.value / (totalGeral + totalCancelado)) * 100) : 0
            return (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: item.color }}>{item.label}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#140033' }}>R$ {item.value.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '99px' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>
            💰 Formas de pagamento
          </h2>
          {Object.keys(pagamentos).length > 0 ? Object.entries(pagamentos)
            .sort((a, b) => b[1] - a[1])
            .map(([forma, valor], i) => {
              const pct = Math.round((valor / totalPag) * 100)
              return (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#140033' }}>{forma}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#9900ff' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #ff33cc, #9900ff)', borderRadius: '99px' }} />
                  </div>
                </div>
              )
            }) : (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', textAlign: 'center', margin: '24px 0' }}>Nenhum dado ainda</p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .fin-cards-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .fin-card-value { font-size: 16px !important; }
          .fin-bottom-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  )
}