'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

interface Item {
  id: number
  nome: string
  custo: number
  meses: number
  festasporMes: number
  acervoId?: string
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

interface Props {
  acervo: ItemAcervo[]
}

export default function Calculadora({ acervo }: Props) {
  const [itens, setItens] = useState<Item[]>([
    { id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 },
  ])
  const [lucro, setLucro] = useState(30)
  const [frete, setFrete] = useState(0)
  const [custoVida, setCustoVida] = useState(0)
  const [festasKitMes, setFestasKitMes] = useState(4)
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
    setCustoVida(kit.custo_vida ?? 0)
    setFestasKitMes(kit.festas_kit_mes ?? 4)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    const { error } = await supabase.from('kits').delete().eq('id', id)
    if (error) { alert('Erro: ' + error.message); return }
    setKits(prev => prev.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
  }

  async function exportarParaCatalogo(kit: Kit) {
    setExportando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const itensCustoCalc = kit.itens.map(item => {
      const totalFestas = item.meses * item.festasporMes
      return totalFestas > 0 ? item.custo / totalFestas : 0
    })
    const custoPorFesta = itensCustoCalc.reduce((s, c) => s + c, 0)
    const subtotal = custoPorFesta + (kit.frete ?? 0)
    const preco = subtotal * (1 + kit.lucro / 100)
    // Arredonda para o múltiplo de 5 acima (ex: 87 → 90, 91 → 95)
    const precoArredondado = Math.ceil(preco / 5) * 5
    await supabase.from('catalogo_kits').insert({
      usuario_id: user.id, nome: kit.nome,
      descricao: `Kit com ${kit.itens.length} item(ns) — exportado da calculadora`,
      preco: precoArredondado,
      itens: kit.itens.map(i => i.nome).filter(Boolean),
      foto_url: null,
    })
    setExportadoId(kit.id)
    setTimeout(() => setExportadoId(null), 3000)
    setExportando(false)
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 }])
    setLucro(30); setFrete(0); setCustoVida(0); setFestasKitMes(4); setPrecoAlvo(0)
    setEditandoId(null); setNomeKit('')
  }

  function adicionarItem() {
    setItens(prev => [...prev, { id: Date.now(), nome: '', custo: 0, meses: 6, festasporMes: 4 }])
  }
  function removerItem(id: number) { setItens(prev => prev.filter(i => i.id !== id)) }
  function atualizarItem(id: number, campo: keyof Item, valor: string) {
    setItens(prev => prev.map(i =>
      i.id === id ? { ...i, [campo]: campo === 'nome' ? valor : parseFloat(valor) || 0 } : i
    ))
  }

  function preencherDoAcervo(itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    setItens(prev => prev.map(i =>
      i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i
    ))
  }

  const temAcervo = acervo.length > 0

  // ── Cálculos — idêntico ao original ──────────────────
  const itensCusto = itens.map(item => {
    const totalFestas = item.meses * item.festasporMes
    const custoPorFesta = totalFestas > 0 ? item.custo / totalFestas : 0
    return { ...item, totalFestas, custoPorFesta }
  })
  const totalFestasGeral = itensCusto.reduce((acc, i) => acc + i.totalFestas, 0) / (itens.length || 1)
  const custoPorFestaTotal = itensCusto.reduce((acc, i) => acc + i.custoPorFesta, 0)
  // ⚠️ custo de vida NÃO entra no subtotal — só visual
  const subtotal = custoPorFestaTotal + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoFinal = subtotal + valorLucro

  // ── Custo de vida — apenas informativo ───────────────
  const custoVidaPorFesta = totalFestasGeral > 0 ? custoVida / totalFestasGeral : 0
  const receitaMensalEstimada = precoFinal * festasKitMes
  const percentualVidaCoberto = custoVida > 0
    ? Math.min(Math.round((receitaMensalEstimada / custoVida) * 100), 100)
    : null
  const festasParaCobrir = custoVida > 0 && precoFinal > 0
    ? Math.ceil(custoVida / precoFinal)
    : null

  // ── Preço alvo — análise inversa ─────────────────────
  const margemParaAlvo = precoAlvo > 0 && subtotal > 0
    ? Math.round(((precoAlvo - subtotal) / subtotal) * 100)
    : null

  const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '10px', padding: '10px 12px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  }
  const cardStyle = {
    background: '#fff', border: '1px solid #eeeeee',
    borderRadius: '16px', padding: '24px', marginBottom: '20px',
  }

  return (
    <div>

      {/* Barra de ações */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {editandoId && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9900ff', fontWeight: 600, background: '#f5f0ff', padding: '6px 12px', borderRadius: '100px', border: '1px solid #9900ff22' }}>
              ✏️ {nomeKit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {editandoId && (
            <button onClick={novaCalculadora} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '10px 14px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              <X size={14} /> Novo
            </button>
          )}
          <button onClick={() => { setModalKits(true); void carregarKits() }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '10px 14px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <FolderOpen size={14} /> Kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button onClick={() => setModalSalvar(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <Save size={14} /> {editandoId ? 'Salvar' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* Itens do kit */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>🎪 Itens do kit</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>Cada item tem seu próprio período de uso e número de festas</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          <div className="calc-header-desktop" style={{ display: 'grid', gridTemplateColumns: temAcervo ? '160px 2fr 120px 100px 100px 36px' : '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'end' }}>
            {temAcervo && <span style={labelStyle}>Acervo</span>}
            <span style={labelStyle}>Item</span>
            <span style={labelStyle}>Custo (R$)</span>
            <span style={labelStyle}>Meses</span>
            <span style={labelStyle}>Festas/mês</span>
            <div />
          </div>

          {itens.map((item) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Desktop */}
              <div className="calc-item-desktop" style={{ display: 'grid', gridTemplateColumns: temAcervo ? '160px 2fr 120px 100px 100px 36px' : '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'center' }}>
                {temAcervo && (
                  <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                    <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo(item.id, e.target.value)}
                      style={{ border: 'none', borderRight: '1px solid #e5e5e5', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', maxWidth: '110px', flexShrink: 0 }}>
                      <option value="">Acervo...</option>
                      {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                    <input type="text" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="ou digite..."
                      style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', outline: 'none', minWidth: 0 }} />
                  </div>
                )}
                {!temAcervo && (
                  <input type="text" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="Ex: Painel, Totem..." style={inputStyle} />
                )}
                <input type="number" value={item.custo || ''} onChange={e => atualizarItem(item.id, 'custo', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                <input type="number" value={item.meses || ''} onChange={e => atualizarItem(item.id, 'meses', e.target.value)} placeholder="6" min="1" style={inputStyle} />
                <input type="number" value={item.festasporMes || ''} onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)} placeholder="4" min="1" style={inputStyle} />
                <button onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: itens.length === 1 ? '#f9f9f9' : '#fff5fd', border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`, borderRadius: '8px', color: itens.length === 1 ? '#00000022' : '#ff33cc', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Mobile */}
              <div className="calc-item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#f9f9f9', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={labelStyle}>Item</span>
                  <button onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ background: itens.length === 1 ? 'transparent' : '#fff5fd', border: `1px solid ${itens.length === 1 ? 'transparent' : '#ff33cc33'}`, borderRadius: '6px', padding: '4px 8px', color: itens.length === 1 ? '#00000022' : '#ff33cc', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
                    <Trash2 size={12} /> Remover
                  </button>
                </div>
                {temAcervo && (
                  <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo(item.id, e.target.value)}
                    style={{ ...inputStyle, color: item.acervoId ? '#ff33cc' : '#9ca3af' }}>
                    <option value="">Selecionar do acervo...</option>
                    {acervo.map(a => <option key={a.id} value={a.id}>{a.nome} — R$ {Number(a.custo).toFixed(2).replace('.', ',')}</option>)}
                  </select>
                )}
                <input type="text" value={item.nome} onChange={e => atualizarItem(item.id, 'nome', e.target.value)} placeholder="Ex: Painel, Totem..." style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div><span style={labelStyle}>Custo (R$)</span><input type="number" value={item.custo || ''} onChange={e => atualizarItem(item.id, 'custo', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} /></div>
                  <div><span style={labelStyle}>Meses</span><input type="number" value={item.meses || ''} onChange={e => atualizarItem(item.id, 'meses', e.target.value)} placeholder="6" min="1" style={inputStyle} /></div>
                  <div><span style={labelStyle}>Festas/mês</span><input type="number" value={item.festasporMes || ''} onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)} placeholder="4" min="1" style={inputStyle} /></div>
                </div>
              </div>

              {item.custo > 0 && (
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044' }}>{item.meses * item.festasporMes} festas</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9900ff', fontWeight: 600 }}>
                    R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} por festa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={adicionarItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #9900ff55', borderRadius: '10px', padding: '10px 16px', color: '#9900ff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Adicionar item
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066' }}>Custo total por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033' }}>R$ {custoPorFestaTotal.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Custos adicionais */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>💰 Custos adicionais</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>Outros custos que entram no preço final por festa</p>

        <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Frete por festa (R$)</label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="Ex: 50,00" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lucro desejado (%)</label>
            <input type="number" value={lucro || ''} onChange={e => setLucro(parseFloat(e.target.value) || 0)} placeholder="Ex: 30" min="0" style={inputStyle} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: lucro < 100 ? '#ff33cc' : '#00aa55', margin: '4px 0 0', fontWeight: 600 }}>
              {lucro < 100 ? '⚠️ Recomendado: 100% a 150%' : '✅ Dentro do recomendado'}
            </p>
          </div>
          <div>
            <label style={labelStyle}>Preço alvo (R$)</label>
            <input type="number" value={precoAlvo || ''} onChange={e => setPrecoAlvo(parseFloat(e.target.value) || 0)} placeholder="Ex: 90,00" min="0" step="0.01" style={inputStyle} />
            {margemParaAlvo !== null && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', margin: '4px 0 0', fontWeight: 600, color: margemParaAlvo < 0 ? '#cc0000' : margemParaAlvo >= 100 ? '#00aa55' : '#ff9900' }}>
                {margemParaAlvo < 0 ? '❌ Abaixo do custo mínimo' : `→ Requer ${margemParaAlvo}% de lucro`}
              </p>
            )}
          </div>
        </div>

        {/* Custo de vida — visual apenas, não afeta o preço */}
        <div style={{ background: '#f9f9f9', border: '1px solid #eeeeee', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#140033', margin: 0 }}>
              Análise de custo de vida
            </p>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#fff', background: '#9900ff55', borderRadius: '999px', padding: '2px 8px', fontWeight: 600 }}>
              só visual
            </span>
          </div>
          <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: custoVida > 0 ? '14px' : '0' }}>
            <div>
              <label style={labelStyle}>Custo de vida mensal (R$)</label>
              <input type="number" value={custoVida || ''} onChange={e => setCustoVida(parseFloat(e.target.value) || 0)} placeholder="Ex: 3000,00" min="0" step="0.01" style={inputStyle} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#00000044', margin: '4px 0 0' }}>Não entra no cálculo do preço</p>
            </div>
            <div>
              <label style={labelStyle}>Festas deste kit por mês</label>
              <input type="number" value={festasKitMes || ''} onChange={e => setFestasKitMes(parseFloat(e.target.value) || 1)} placeholder="4" min="1" style={inputStyle} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#00000044', margin: '4px 0 0' }}>Para estimar receita mensal</p>
            </div>
          </div>

          {custoVida > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000066' }}>
                  {festasKitMes} festa(s) × R$ {precoFinal.toFixed(2).replace('.', ',')} = R$ {receitaMensalEstimada.toFixed(2).replace('.', ',')} / mês
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: percentualVidaCoberto === 100 ? '#00aa55' : '#ff9900' }}>
                  {percentualVidaCoberto}%
                </span>
              </div>
              <div style={{ height: '6px', background: '#e5e5e5', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percentualVidaCoberto}%`, background: percentualVidaCoberto === 100 ? '#00aa55' : 'linear-gradient(90deg, #ff33cc, #9900ff)', borderRadius: '999px', transition: 'width .3s' }} />
              </div>
              {festasParaCobrir !== null && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', margin: '6px 0 0' }}>
                  Precisa de <strong>{festasParaCobrir} festas/mês</strong> deste kit para cobrir R$ {custoVida.toLocaleString('pt-BR')} de custo de vida
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Resultado */}
      <div style={{ background: 'linear-gradient(135deg, #140033, #1a0044)', border: '1px solid #ffffff12', borderRadius: '16px', padding: '28px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#ffffff88', margin: '0 0 20px 0' }}>📊 Resultado</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Custo dos itens por festa', valor: custoPorFestaTotal },
            { label: 'Frete', valor: frete },
            { label: `Lucro (${lucro}%)`, valor: valorLucro },
          ].map(linha => (
            <div key={linha.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66' }}>{linha.label}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc', fontWeight: 600 }}>
                R$ {linha.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #ffffff18', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff' }}>Preço por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#ff33cc', letterSpacing: '-1px' }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Comparação com preço alvo */}
        {precoAlvo > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ffffff10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff44' }}>
              Preço alvo: R$ {precoAlvo.toFixed(2).replace('.', ',')}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: precoFinal >= precoAlvo ? '#00ff88' : '#ffaa00' }}>
              {precoFinal >= precoAlvo
                ? `✓ R$ ${(precoFinal - precoAlvo).toFixed(2).replace('.', ',')} acima`
                : `R$ ${(precoAlvo - precoFinal).toFixed(2).replace('.', ',')} abaixo do alvo`}
            </span>
          </div>
        )}
      </div>

      {/* Modal — Salvar kit */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px 0' }}>
              {editandoId ? '✏️ Salvar alterações' : '💾 Salvar kit'}
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 24px 0' }}>
              {editandoId ? 'Atualize o nome do kit se quiser' : 'Dê um nome para identificar este kit'}
            </p>
            <input type="text" value={nomeKit} onChange={e => setNomeKit(e.target.value)} placeholder="Ex: Kit Básico Flores..." autoFocus
              onKeyDown={e => e.key === 'Enter' && salvarKit()}
              style={{ width: '100%', background: '#f9f9f9', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '14px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '10px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarKit} disabled={!nomeKit.trim() || salvando} style={{ flex: 2, padding: '12px', background: nomeKit.trim() ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f0f0f0', border: 'none', borderRadius: '10px', color: nomeKit.trim() ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: nomeKit.trim() ? 'pointer' : 'not-allowed' }}>
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Meus kits */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px #00000033', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: 0 }}>📁 Meus kits salvos</h3>
              <button onClick={() => setModalKits(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#00000066', display: 'flex', alignItems: 'center' }}>
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
                  <div key={kit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: editandoId === kit.id ? '#f5f0ff' : '#f9f9f9', border: `1px solid ${editandoId === kit.id ? '#9900ff33' : '#eeeeee'}`, borderRadius: '12px', padding: '14px 16px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px' }}>
                        {kit.nome}
                        {editandoId === kit.id && <span style={{ color: '#9900ff', fontSize: '11px', marginLeft: '8px' }}>● editando</span>}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                        {kit.itens.length} {kit.itens.length === 1 ? 'item' : 'itens'} · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => carregarKit(kit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                        <Pencil size={12} /> Carregar
                      </button>
                      {exportadoId === kit.id ? (
                        <span style={{ display: 'flex', alignItems: 'center', background: '#f0fff4', border: '1px solid #00aa5533', borderRadius: '8px', padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#00aa55' }}>✓ Enviado!</span>
                      ) : (
                        <button onClick={() => exportarParaCatalogo(kit)} disabled={exportando} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #ff33cc44', borderRadius: '8px', padding: '8px 10px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: exportando ? 0.6 : 1 }}>
                          ↑ Catálogo
                        </button>
                      )}
                      <button onClick={() => deletarKit(kit.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '8px', color: '#ff33cc', cursor: 'pointer' }}>
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
          .form-grid-3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .form-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}