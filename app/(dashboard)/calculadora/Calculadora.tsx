'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface Item {
  id: number
  nome: string
  custo: number
  meses: number
  festasporMes: number
}

export default function Calculadora() {
  const [itens, setItens] = useState<Item[]>([
    { id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 },
  ])
  const [lucro, setLucro] = useState(30)
  const [frete, setFrete] = useState(0)
  const [custoVida, setCustoVida] = useState(0)

  function adicionarItem() {
    setItens(prev => [...prev, { id: Date.now(), nome: '', custo: 0, meses: 6, festasporMes: 4 }])
  }

  function removerItem(id: number) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  function atualizarItem(id: number, campo: keyof Item, valor: string) {
    setItens(prev => prev.map(i =>
      i.id === id ? {
        ...i,
        [campo]: campo === 'nome' ? valor : parseFloat(valor) || 0
      } : i
    ))
  }

  // Cálculos por item
  const itensCusto = itens.map(item => {
    const totalFestas = item.meses * item.festasporMes
    const custoPorFesta = totalFestas > 0 ? item.custo / totalFestas : 0
    return { ...item, totalFestas, custoPorFesta }
  })

  const totalFestasGeral = itensCusto.reduce((acc, i) => acc + i.totalFestas, 0) / (itens.length || 1)
  const custoPorFestaTotal = itensCusto.reduce((acc, i) => acc + i.custoPorFesta, 0)
  const custoVidaPorFesta = totalFestasGeral > 0 ? custoVida / totalFestasGeral : 0
  const subtotal = custoPorFestaTotal + custoVidaPorFesta + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoFinal = subtotal + valorLucro

  const inputStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#140033',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000055',
    marginBottom: '6px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <div>
      {/* Itens do kit */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>
          🎪 Itens do kit
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>
          Cada item tem seu próprio período de uso e número de festas
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'end' }}>
            <label style={labelStyle}>Item</label>
            <label style={labelStyle}>Custo (R$)</label>
            <label style={labelStyle}>Meses</label>
            <label style={labelStyle}>Festas/mês</label>
            <div />
          </div>

          {itens.map((item) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={item.nome}
                  onChange={e => atualizarItem(item.id, 'nome', e.target.value)}
                  placeholder="Ex: Painel, Totem..."
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.custo || ''}
                  onChange={e => atualizarItem(item.id, 'custo', e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.meses || ''}
                  onChange={e => atualizarItem(item.id, 'meses', e.target.value)}
                  placeholder="6"
                  min="1"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.festasporMes || ''}
                  onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)}
                  placeholder="4"
                  min="1"
                  style={inputStyle}
                />
                <button
                  onClick={() => removerItem(item.id)}
                  disabled={itens.length === 1}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                    background: itens.length === 1 ? '#f9f9f9' : '#fff5fd',
                    border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`,
                    borderRadius: '8px',
                    color: itens.length === 1 ? '#00000022' : '#ff33cc',
                    cursor: itens.length === 1 ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Mini resumo por item */}
              {item.custo > 0 && (
                <div style={{
                  display: 'flex', gap: '16px',
                  paddingLeft: '4px',
                }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044' }}>
                    {item.meses * item.festasporMes} festas no período
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9900ff', fontWeight: 600 }}>
                    R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} por festa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={adicionarItem}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'transparent',
            border: '1px dashed #9900ff55',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#9900ff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} />
          Adicionar item
        </button>

        {/* Total itens */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '16px', paddingTop: '16px',
          borderTop: '1px solid #f0f0f0',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066' }}>
            Custo total dos itens por festa
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033' }}>
            R$ {custoPorFestaTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Custos adicionais */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>
          💰 Custos adicionais
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>
          Outros custos que entram no preço final por festa
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Custo de vida mensal (R$)</label>
            <input
              type="number"
              value={custoVida || ''}
              onChange={e => setCustoVida(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 3000,00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', margin: '4px 0 0 0' }}>
              Dividido pela média de festas
            </p>
          </div>
          <div>
            <label style={labelStyle}>Frete por festa (R$)</label>
            <input
              type="number"
              value={frete || ''}
              onChange={e => setFrete(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 50,00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Lucro desejado (%)</label>
            <input
              type="number"
              value={lucro || ''}
              onChange={e => setLucro(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 30"
              min="0"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div style={{
        background: 'linear-gradient(135deg, #140033, #1a0044)',
        border: '1px solid #ffffff12',
        borderRadius: '16px',
        padding: '28px',
      }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#ffffff88', margin: '0 0 20px 0' }}>
          📊 Resultado
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Custo dos itens por festa', valor: custoPorFestaTotal },
            { label: 'Custo de vida por festa', valor: custoVidaPorFesta },
            { label: 'Frete', valor: frete },
            { label: `Lucro (${lucro}%)`, valor: valorLucro },
          ].map(linha => (
            <div key={linha.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66' }}>
                {linha.label}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc', fontWeight: 600 }}>
                R$ {linha.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid #ffffff18',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff' }}>
            Preço por festa
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '36px',
            color: '#ff33cc',
            letterSpacing: '-1px',
          }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  )
}