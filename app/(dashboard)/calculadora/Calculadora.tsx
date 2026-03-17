'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

interface ItemAcervoKit {
  id: number
  nome: string
  custo: number
  acervoId?: string
}

interface ItemConsumivel {
  id: number
  nome: string
  custo: number
  rende: number
}

interface Kit {
  id: string
  nome: string
  itens: ItemAcervoKit[]
  consumiveis: ItemConsumivel[]
  locacoes: number
  multiplicador: number
  lucro: number
  custo_vida: number
  festas_kit_mes: number
  criado_em: string
  frete?: number
}

interface Props {
  acervo: ItemAcervo[]
}

function ordinal(n: number) {
  if (n === 1) return '1ª'
  if (n === 2) return '2ª'
  if (n === 3) return '3ª'
  return `${n}ª`
}

// Sugestões de arredondamento atrativo
function sugerirPrecos(preco: number): number[] {
  const sugestoes = new Set<number>()
  // terminações atrativas: .90, .00, .50
  const bases = [
    Math.floor(preco / 10) * 10 - 0.10,
    Math.round(preco / 10) * 10 - 0.10,
    Math.ceil(preco / 10) * 10 - 0.10,
    Math.floor(preco / 5) * 5,
    Math.round(preco / 5) * 5,
    Math.ceil(preco / 5) * 5,
  ]
  bases.forEach(b => {
    if (b > 0) sugestoes.add(parseFloat(b.toFixed(2)))
  })
  return Array.from(sugestoes).filter(v => v >= preco * 0.85).sort((a, b) => a - b).slice(0, 5)
}

