'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

interface ItemPermanente {
  id: number
  nome: string
  custo: number
  meses: number
  festasporMes: number
  acervoId?: string
}

interface ItemConsumivel {
  id: number
  nome: string
  custo: number
  festasQueRende: number
  acervoId?: string
}

interface Kit {
  id: string
  nome: string
  permanentes: ItemPermanente[]
  consumiveis: ItemConsumivel[]
  lucro: number
  frete: number
  custo_vida: number
  festas_kit_mes: number
  criado_em: string
  // legado
  itens?: ItemPermanente[]
}

interface Props {
  acervo: ItemAcervo[]
}

export default function Calculadora({ acervo }: Props) {
  const [permanentes, setPermanentes] = useState<ItemPermanente[]>([
    { id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 },
  ])
  const [consumiveis, setConsumiveis] = useState<ItemConsumivel[]>([
    { id: 1, nome: '', custo: 0, festasQueRende: 1 },
  ])
  const [lucro, setLucro] = useState(100)
  const [frete, setFrete] = useState(0)
  const [custoVida, setCustoVida] = useState(0)
  const [festasKitMes, setFestasKitMes] = useState(15)
  const [precoAlvo, setPrecoAlvo] = useState(0)

  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
  const [nomeKit, setNomeKit] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoKits, setCarregandoKits] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [exportadoId, setExportadoId] = useState<string | null>(null)

  const supabase = createClient()

  async function carregarKits() {
    setCarregandoKits(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('kits').select('*').eq('usuario_id', user.id)
      .order('criado_em', { ascending: false })
    if (data) setKits(data)
    setCarregandoKits(false)
  }

  useEffect(() => { void carregarKits() }, []) // eslint-disable-line

  async function salvarKit() {
    if (!nomeKit.trim()) return
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { permanentes, consumiveis, lucro, frete, custo_vida: custoVida, festas_kit_mes: festasKitMes, nome: nomeKit }
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
    setPermanentes(kit.permanentes ?? kit.itens ?? [{ id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 }])
    setConsumiveis(kit.consumiveis ?? [{ id: 1, nome: '', custo: 0, festasQueRende: 1 }])
    setLucro(kit.lucro)
    setFrete(kit.frete)
    setCustoVida(kit.custo_vida ?? 0)
    setFestasKitMes(kit.festas_kit_mes ?? 15)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    setKits(prev => prev.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
  }

  async function exportarParaCatalogo(kit: Kit) {
    setExportando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const custoPerm = (kit.permanentes ?? kit.itens ?? []).reduce((acc, item) => {
      const total = item.meses * item.festasporMes
      return acc + (total > 0 ? item.custo / total : 0)
    }, 0)
    const custoConsumivel = (kit.consumiveis ?? []).reduce((acc, item) => {
      return acc + (item.festasQueRende > 0 ? item.custo / item.festasQueRende : 0)
    }, 0)
    const subtotal = custoPerm + custoConsumivel + (kit.frete ?? 0)
    const preco = subtotal * (1 + kit.lucro / 100)
    await supabase.from('catalogo_kits').insert({
      usuario_id: user.id, nome: kit.nome,
      descricao: `Kit exportado da calculadora`,
      preco: Math.ceil(preco / 5) * 5,
      itens: [...(kit.permanentes ?? kit.itens ?? []), ...(kit.consumiveis ?? [])].map(i => i.nome).filter(Boolean),
      foto_url: null,
    })
    setExportadoId(kit.id)
    setTimeout(() => setExportadoId(null), 3000)
    setExportando(false)
  }

  function novaCalculadora() {
    setPermanentes([{ id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 }])
    setConsumiveis([{ id: 1, nome: '', custo: 0, festasQueRende: 1 }])
    setLucro(100); setFrete(0); setCustoVida(0); setFestasKitMes(15); setPrecoAlvo(0)
    setEditandoId(null); setNomeKit('')
  }

  function preencherDoAcervo(tipo: 'perm' | 'cons', itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    if (tipo === 'perm') {
      setPermanentes(prev => prev.map(i => i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i))
    } else {
      setConsumiveis(prev => prev.map(i => i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i))
    }
  }

  const temAcervo = acervo.length > 0

  // ── CÁLCULOS ─────────────────────────────────────────
  // Permanentes: custo ÷ (meses × festas/mês)
  const custoPermanentes = permanentes.reduce((acc, item) => {
    const total = item.meses * item.festasporMes
    return acc + (total > 0 ? item.custo / total : 0)
  }, 0)

  // Consumíveis: custo ÷ festas que rende
  const custoConsumiveis = consumiveis.reduce((acc, item) => {
    return acc + (item.festasQueRende > 0 ? item.custo / item.festasQueRende : 0)
  }, 0)

  const subtotal = custoPermanentes + custoConsumiveis + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoFinal = subtotal + valorLucro

  // Informativo
  const receitaMensalEstimada = precoFinal * festasKitMes
  const percentualVidaCoberto = custoVida > 0 ? Math.min(Math.round((receitaMensalEstimada / custoVida) * 100), 100) : null
  const festasParaCobrir = custoVida > 0 && precoFinal > 0 ? Math.ceil(custoVida / precoFinal) : null
  const margemParaAlvo = precoAlvo > 0 && subtotal > 0 ? Math.round(((precoAlvo - subtotal) / subtotal) * 100) : null

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
  const secaoHeader = (titulo: string, subtitulo: string, cor: string) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cor, flexShrink: 0 }} />
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>{titulo}</h2>
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 0 18px' }}>{subtitulo}</p>
    </div>
  )

  return (
    <div>

      {/* Barra de ações */}
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

      {/* ── SEÇÃO 1: PERMANENTES ── */}
      <div style={cardStyle}>
        {secaoHeader('Itens permanentes', 'Painel, mesa, capa, jarro, boleira... — custo dividido pelas festas do período', '#7c3aed')}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
          <div className="calc-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 36px', gap: '8px', alignItems: 'end' }}>
            <span style={labelStyle}>Item {temAcervo && <span style={{ color: '#ff33cc', fontWeight: 400 }}>· ou selecione do acervo</span>}</span>
            <span style={labelStyle}>Custo (R$)</span>
            <span style={labelStyle}>Dura (meses)</span>
            <span style={labelStyle}>Festas/mês</span>
            <div />
          </div>

          {permanentes.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="calc-item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 36px', gap: '8px', alignItems: 'center' }}>
                {temAcervo ? (
                  <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                    <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo('perm', item.id, e.target.value)}
                      style={{ border: 'none', borderRight: '1px solid #e5e5e5', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', maxWidth: '110px', flexShrink: 0 }}>
                      <option value="">Acervo...</option>
                      {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                    <input type="text" value={item.nome} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="ou digite o nome..."
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', outline: 'none', minWidth: 0 }} />
                  </div>
                ) : (
                  <input type="text" value={item.nome} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Painel, Mesa, Capa..." style={inputStyle} />
                )}
                <input type="number" value={item.custo || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                <input type="number" value={item.meses || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, meses: parseFloat(e.target.value) || 1 } : i))} placeholder="12" min="1" style={inputStyle} />
                <input type="number" value={item.festasporMes || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, festasporMes: parseFloat(e.target.value) || 1 } : i))} placeholder="15" min="1" style={inputStyle} />
                <button onClick={() => setPermanentes(p => p.filter(i => i.id !== item.id))} disabled={permanentes.length === 1}
                  style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${permanentes.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: permanentes.length === 1 ? '#f9f9f9' : '#fff5fd', color: permanentes.length === 1 ? '#00000022' : '#ff33cc', cursor: permanentes.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Mobile */}
              <div className="calc-item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#f9f9f9', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={labelStyle}>Item permanente</span>
                  <button onClick={() => setPermanentes(p => p.filter(i => i.id !== item.id))} disabled={permanentes.length === 1} style={{ background: 'transparent', border: 'none', color: permanentes.length === 1 ? '#00000022' : '#ff33cc', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
                <input type="text" value={item.nome} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Painel, Mesa..." style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div><span style={labelStyle}>Custo</span><input type="number" value={item.custo || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0" style={inputStyle} /></div>
                  <div><span style={labelStyle}>Meses</span><input type="number" value={item.meses || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, meses: parseFloat(e.target.value) || 1 } : i))} placeholder="12" style={inputStyle} /></div>
                  <div><span style={labelStyle}>Festas/mês</span><input type="number" value={item.festasporMes || ''} onChange={e => setPermanentes(p => p.map(i => i.id === item.id ? { ...i, festasporMes: parseFloat(e.target.value) || 1 } : i))} placeholder="15" style={inputStyle} /></div>
                </div>
              </div>

              {item.custo > 0 && item.meses > 0 && item.festasporMes > 0 && (
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044' }}>{item.meses * item.festasporMes} festas no total</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
                    R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} por festa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setPermanentes(p => [...p, { id: Date.now(), nome: '', custo: 0, meses: 12, festasporMes: 15 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #7c3aed55', borderRadius: '999px', padding: '10px 16px', color: '#7c3aed', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Adicionar item permanente
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo permanentes por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#7c3aed' }}>R$ {custoPermanentes.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── SEÇÃO 2: CONSUMÍVEIS ── */}
      <div style={cardStyle}>
        {secaoHeader('Itens consumíveis', 'Bolas, spray, tinta, fita, adesivos... — custo dividido pelas festas que cada item rende', '#ff33cc')}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
          <div className="calc-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 130px 36px', gap: '8px', alignItems: 'end' }}>
            <span style={labelStyle}>Item consumível</span>
            <span style={labelStyle}>Custo (R$)</span>
            <span style={labelStyle}>Rende X festas</span>
            <div />
          </div>

          {consumiveis.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="calc-item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 130px 36px', gap: '8px', alignItems: 'center' }}>
                {temAcervo ? (
                  <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                    <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo('cons', item.id, e.target.value)}
                      style={{ border: 'none', borderRight: '1px solid #e5e5e5', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', maxWidth: '110px', flexShrink: 0 }}>
                      <option value="">Acervo...</option>
                      {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                    <input type="text" value={item.nome} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="ou digite o nome..."
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', outline: 'none', minWidth: 0 }} />
                  </div>
                ) : (
                  <input type="text" value={item.nome} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Saco de bolas, Spray..." style={inputStyle} />
                )}
                <input type="number" value={item.custo || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                <input type="number" value={item.festasQueRende || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, festasQueRende: parseFloat(e.target.value) || 1 } : i))} placeholder="1" min="1" style={inputStyle} />
                <button onClick={() => setConsumiveis(p => p.filter(i => i.id !== item.id))} disabled={consumiveis.length === 1}
                  style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${consumiveis.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: consumiveis.length === 1 ? '#f9f9f9' : '#fff5fd', color: consumiveis.length === 1 ? '#00000022' : '#ff33cc', cursor: consumiveis.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Mobile consumível */}
              <div className="calc-item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#fff5fd', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={labelStyle}>Item consumível</span>
                  <button onClick={() => setConsumiveis(p => p.filter(i => i.id !== item.id))} disabled={consumiveis.length === 1} style={{ background: 'transparent', border: 'none', color: consumiveis.length === 1 ? '#00000022' : '#ff33cc', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
                <input type="text" value={item.nome} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Saco de bolas, Spray..." style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={labelStyle}>Custo (R$)</span><input type="number" value={item.custo || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0" style={inputStyle} /></div>
                  <div><span style={labelStyle}>Rende X festas</span><input type="number" value={item.festasQueRende || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, festasQueRende: parseFloat(e.target.value) || 1 } : i))} placeholder="1" style={inputStyle} /></div>
                </div>
              </div>

              {item.custo > 0 && item.festasQueRende > 0 && (
                <div style={{ paddingLeft: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 600 }}>
                    R$ {(item.custo / item.festasQueRende).toFixed(2).replace('.', ',')} por festa
                  </span>
                  {item.festasQueRende > 1 && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', marginLeft: '12px' }}>
                      rende {item.festasQueRende} festas
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => setConsumiveis(p => [...p, { id: Date.now(), nome: '', custo: 0, festasQueRende: 1 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ff33cc55', borderRadius: '999px', padding: '10px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Adicionar item consumível
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo consumíveis por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#ff33cc' }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── SEÇÃO 3: CUSTOS FINAIS ── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Precificação</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 20px 0' }}>Frete e lucro entram no preço final</p>

        <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Frete por festa (R$)</label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Preço alvo (R$)</label>
            <input type="number" value={precoAlvo || ''} onChange={e => setPrecoAlvo(parseFloat(e.target.value) || 0)} placeholder="Ex: 90,00" min="0" step="0.01" style={inputStyle} />
            {margemParaAlvo !== null && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', margin: '4px 0 0', fontWeight: 600, color: margemParaAlvo < 0 ? '#cc0000' : '#10b981' }}>
                {margemParaAlvo < 0 ? '❌ Abaixo do custo mínimo' : `→ Requer ${margemParaAlvo}% de lucro`}
              </p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Margem de lucro</label>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#ff33cc', letterSpacing: '-0.5px', lineHeight: 1 }}>{lucro}%</span>
          </div>
          <input type="range" min={0} max={500} value={lucro} onChange={e => setLucro(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ff33cc', height: '4px', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>0%</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: lucro < 100 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
              {lucro < 100 ? '⚠️ Recomendado: 100–300%' : '✅ Boa margem'}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>500%</span>
          </div>
        </div>

        {/* Análise de custo de vida */}
        <div style={{ background: '#f9f9f9', border: '1px solid #eeeeee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#140033', margin: 0 }}>Análise de rendimento mensal</p>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#fff', background: '#ff33cc88', borderRadius: '999px', padding: '2px 8px', fontWeight: 600 }}>só informativo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: custoVida > 0 ? '14px' : 0 }}>
            <div>
              <label style={labelStyle}>Meta de salário mensal (R$)</label>
              <input type="number" value={custoVida || ''} onChange={e => setCustoVida(parseFloat(e.target.value) || 0)} placeholder="Ex: 2000,00" min="0" step="0.01" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Festas deste kit por mês</label>
              <input type="number" value={festasKitMes || ''} onChange={e => setFestasKitMes(parseFloat(e.target.value) || 1)} placeholder="15" min="1" style={inputStyle} />
            </div>
          </div>
          {custoVida > 0 && precoFinal > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000066' }}>
                  {festasKitMes} festa(s) × R$ {precoFinal.toFixed(2).replace('.', ',')} = <strong>R$ {receitaMensalEstimada.toFixed(2).replace('.', ',')}</strong> / mês
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: (percentualVidaCoberto ?? 0) >= 100 ? '#10b981' : '#f59e0b' }}>
                  {percentualVidaCoberto}%
                </span>
              </div>
              <div style={{ height: '6px', background: '#e5e5e5', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${percentualVidaCoberto}%`, background: (percentualVidaCoberto ?? 0) >= 100 ? '#10b981' : '#ff33cc', borderRadius: '999px', transition: 'width .3s' }} />
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000055', margin: 0 }}>
                {(percentualVidaCoberto ?? 0) >= 100
                  ? `✅ Atinge a meta com ${festasKitMes} festas/mês`
                  : `Precisa de ${festasParaCobrir} festas/mês para atingir R$ ${custoVida.toLocaleString('pt-BR')}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── RESULTADO ── */}
      <div style={{ background: '#140033', border: '1px solid #ffffff12', borderRadius: '16px', padding: '28px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ffffff55', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Resultado</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>Permanentes por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#c4b5fd', fontWeight: 600 }}>R$ {custoPermanentes.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>Consumíveis por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#f9a8d4', fontWeight: 600 }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
          </div>
          {frete > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>Frete</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {frete.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ffffff15' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>Custo total por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 700 }}>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>Lucro ({lucro}%)</span>
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
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #ffffff10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44' }}>
              Preço alvo: R$ {precoAlvo.toFixed(2).replace('.', ',')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: precoFinal >= precoAlvo ? '#10b981' : '#f59e0b' }}>
              {precoFinal >= precoAlvo ? `✓ R$ ${(precoFinal - precoAlvo).toFixed(2).replace('.', ',')} acima` : `R$ ${(precoAlvo - precoFinal).toFixed(2).replace('.', ',')} abaixo`}
            </span>
          </div>
        )}
      </div>

      {/* Modal Salvar */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalSalvar(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px 0' }}>
              {editandoId ? 'Salvar alterações' : 'Salvar kit'}
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 24px 0' }}>
              Dê um nome para identificar este kit
            </p>
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

      {/* Modal Kits */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalKits(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px #00000033', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: 0 }}>Kits salvos</h3>
              <button onClick={() => setModalKits(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#00000066', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
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
                  <div key={kit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: editandoId === kit.id ? '#fff0fb' : '#f9f9f9', border: `1px solid ${editandoId === kit.id ? '#ff33cc44' : '#eeeeee'}`, borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px' }}>
                        {kit.nome}
                        {editandoId === kit.id && <span style={{ color: '#ff33cc', fontSize: '11px', marginLeft: '8px' }}>● editando</span>}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                        {(kit.permanentes ?? kit.itens ?? []).length} perm. · {(kit.consumiveis ?? []).length} cons. · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => carregarKit(kit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                        <Pencil size={12} /> Carregar
                      </button>
                      {exportadoId === kit.id ? (
                        <span style={{ display: 'flex', alignItems: 'center', background: '#f0fff4', border: '1px solid #00aa5533', borderRadius: '999px', padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#00aa55' }}>✓ Enviado!</span>
                      ) : (
                        <button onClick={() => exportarParaCatalogo(kit)} disabled={exportando} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1.5px solid #ff33cc', borderRadius: '999px', padding: '8px 10px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: exportando ? 0.6 : 1 }}>
                          ↑ Catálogo
                        </button>
                      )}
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
      )}

      <style>{`
        @media (max-width: 768px) {
          .calc-header-desktop { display: none !important; }
          .calc-item-desktop { display: none !important; }
          .calc-item-mobile { display: flex !important; }
          .form-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}