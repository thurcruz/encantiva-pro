'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

// ── Ícones SVG ───────────────────────────────────────────
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h6.5L12 4.5V11a1 1 0 0 1-1 1z"/><path d="M9 12V8H5v4M5 2v3h4"/></svg>
const IconFolder  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4a1 1 0 0 1 1-1h3l1.5 2H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4z"/></svg>
const IconX       = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
const IconEdit    = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/></svg>
const IconNew     = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1v12M1 7h12"/></svg>
const IconExport  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9v2h9V9M6.5 1v8M4 5l2.5-2.5L9 5"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>

// ── Tipos ────────────────────────────────────────────────
interface Item {
  id: number
  nome: string
  custo: number
  meses: number
  festasporMes: number
  acervoId?: string  // opcional — puxado do acervo
}

interface Kit {
  id: string
  nome: string
  itens: Item[]
  lucro: number
  frete: number
  custo_vida: number
  festas_kit_mes: number
  criado_em: string
}

// ── Estilos ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
  borderRadius: '10px', padding: '10px 12px', color: '#111827',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase',
}
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec',
  borderRadius: '14px', padding: '22px', marginBottom: '16px',
}
const btnPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: '#ff33cc', color: '#fff', border: 'none',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '10px 18px', whiteSpace: 'nowrap',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  background: '#fff', color: '#374151', border: '1px solid #e8e8ec',
  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '9px 16px', whiteSpace: 'nowrap',
}
const btnSec: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  background: 'transparent', color: '#ff33cc', border: '1.5px solid #ff33cc',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
  borderRadius: '999px', cursor: 'pointer', padding: '7px 14px', whiteSpace: 'nowrap',
}

interface Props {
  acervo: ItemAcervo[]
}