export default function Calculadora({ acervo }: Props) {
  const [itens, setItens] = useState<ItemAcervoKit[]>([{ id: 1, nome: '', custo: 0 }])
  const [consumiveis, setConsumiveis] = useState<ItemConsumivel[]>([{ id: 1, nome: '', custo: 0, rende: 1 }])
  const [locacoes, setLocacoes] = useState(20)
  const [multiplicador, setMultiplicador] = useState(100)
  const [lucro, setLucro] = useState(100)
  const [custoVida, setCustoVida] = useState(0)
  const [festasKitMes, setFestasKitMes] = useState(16)
  const [frete, setFrete] = useState(0)
  const [precoAlvo, setPrecoAlvo] = useState(0)

  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
  const [nomeKit, setNomeKit] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoKits, setCarregandoKits] = useState(false)
  const [exportando, setExportando] = useState(false)

  // Modal de exportar com arredondamento
  const [modalExportar, setModalExportar] = useState<{ kit: Kit; precoCalculado: number } | null>(null)
  const [precoExportar, setPrecoExportar] = useState(0)

  const supabase = createClient()

  async function carregarKits() {
    setCarregandoKits(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('kits').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false })
    if (data) setKits(data)
    setCarregandoKits(false)
  }

  useEffect(() => { void carregarKits() }, []) // eslint-disable-line

  async function salvarKit() {
    if (!nomeKit.trim()) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { nome: nomeKit, itens, consumiveis, locacoes, multiplicador, lucro, frete, custo_vida: custoVida, festas_kit_mes: festasKitMes }
    if (editandoId) {
      await supabase.from('kits').update({ ...payload, atualizado_em: new Date().toISOString() }).eq('id', editandoId)
    } else {
      await supabase.from('kits').insert({ usuario_id: user.id, ...payload })
    }
    await carregarKits()
    setModalSalvar(false)
    setSalvando(false)
  }

  function carregarKit(kit: Kit) {
    const itensLegado = kit.itens ?? []
    if (itensLegado[0] && 'locacoes' in itensLegado[0]) {
      const converted = (itensLegado as unknown as (ItemAcervoKit & { locacoes?: number })[]).map(i => ({ id: i.id, nome: i.nome, custo: i.custo, acervoId: i.acervoId }))
      setItens(converted)
      const firstLocacoes = (itensLegado[0] as unknown as { locacoes?: number }).locacoes
      if (firstLocacoes) setLocacoes(firstLocacoes)
    } else {
      setItens(itensLegado.length > 0 ? itensLegado : [{ id: 1, nome: '', custo: 0 }])
    }
    setConsumiveis(kit.consumiveis?.length > 0 ? kit.consumiveis : [{ id: 1, nome: '', custo: 0, rende: 1 }])
    setLocacoes(kit.locacoes ?? 20)
    setMultiplicador(kit.multiplicador ?? 100)
    setLucro(kit.lucro ?? 100)
    setCustoVida(kit.custo_vida ?? 0)
    setFrete(kit.frete ?? 0)
    setFestasKitMes(kit.festas_kit_mes ?? 16)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    setKits(p => p.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
  }

  // Abre o modal de exportar com sugestões de preço
  function abrirModalExportar(kit: Kit) {
    const custoAcervoK = (kit.itens ?? []).reduce((acc, i) => acc + (kit.locacoes > 0 ? i.custo / kit.locacoes : 0), 0)
    const custoConsumivelK = (kit.consumiveis ?? []).reduce((acc, i) => acc + (i.rende > 0 ? i.custo / i.rende : 0), 0)
    const custoBaseK = custoAcervoK + custoConsumivelK
    const custoComExtrasK = custoBaseK + (kit.frete ?? 0)
    const precoCalc = custoComExtrasK * (1 + kit.lucro / 100)
    setPrecoExportar(parseFloat(precoCalc.toFixed(2)))
    setModalExportar({ kit, precoCalculado: precoCalc })
  }

  async function confirmarExportacao() {
    if (!modalExportar) return
    setExportando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('catalogo_kits').insert({
      usuario_id: user.id,
      nome: modalExportar.kit.nome,
      descricao: 'Kit exportado da calculadora',
      preco: precoExportar,
      itens: [...(modalExportar.kit.itens ?? []), ...(modalExportar.kit.consumiveis ?? [])].map(i => i.nome).filter(Boolean),
      foto_url: null,
    })
    setModalExportar(null)
    setExportando(false)
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0 }])
    setConsumiveis([{ id: 1, nome: '', custo: 0, rende: 1 }])
    setLocacoes(20); setMultiplicador(100); setLucro(100); setFrete(0)
    setCustoVida(0); setFestasKitMes(16); setPrecoAlvo(0)
    setEditandoId(null); setNomeKit('')
  }

  function preencherDoAcervo(itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    setItens(p => p.map(i => i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i))
  }

  const temAcervo = acervo.length > 0

  // ── CÁLCULOS ──────────────────────────────────────────
  const custoAcervo = itens.reduce((acc, i) => acc + (locacoes > 0 ? i.custo / locacoes : 0), 0)
  const custoConsumiveis = consumiveis.reduce((acc, i) => acc + (i.rende > 0 ? i.custo / i.rende : 0), 0)
  const custoBase = custoAcervo + custoConsumiveis
  const custoComExtras = custoBase + frete
  const valorLucro = custoComExtras * (lucro / 100)
  const precoFinal = custoComExtras + valorLucro

  const custoTotalAcervo = itens.reduce((acc, i) => acc + i.custo, 0)
  const festasParaPagarAcervo = precoFinal > 0 && custoTotalAcervo > 0
    ? Math.ceil(custoTotalAcervo / precoFinal) : null
  const acervoPagoNaQuarta = festasParaPagarAcervo !== null && festasParaPagarAcervo <= 4

  const margemParaAlvo = precoAlvo > 0 && custoComExtras > 0 ? Math.round(((precoAlvo - custoComExtras) / custoComExtras) * 100) : null

  // Status da margem
  const margemStatus = lucro < 100
    ? { cor: '#dc2626', texto: '❌ Abaixo do mínimo recomendado: 100%' }
    : lucro < 150
    ? { cor: '#f59e0b', texto: '⚠️ Recomendado: 150%–200%' }
    : { cor: '#10b981', texto: '✅ Boa margem' }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '10px', padding: '10px 12px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase',
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '16px',
  }

  return (
    <div>

      {/* ── Barra de ações ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {editandoId && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 600, background: '#fff0fb', padding: '6px 12px', borderRadius: '100px', border: '1px solid #ffd6f5' }}>
              ✏️ {nomeKit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {editandoId && (
            <button onClick={novaCalculadora} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: '999px', padding: '10px 14px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              <X size={14} /> Novo
            </button>
          )}
          <button onClick={() => { setModalKits(true); void carregarKits() }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: '999px', padding: '10px 14px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <FolderOpen size={14} /> Kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button onClick={() => setModalSalvar(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '10px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <Save size={14} /> {editandoId ? 'Salvar' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* ── ACERVO ── */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Itens do acervo</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>
            Painel, mesa, capa, jarro, boleira... — itens que você reutiliza
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {itens.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {idx === 0 && <span style={{ ...labelStyle, marginBottom: '4px', display: 'block' }}>Item{temAcervo ? <span style={{ color: '#ff33cc', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> · selecione ou digite</span> : ''}</span>}
                  {/* Input misto: select + text unificados */}
                  <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                    {temAcervo && (
                      <select
                        value={item.acervoId ?? ''}
                        onChange={e => preencherDoAcervo(item.id, e.target.value)}
                        style={{ border: 'none', borderRight: '1px solid #e5e5e5', background: 'transparent', padding: '10px 6px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', width: '90px', flexShrink: 0 }}
                      >
                        <option value="">Acervo</option>
                        {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                      </select>
                    )}
                    <input
                      type="text"
                      value={item.nome}
                      onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value, acervoId: undefined } : i))}
                      placeholder={temAcervo ? 'ou digite...' : 'Ex: Painel, Mesa...'}
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', outline: 'none', minWidth: 0 }}
                    />
                  </div>
                </div>
                <div style={{ width: '110px', flexShrink: 0 }}>
                  {idx === 0 && <span style={{ ...labelStyle, marginBottom: '4px', display: 'block' }}>Custo (R$)</span>}
                  <input type="number" value={item.custo || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                </div>
                <button
                  onClick={() => setItens(p => p.filter(i => i.id !== item.id))}
                  disabled={itens.length === 1}
                  style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: itens.length === 1 ? '#f9f9f9' : '#fff5fd', color: itens.length === 1 ? '#00000022' : '#ff33cc', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: idx === 0 ? '20px' : '0' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {item.custo > 0 && locacoes > 0 && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 600, paddingLeft: '4px' }}>
                  R$ {(item.custo / locacoes).toFixed(2).replace('.', ',')} por festa
                </span>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setItens(p => [...p, { id: Date.now(), nome: '', custo: 0 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ff33cc55', borderRadius: '999px', padding: '10px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
          <Plus size={14} /> Adicionar item do acervo
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo do acervo por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>R$ {custoAcervo.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── CONSUMÍVEIS ── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Consumíveis por festa</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 16px 0' }}>
          Bolas, spray, fita, adesivo... — coloque o custo que você gasta por festa
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {consumiveis.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {idx === 0 && <span style={labelStyle}>Item</span>}
                  <input type="text" value={item.nome} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Saco de bola, Spray..." style={inputStyle} />
                </div>
                <div style={{ width: '100px', flexShrink: 0 }}>
                  {idx === 0 && <span style={labelStyle}>Custo (R$)</span>}
                  <input type="number" value={item.custo || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                </div>
                <div style={{ width: '100px', flexShrink: 0 }}>
                  {idx === 0 && <span style={labelStyle}>Rende</span>}
                  <input type="number" value={item.rende || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, rende: parseFloat(e.target.value) || 1 } : i))} placeholder="festas" min="1" style={inputStyle} />
                </div>
                <button
                  onClick={() => setConsumiveis(p => p.filter(i => i.id !== item.id))}
                  disabled={consumiveis.length === 1}
                  style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${consumiveis.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: consumiveis.length === 1 ? '#f9f9f9' : '#fff5fd', color: consumiveis.length === 1 ? '#00000022' : '#ff33cc', cursor: consumiveis.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: idx === 0 ? '20px' : '0' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {item.custo > 0 && item.rende > 0 && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 600, paddingLeft: '4px' }}>
                  R$ {(item.custo / item.rende).toFixed(2).replace('.', ',')} por festa
                </span>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setConsumiveis(p => [...p, { id: Date.now(), nome: '', custo: 0, rende: 1 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ff33cc55', borderRadius: '999px', padding: '10px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
          <Plus size={14} /> Adicionar consumível
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo consumíveis por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── PRECIFICAÇÃO ── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Precificação</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 20px 0' }}>Configure como o preço do seu kit é calculado</p>

        {/* Locações + Frete */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Locações esperadas do kit</label>
            <input
              type="number"
              value={locacoes || ''}
              onChange={e => setLocacoes(parseFloat(e.target.value) || 1)}
              placeholder="Ex: 20"
              min="1"
              style={inputStyle}
            />
            {custoAcervo > 0 && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', margin: '5px 0 0', fontWeight: 600 }}>
                R$ {custoAcervo.toFixed(2).replace('.', ',')} de acervo por festa
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Frete por festa (R$) <span style={{ color: '#00000033', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— opcional</span></label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
          </div>
        </div>

        {/* Preço desejado */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Preço desejado (R$) <span style={{ color: '#00000033', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— opcional</span></label>
          <input type="number" value={precoAlvo || ''} onChange={e => setPrecoAlvo(parseFloat(e.target.value) || 0)} placeholder="Ex: 100,00" min="0" step="0.01" style={inputStyle} />
          {margemParaAlvo !== null && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', margin: '4px 0 0', fontWeight: 600, color: margemParaAlvo < 0 ? '#cc0000' : '#10b981' }}>
              {margemParaAlvo < 0 ? '❌ Abaixo do custo mínimo' : `→ Equivale a ${margemParaAlvo}% de lucro`}
            </p>
          )}
        </div>

        {/* Margem de lucro — único slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Margem de lucro</label>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '26px', color: '#ff33cc', letterSpacing: '-0.5px', lineHeight: 1 }}>{lucro}%</span>
          </div>
          <input
            type="range" min={0} max={300} value={lucro}
            onChange={e => setLucro(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ff33cc', height: '4px', cursor: 'pointer', marginBottom: '6px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>0%</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: margemStatus.cor, fontWeight: 600 }}>
              {margemStatus.texto}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>300%</span>
          </div>
        </div>
      </div>

      {/* ── RESULTADO ── */}
      <div style={{ background: '#140033', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ffffff55', margin: '0 0 18px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Resultado</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Acervo por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {custoAcervo.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Consumíveis por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
          </div>
          {frete > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Frete por festa</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {frete.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ffffff15' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Custo total por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 700 }}>R$ {custoComExtras.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Margem de lucro ({lucro}%)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {valorLucro.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ffffff18', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff' }}>Preço por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#ff33cc', letterSpacing: '-1px' }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {precoAlvo > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ffffff10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33' }}>
              Preço desejado: R$ {precoAlvo.toFixed(2).replace('.', ',')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: precoFinal >= precoAlvo ? '#10b981' : '#f59e0b' }}>
              {precoFinal >= precoAlvo
                ? `✓ R$ ${(precoFinal - precoAlvo).toFixed(2).replace('.', ',')} acima`
                : `Faltam R$ ${(precoAlvo - precoFinal).toFixed(2).replace('.', ',')} para atingir`}
            </span>
          </div>
        )}
      </div>

      {/* ── CARD PAYBACK DO ACERVO ── */}
      {festasParaPagarAcervo !== null && precoFinal > 0 && (
        <div style={{
          background: acervoPagoNaQuarta ? '#f0fdf4' : '#fef2f2',
          border: `1.5px solid ${acervoPagoNaQuarta ? '#86efac' : '#fca5a5'}`,
          borderRadius: '14px', padding: '16px 20px', marginBottom: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1 }}>{acervoPagoNaQuarta ? '✅' : '⚠️'}</span>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: acervoPagoNaQuarta ? '#15803d' : '#dc2626', margin: '0 0 4px 0' }}>
              {acervoPagoNaQuarta
                ? `Você paga os materiais na ${ordinal(festasParaPagarAcervo)} festa 🎉`
                : `Você só paga os materiais na ${ordinal(festasParaPagarAcervo)} festa`}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: acervoPagoNaQuarta ? '#166534' : '#991b1b', margin: 0, lineHeight: 1.5 }}>
              {acervoPagoNaQuarta
                ? `Com R$ ${precoFinal.toFixed(2).replace('.', ',')} por festa, seu acervo de R$ ${custoTotalAcervo.toFixed(2).replace('.', ',')} se paga rapidinho. A ${ordinal(festasParaPagarAcervo + 1)} festa em diante é lucro puro.`
                : `Seu acervo custa R$ ${custoTotalAcervo.toFixed(2).replace('.', ',')} e você cobra R$ ${precoFinal.toFixed(2).replace('.', ',')} por festa. Considere aumentar o preço para recuperar o investimento antes da 4ª festa.`}
            </p>
          </div>
        </div>
      )}

      {/* ── Modal Salvar ── */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalSalvar(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px 0' }}>
              {editandoId ? 'Salvar alterações' : 'Salvar kit'}
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 24px 0' }}>Dê um nome para identificar este kit</p>
            <input type="text" value={nomeKit} onChange={e => setNomeKit(e.target.value)} placeholder="Ex: Kit Mesa Completo..." autoFocus
              onKeyDown={e => e.key === 'Enter' && salvarKit()}
              style={{ width: '100%', background: '#f9f9f9', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '14px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarKit} disabled={!nomeKit.trim() || salvando} style={{ flex: 2, padding: '12px', background: nomeKit.trim() ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', color: nomeKit.trim() ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: nomeKit.trim() ? 'pointer' : 'not-allowed' }}>
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Kits ── */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setModalKits(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#140033', margin: 0 }}>Kits salvos</p>
              <button onClick={() => setModalKits(false)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e5e5e5', background: '#f9f9f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00000066' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '16px 20px 32px' }}>
              {carregandoKits ? (
                <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px', padding: '32px 0' }}>Carregando...</p>
              ) : kits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: '40px', marginBottom: '8px' }}>📭</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px' }}>Nenhum kit salvo ainda</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {kits.map(kit => (
                    <div key={kit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: editandoId === kit.id ? '#fff0fb' : '#f9f9f9', border: `1.5px solid ${editandoId === kit.id ? '#ff33cc' : '#eeeeee'}`, borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px' }}>
                          {kit.nome}
                          {editandoId === kit.id && <span style={{ color: '#ff33cc', fontSize: '11px', marginLeft: '8px' }}>● editando</span>}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                          {(kit.itens ?? []).length} itens · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => carregarKit(kit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                          <Pencil size={12} /> Carregar
                        </button>
                        <button onClick={() => { abrirModalExportar(kit); setModalKits(false) }} disabled={exportando} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1.5px solid #ff33cc', borderRadius: '999px', padding: '8px 10px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: exportando ? 0.6 : 1 }}>
                          ↑ Catálogo
                        </button>
                        <button onClick={() => deletarKit(kit.id)} style={{ width: 32, height: 32, background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '999px', color: '#ff33cc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Exportar com arredondamento ── */}
      {modalExportar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalExportar(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#140033', margin: '0 0 4px 0' }}>
              Enviar para o catálogo
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>
              Kit: <strong style={{ color: '#140033' }}>{modalExportar.kit.nome}</strong>
            </p>

            {/* Preço calculado */}
            <div style={{ background: '#fafafa', border: '1px solid #eeeeee', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000055', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preço calculado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#140033', margin: 0 }}>
                R$ {modalExportar.precoCalculado.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Sugestões */}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#00000055', margin: '0 0 8px 0' }}>
              💡 Preços mais atrativos:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {sugerirPrecos(modalExportar.precoCalculado).map(sugestao => (
                <button
                  key={sugestao}
                  onClick={() => setPrecoExportar(sugestao)}
                  style={{
                    padding: '7px 14px', borderRadius: '999px',
                    border: `1.5px solid ${precoExportar === sugestao ? '#ff33cc' : '#e5e5e5'}`,
                    background: precoExportar === sugestao ? '#fff0fb' : '#fafafa',
                    color: precoExportar === sugestao ? '#ff33cc' : '#140033',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  R$ {sugestao.toFixed(2).replace('.', ',')}
                </button>
              ))}
            </div>

            {/* Campo editável */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...labelStyle, marginBottom: '6px', display: 'block' }}>Ou defina o valor manualmente</label>
              <input
                type="number"
                value={precoExportar || ''}
                onChange={e => setPrecoExportar(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                min="0" step="0.01"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalExportar(null)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmarExportacao} disabled={exportando || precoExportar <= 0} style={{ flex: 2, padding: '12px', background: precoExportar > 0 ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', color: precoExportar > 0 ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: precoExportar > 0 ? 'pointer' : 'not-allowed' }}>
                {exportando ? 'Enviando...' : 'Enviar para o catálogo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}