export default function Calculadora({ acervo }: Props) {
  const supabase = createClient()

  const [itens, setItens] = useState<Item[]>([
    { id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 },
  ])
  const [lucro, setLucro] = useState(30)
  const [frete, setFrete] = useState(0)
  const [custoVida, setCustoVida] = useState(0)
  const [festasKitMes, setFestasKitMes] = useState(4)
  const [precoAlvo, setPrecoAlvo] = useState(0) // campo de preço alvo

  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
  const [kitDetalhe, setKitDetalhe] = useState<Kit | null>(null)
  const [nomeKit, setNomeKit] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoKits, setCarregandoKits] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [exportadoId, setExportadoId] = useState<string | null>(null)

  async function carregarKits() {
    setCarregandoKits(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('kits')
      .select('*')
      .eq('usuario_id', user.id)
      .order('criado_em', { ascending: false })
    if (data) setKits(data)
    setCarregandoKits(false)
  }

  useEffect(() => {
    void carregarKits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function salvarKit() {
    if (!nomeKit.trim()) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editandoId) {
      await supabase.from('kits').update({
        nome: nomeKit, itens, lucro, frete,
        custo_vida: custoVida,
        festas_kit_mes: festasKitMes,
        atualizado_em: new Date().toISOString(),
      }).eq('id', editandoId)
    } else {
      await supabase.from('kits').insert({
        usuario_id: user.id, nome: nomeKit, itens, lucro, frete,
        custo_vida: custoVida, festas_kit_mes: festasKitMes,
      })
    }
    await carregarKits()
    setModalSalvar(false)
    setSalvando(false)
  }

  function carregarKit(kit: Kit) {
    setItens(kit.itens)
    setLucro(kit.lucro)
    setFrete(kit.frete)
    setCustoVida(kit.custo_vida)
    setFestasKitMes(kit.festas_kit_mes ?? 4)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
    setKitDetalhe(null)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    setKits(p => p.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
    if (kitDetalhe?.id === id) setKitDetalhe(null)
  }

  async function exportarParaCatalogo(kit: Kit) {
    setExportando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Calcula o preço final deste kit para usar como preço no catálogo
    const itensCusto = kit.itens.map(item => {
      const totalFestas = item.meses * item.festasporMes
      return totalFestas > 0 ? item.custo / totalFestas : 0
    })
    const custoPorFesta = itensCusto.reduce((s, c) => s + c, 0)
    const mediaFestas = kit.itens.reduce((s, i) => s + i.meses * i.festasporMes, 0) / (kit.itens.length || 1)
    const custoVidaPorFesta = mediaFestas > 0 ? kit.custo_vida / mediaFestas : 0
    const subtotal = custoPorFesta + custoVidaPorFesta + kit.frete
    const preco = subtotal * (1 + kit.lucro / 100)

    await supabase.from('catalogo_kits').insert({
      usuario_id: user.id,
      nome: kit.nome,
      descricao: `Kit com ${kit.itens.length} item(ns) — exportado da calculadora`,
      preco: Math.ceil(preco / 5) * 5, // arredonda para múltiplo de 5 acima (ex: 87 → 90)
      itens: kit.itens.map(i => i.nome).filter(Boolean),
      foto_url: null,
    })

    setExportadoId(kit.id)
    setTimeout(() => setExportadoId(null), 3000)
    setExportando(false)
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 }])
    setLucro(30); setFrete(0); setCustoVida(0); setFestasKitMes(4)
    setEditandoId(null); setNomeKit('')
  }

  function adicionarItem() {
    setItens(p => [...p, { id: Date.now(), nome: '', custo: 0, meses: 6, festasporMes: 4 }])
  }

  function removerItem(id: number) {
    setItens(p => p.filter(i => i.id !== id))
  }

  function atualizarItem(id: number, campo: keyof Item, valor: string) {
    setItens(p => p.map(i =>
      i.id === id ? { ...i, [campo]: campo === 'nome' ? valor : parseFloat(valor) || 0 } : i
    ))
  }

  // Preenche item a partir do acervo
  function preencherDoAcervo(itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    setItens(p => p.map(i =>
      i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i
    ))
  }

  // ── Cálculos ─────────────────────────────────────────
  const itensCusto = itens.map(item => {
    const totalFestas = item.meses * item.festasporMes
    const custoPorFesta = totalFestas > 0 ? item.custo / totalFestas : 0
    return { ...item, totalFestas, custoPorFesta }
  })

  const custoVidaPorFesta = festasKitMes > 0 ? custoVida / festasKitMes : 0
  const custoPorFestaTotal = itensCusto.reduce((acc, i) => acc + i.custoPorFesta, 0)
  const subtotal = custoPorFestaTotal + custoVidaPorFesta + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoFinal = subtotal + valorLucro

  // ── Cálculos do preço alvo ────────────────────────────
  // Margem implícita para atingir o preço alvo
  const margemParaAlvo = precoAlvo > 0 && subtotal > 0
    ? Math.round(((precoAlvo - subtotal) / subtotal) * 100)
    : null

  // Festas/mês necessárias para cobrir custo de vida com o preço alvo
  // precoAlvo = (custoItens + custoVida/festasNec + frete) * (1 + lucro/100)
  // festasNec = custoVida / (precoAlvo/(1+lucro/100) - custoItens - frete)
  const festasNecessarias = precoAlvo > 0 && custoVida > 0
    ? (() => {
        const subtotalSemVida = custoPorFestaTotal + frete
        const precoSemLucro = precoAlvo / (1 + lucro / 100)
        const sobra = precoSemLucro - subtotalSemVida
        return sobra > 0 ? Math.ceil(custoVida / sobra) : null
      })()
    : null

  // Receita mensal estimada com o preço atual
  const receitaMensalEstimada = precoFinal * festasKitMes
  const cobriuCustoVida = custoVida > 0 ? receitaMensalEstimada >= custoVida : null

  const temAcervo = acervo.length > 0

  return (
    <div>

      {/* ── Barra de ações ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          {editandoId && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 700, background: '#fff0fb', padding: '5px 12px', borderRadius: '999px', border: '1px solid #ffd6f5' }}>
              {nomeKit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {editandoId && (
            <button onClick={novaCalculadora} style={btnGhost}>
              <IconNew /> Novo
            </button>
          )}
          <button onClick={() => { setModalKits(true); carregarKits() }} style={btnGhost}>
            <IconFolder /> Kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button onClick={() => setModalSalvar(true)} style={btnPrimario}>
            <IconSave /> {editandoId ? 'Salvar' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* ── Itens do kit ── */}
      <div style={cardStyle}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: '0 0 4px' }}>Itens do kit</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>Cada item tem seu próprio período de uso e número de festas</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>

          {/* Cabeçalho desktop */}
          <div className="calc-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 110px 90px 90px 36px', gap: '8px', alignItems: 'end' }}>
            <span style={labelStyle}>Item {temAcervo && <span style={{ color: '#ff33cc', fontWeight: 400 }}>· selecione do acervo ou digite</span>}</span>
            <span style={labelStyle}>Custo (R$)</span>
            <span style={labelStyle}>Meses</span>
            <span style={labelStyle}>Festas/mês</span>
            <div />
          </div>

          {itens.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

              {/* Desktop */}
              <div className="calc-item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 110px 90px 90px 36px', gap: '8px', alignItems: 'center' }}>
                {/* Input unificado: select do acervo + texto editável */}
                {temAcervo ? (
                  <div style={{ display: 'flex', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
                    <select
                      value={item.acervoId ?? ''}
                      onChange={e => preencherDoAcervo(item.id, e.target.value)}
                      style={{ border: 'none', borderRight: '1px solid #e8e8ec', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', flexShrink: 0, maxWidth: '130px' }}
                    >
                      <option value="">Acervo...</option>
                      {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                    <input
                      type="text"
                      value={item.nome}
                      onChange={e => atualizarItem(item.id, 'nome', e.target.value)}
                      placeholder="ou digite o nome..."
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', outline: 'none', minWidth: 0 }}
                    />
                  </div>
                ) : (
                  <input type="text" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="Ex: Painel, Totem..." style={inputStyle} />
                )}
                <input type="number" value={item.custo || ''} onChange={e => atualizarItem(item.id, 'custo', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                <input type="number" value={item.meses || ''} onChange={e => atualizarItem(item.id, 'meses', e.target.value)} placeholder="6" min="1" style={inputStyle} />
                <input type="number" value={item.festasporMes || ''} onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)} placeholder="4" min="1" style={inputStyle} />
                <button onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ width: 36, height: 36, borderRadius: '999px', border: `1px solid ${itens.length === 1 ? '#e8e8ec' : '#fecdd3'}`, background: itens.length === 1 ? '#f9fafb' : '#fff5f5', color: itens.length === 1 ? '#d1d5db' : '#ef4444', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconTrash />
                </button>
              </div>

              {/* Mobile */}
              <div className="calc-item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#f9fafb', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...labelStyle, margin: 0 }}>Item</span>
                  <button onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ background: itens.length === 1 ? 'transparent' : '#fff5f5', border: `1px solid ${itens.length === 1 ? 'transparent' : '#fecdd3'}`, borderRadius: '999px', padding: '4px 10px', color: itens.length === 1 ? '#d1d5db' : '#ef4444', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600 }}>
                    <IconTrash /> Remover
                  </button>
                </div>
                {temAcervo ? (
                  <div>
                    <span style={labelStyle}>Item</span>
                    <div style={{ display: 'flex', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      <select
                        value={item.acervoId ?? ''}
                        onChange={e => preencherDoAcervo(item.id, e.target.value)}
                        style={{ border: 'none', borderRight: '1px solid #e8e8ec', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', maxWidth: '120px', flexShrink: 0 }}
                      >
                        <option value="">Acervo...</option>
                        {acervo.map(a => <option key={a.id} value={a.id}>{a.nome} — R$ {Number(a.custo).toFixed(2).replace('.', ',')}</option>)}
                      </select>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={e => atualizarItem(item.id, 'nome', e.target.value)}
                        placeholder="ou digite..."
                        style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 12px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', outline: 'none', minWidth: 0 }}
                      />
                    </div>
                  </div>
                ) : (
                  <input type="text" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="Ex: Painel, Totem..." style={inputStyle} />
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={labelStyle}>Custo (R$)</span>
                    <input type="number" value={item.custo || ''} onChange={e => atualizarItem(item.id, 'custo', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                  </div>
                  <div>
                    <span style={labelStyle}>Meses</span>
                    <input type="number" value={item.meses || ''} onChange={e => atualizarItem(item.id, 'meses', e.target.value)} placeholder="6" min="1" style={inputStyle} />
                  </div>
                  <div>
                    <span style={labelStyle}>Festas/mês</span>
                    <input type="number" value={item.festasporMes || ''} onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)} placeholder="4" min="1" style={inputStyle} />
                  </div>
                </div>
              </div>

              {item.custo > 0 && (
                <div style={{ display: 'flex', gap: '14px', paddingLeft: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                    {item.meses * item.festasporMes} festas
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 700 }}>
                    R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} por festa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={adicionarItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ffc0ef', borderRadius: '999px', padding: '10px 18px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <IconPlus /> Adicionar item
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Custo total por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827' }}>
            R$ {custoPorFestaTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* ── Custos adicionais ── */}
      <div style={cardStyle}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: '0 0 4px' }}>Custos adicionais</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>Outros custos que entram no preço final por festa</p>

        <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Custo de vida mensal (R$)</label>
            <input type="number" value={custoVida || ''} onChange={e => setCustoVida(parseFloat(e.target.value) || 0)} placeholder="Ex: 3000,00" min="0" step="0.01" style={inputStyle} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '4px 0 0' }}>Dividido pelas festas/mês deste kit</p>
          </div>
          <div>
            <label style={labelStyle}>Festas/mês deste kit</label>
            <input type="number" value={festasKitMes || ''} onChange={e => setFestasKitMes(parseFloat(e.target.value) || 1)} placeholder="4" min="1" style={inputStyle} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: custoVida > 0 ? '#ff33cc' : '#9ca3af', margin: '4px 0 0', fontWeight: custoVida > 0 ? 700 : 400 }}>
              {custoVida > 0 ? `R$ ${custoVidaPorFesta.toFixed(2).replace('.', ',')} por festa` : 'Quantos deste kit por mês?'}
            </p>
          </div>
          <div>
            <label style={labelStyle}>Frete por festa (R$)</label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="Ex: 50,00" min="0" step="0.01" style={inputStyle} />
          </div>
        </div>

        {/* Campo preço alvo */}
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Preço alvo (R$)</label>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '2px 0 0' }}>Quanto você quer cobrar?</p>
          </div>
          <input
            type="number" value={precoAlvo || ''} onChange={e => setPrecoAlvo(parseFloat(e.target.value) || 0)}
            placeholder="Ex: 90,00" min="0" step="0.01"
            style={{ ...inputStyle, width: '120px', flexShrink: 0 }}
          />
          {precoAlvo > 0 && subtotal > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {margemParaAlvo !== null && (
                <span style={{ background: margemParaAlvo >= 100 ? '#f0fdf9' : '#fffbf0', color: margemParaAlvo >= 100 ? '#059669' : '#d97706', borderRadius: '999px', padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}>
                  {margemParaAlvo >= 0 ? `${margemParaAlvo}% de lucro` : `abaixo do custo`}
                </span>
              )}
              {festasNecessarias !== null && (
                <span style={{ background: festasNecessarias <= festasKitMes ? '#f0fdf9' : '#fef2f2', color: festasNecessarias <= festasKitMes ? '#059669' : '#dc2626', borderRadius: '999px', padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}>
                  {festasNecessarias}x/mês para cobrir vida
                </span>
              )}
              {precoAlvo < subtotal && (
                <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '999px', padding: '4px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700 }}>
                  Abaixo do custo — mínimo R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Slider de lucro */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Lucro desejado</label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#ff33cc', letterSpacing: '-0.5px' }}>{lucro}%</span>
              {lucro < 100
                ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>abaixo do recomendado</span>
                : <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#10b981', fontWeight: 600 }}>dentro do recomendado</span>
              }
            </div>
          </div>
          <input
            type="range" min={0} max={300} value={lucro}
            onChange={e => setLucro(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ff33cc', height: '4px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>0%</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af' }}>Recomendado: 100–150%</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>300%</span>
          </div>
        </div>
      </div>

      {/* ── Resultado ── */}
      <div style={{ background: 'linear-gradient(135deg, #140033, #1a0044)', border: '1px solid #ffffff12', borderRadius: '16px', padding: '24px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ffffff55', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 18px' }}>Resultado</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Custo dos itens por festa', valor: custoPorFestaTotal },
            { label: `Custo de vida por festa (${festasKitMes}x/mês)`, valor: custoVidaPorFesta },
            { label: 'Frete', valor: frete },
            { label: `Lucro (${lucro}%)`, valor: valorLucro },
          ].map(linha => (
            <div key={linha.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>{linha.label}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>
                R$ {linha.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #ffffff18', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff' }}>Preço por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#ff33cc', letterSpacing: '-1px' }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Indicadores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #ffffff10', paddingTop: '14px' }}>

          {/* Receita mensal estimada vs custo de vida */}
          {custoVida > 0 && (
            <div style={{ background: cobriuCustoVida ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff66', margin: 0 }}>
                Receita mensal com {festasKitMes} festa(s) deste kit
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: cobriuCustoVida ? '#10b981' : '#ef4444' }}>
                  R$ {receitaMensalEstimada.toFixed(2).replace('.', ',')}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff33' }}>
                  {cobriuCustoVida ? '✓ cobre o custo de vida' : `faltam R$ ${(custoVida - receitaMensalEstimada).toFixed(2).replace('.', ',')} para cobrir vida`}
                </span>
              </div>
            </div>
          )}

          {/* Comparação com preço alvo */}
          {precoAlvo > 0 && (
            <div style={{ background: precoFinal >= precoAlvo ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff66', margin: 0 }}>
                Preço alvo: R$ {precoAlvo.toFixed(2).replace('.', ',')}
              </p>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: precoFinal >= precoAlvo ? '#10b981' : '#f59e0b' }}>
                {precoFinal >= precoAlvo
                  ? `✓ R$ ${(precoFinal - precoAlvo).toFixed(2).replace('.', ',')} acima`
                  : `R$ ${(precoAlvo - precoFinal).toFixed(2).replace('.', ',')} abaixo`
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ════ MODAL SALVAR ════ */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalSalvar(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#111827', margin: '0 0 6px' }}>
              {editandoId ? 'Salvar alterações' : 'Salvar kit'}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>
              {editandoId ? 'Atualize o nome se quiser' : 'Dê um nome para identificar este kit'}
            </p>
            <input
              type="text" value={nomeKit} onChange={e => setNomeKit(e.target.value)}
              placeholder="Ex: Kit Dinossauro..." autoFocus
              onKeyDown={e => e.key === 'Enter' && salvarKit()}
              style={{ ...inputStyle, fontSize: '15px', padding: '12px 14px', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={salvarKit} disabled={!nomeKit.trim() || salvando} style={{ flex: 2, ...btnPrimario, padding: '12px', borderRadius: '999px', opacity: !nomeKit.trim() ? 0.4 : 1, cursor: !nomeKit.trim() ? 'not-allowed' : 'pointer' }}>
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL KITS SALVOS ════ */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setModalKits(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

            {/* Header sticky */}
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>Kits salvos</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>{kits.length} kit{kits.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setModalKits(false)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <IconX />
              </button>
            </div>

            <div style={{ padding: '16px 20px 32px' }}>
              {carregandoKits ? (
                <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#9ca3af', fontSize: '13px', padding: '32px 0' }}>Carregando...</p>
              ) : kits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum kit salvo</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Salve um kit para ele aparecer aqui</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {kits.map(kit => (
                    <div key={kit.id}>
                      {/* Card do kit */}
                      <div
                        onClick={() => setKitDetalhe(kitDetalhe?.id === kit.id ? null : kit)}
                        style={{ background: editandoId === kit.id ? '#fff0fb' : '#fafafa', border: `1.5px solid ${editandoId === kit.id ? '#ff33cc' : kitDetalhe?.id === kit.id ? '#ffd6f5' : '#e8e8ec'}`, borderRadius: kitDetalhe?.id === kit.id ? '12px 12px 0 0' : '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>{kit.nome}</p>
                            {editandoId === kit.id && (
                              <span style={{ background: '#ff33cc', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700 }}>editando</span>
                            )}
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                            {kit.itens.length} item(ns) · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                          {kitDetalhe?.id === kit.id ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Painel expandido */}
                      {kitDetalhe?.id === kit.id && (
                        <div style={{ background: '#fff', border: '1.5px solid #ffd6f5', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Itens do kit */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {kit.itens.filter(i => i.nome).map((i, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                                <span style={{ color: '#374151' }}>{i.nome}</span>
                                <span style={{ color: '#9ca3af' }}>R$ {Number(i.custo).toFixed(2).replace('.', ',')} · {i.meses}m · {i.festasporMes}x/mês</span>
                              </div>
                            ))}
                          </div>
                          {/* Ações */}
                          <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                            <button onClick={() => carregarKit(kit)} style={btnPrimario}>
                              <IconEdit /> Carregar
                            </button>
                            {exportadoId === kit.id ? (
                              <span style={{ ...btnSec, borderColor: '#10b981', color: '#059669' }}>
                                <IconCheck /> Enviado ao catálogo!
                              </span>
                            ) : (
                              <button onClick={() => exportarParaCatalogo(kit)} disabled={exportando} style={{ ...btnSec, opacity: exportando ? 0.6 : 1 }}>
                                <IconExport /> Enviar ao catálogo
                              </button>
                            )}
                            <button onClick={() => deletarKit(kit.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'transparent', border: '1px solid #fecdd3', color: '#ef4444', borderRadius: '999px', padding: '7px 12px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                              <IconTrash /> Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .calc-header-desktop { display: none !important; }
          .calc-item-desktop { display: none !important; }
          .calc-item-mobile { display: flex !important; }
          .form-grid-3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .form-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}