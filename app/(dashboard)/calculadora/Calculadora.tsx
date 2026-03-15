'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
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
  caixa_empresa: number
  locacoes_recuperar: number
  criado_em: string
  // legado
  permanentes?: Item[]
  consumiveis?: unknown[]
}

interface Props {
  acervo: ItemAcervo[]
}

// ── Modo simples: custo total ÷ locações + lucro + caixa
// ── Modo avançado: custo por item com vida útil

export default function Calculadora({ acervo }: Props) {
  const supabase = createClient()

  // Modo
  const [modoAvancado, setModoAvancado] = useState(false)

  // Modo simples
  const [custoTotal, setCustoTotal] = useState(0)
  const [locacoesRecuperar, setLocacoesRecuperar] = useState(4)

  // Modo avançado
  const [itens, setItens] = useState<Item[]>([
    { id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 },
  ])

  // Compartilhado
  const [lucro, setLucro] = useState(100)
  const [frete, setFrete] = useState(0)
  const [caixaEmpresa, setCaixaEmpresa] = useState(25)

  // Análise de rendimento
  const [metaSalario, setMetaSalario] = useState(0)
  const [festasKitMes, setFestasKitMes] = useState(15)
  const [mostrarAnalise, setMostrarAnalise] = useState(false)

  // Kits salvos
  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
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
    const payload = {
      nome: nomeKit, itens, lucro, frete,
      custo_vida: metaSalario,
      festas_kit_mes: festasKitMes,
      caixa_empresa: caixaEmpresa,
      locacoes_recuperar: locacoesRecuperar,
    }
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
    setItens(kit.itens ?? kit.permanentes ?? [{ id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 }])
    setLucro(kit.lucro)
    setFrete(kit.frete)
    setMetaSalario(kit.custo_vida ?? 0)
    setFestasKitMes(kit.festas_kit_mes ?? 15)
    setCaixaEmpresa(kit.caixa_empresa ?? 25)
    setLocacoesRecuperar(kit.locacoes_recuperar ?? 4)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    setKits(p => p.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
  }

  async function exportarParaCatalogo(kit: Kit) {
    setExportando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const custoPorFesta = (kit.itens ?? []).reduce((acc, item) => {
      const total = item.meses * item.festasporMes
      return acc + (total > 0 ? item.custo / total : 0)
    }, 0)
    const subtotal = custoPorFesta + (kit.frete ?? 0)
    const preco = subtotal * (1 + kit.lucro / 100)
    await supabase.from('catalogo_kits').insert({
      usuario_id: user.id, nome: kit.nome,
      descricao: `Kit exportado da calculadora`,
      preco: Math.ceil(preco / 5) * 5,
      itens: (kit.itens ?? []).map(i => i.nome).filter(Boolean),
      foto_url: null,
    })
    setExportadoId(kit.id)
    setTimeout(() => setExportadoId(null), 3000)
    setExportando(false)
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0, meses: 12, festasporMes: 15 }])
    setLucro(100); setFrete(0); setCaixaEmpresa(25); setLocacoesRecuperar(4)
    setCustoTotal(0); setMetaSalario(0); setFestasKitMes(15)
    setEditandoId(null); setNomeKit('')
  }

  function preencherDoAcervo(itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    setItens(p => p.map(i => i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i))
  }

  const temAcervo = acervo.length > 0

  // ── CÁLCULOS ─────────────────────────────────────────

  // Modo simples: custo total ÷ locações para recuperar = custo por festa
  const custoPorFestaSimples = locacoesRecuperar > 0 ? custoTotal / locacoesRecuperar : 0

  // Modo avançado: custo por item com vida útil
  const custoPorFestaAvancado = itens.reduce((acc, item) => {
    const total = item.meses * item.festasporMes
    return acc + (total > 0 ? item.custo / total : 0)
  }, 0)

  const custoPorFesta = modoAvancado ? custoPorFestaAvancado : custoPorFestaSimples
  const subtotal = custoPorFesta + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoSemCaixa = subtotal + valorLucro
  const valorCaixa = precoSemCaixa * (caixaEmpresa / 100)
  const precoFinal = precoSemCaixa + valorCaixa

  // Análise de rendimento
  const receitaMensalBruta = precoFinal * festasKitMes
  const receitaLiquida = receitaMensalBruta - (receitaMensalBruta * (caixaEmpresa / (100 + caixaEmpresa)))
  const percentualMeta = metaSalario > 0 ? Math.min(Math.round((receitaLiquida / metaSalario) * 100), 200) : null
  const festasParaMeta = metaSalario > 0 && precoFinal > 0 ? Math.ceil(metaSalario / (precoFinal * (1 - caixaEmpresa / (100 + caixaEmpresa)))) : null

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
    borderRadius: '10px', padding: '10px 12px', color: '#111827',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
    letterSpacing: '0.6px', textTransform: 'uppercase',
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '22px', marginBottom: '14px',
  }

  return (
    <div>

      {/* ── Barra de ações ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {editandoId && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 700, background: '#fff0fb', padding: '5px 12px', borderRadius: '999px', border: '1px solid #ffd6f5' }}>
              ✏️ {nomeKit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {editandoId && (
            <button onClick={novaCalculadora} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e8e8ec', borderRadius: '999px', padding: '9px 16px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              <X size={13} /> Novo
            </button>
          )}
          <button onClick={() => { setModalKits(true); void carregarKits() }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e8e8ec', borderRadius: '999px', padding: '9px 16px', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <FolderOpen size={13} /> Kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button onClick={() => setModalSalvar(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '9px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <Save size={13} /> {editandoId ? 'Salvar' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* ── Toggle modo ── */}
      <div style={{ display: 'flex', gap: '0', background: '#f3f4f6', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        <button
          onClick={() => setModoAvancado(false)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: '9px', border: 'none', background: !modoAvancado ? '#fff' : 'transparent', color: !modoAvancado ? '#111827' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: !modoAvancado ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}
        >
          ✨ Modo simples
        </button>
        <button
          onClick={() => setModoAvancado(true)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: '9px', border: 'none', background: modoAvancado ? '#fff' : 'transparent', color: modoAvancado ? '#111827' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: modoAvancado ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}
        >
          ⚙️ Modo avançado
        </button>
      </div>

      {/* ════ MODO SIMPLES ════ */}
      {!modoAvancado && (
        <div style={cardStyle}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: '0 0 4px' }}>Custo do kit</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>Quanto você investiu no total para montar este kit?</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Custo total investido (R$)</label>
              <input type="number" value={custoTotal || ''} onChange={e => setCustoTotal(parseFloat(e.target.value) || 0)} placeholder="Ex: 250,00" min="0" step="0.01" style={{ ...inputStyle, fontSize: '15px', padding: '12px 14px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '4px 0 0' }}>Painel + mesa + capa + jarro + boleira...</p>
            </div>
            <div>
              <label style={labelStyle}>Recuperar em quantas locações?</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[3, 4, 5, 6].map(n => (
                  <button key={n} onClick={() => setLocacoesRecuperar(n)} style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: `1.5px solid ${locacoesRecuperar === n ? '#ff33cc' : '#e8e8ec'}`, background: locacoesRecuperar === n ? '#fff0fb' : '#fafafa', color: locacoesRecuperar === n ? '#ff33cc' : '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                    {n}x
                  </button>
                ))}
              </div>
              {custoTotal > 0 && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', margin: '6px 0 0', fontWeight: 700 }}>
                  R$ {custoPorFestaSimples.toFixed(2).replace('.', ',')} por locação para recuperar
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ MODO AVANÇADO ════ */}
      {modoAvancado && (
        <div style={cardStyle}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: '0 0 4px' }}>Itens do kit</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>Cada item tem seu próprio tempo de uso — o custo é diluído nas festas do período</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
            <div className="calc-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 36px', gap: '8px', alignItems: 'end' }}>
              <span style={labelStyle}>Item {temAcervo && <span style={{ color: '#ff33cc', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· ou acervo</span>}</span>
              <span style={labelStyle}>Custo (R$)</span>
              <span style={labelStyle}>Dura (meses)</span>
              <span style={labelStyle}>Festas/mês</span>
              <div />
            </div>

            {itens.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="calc-item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 36px', gap: '8px', alignItems: 'center' }}>
                  {temAcervo ? (
                    <div style={{ display: 'flex', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
                      <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo(item.id, e.target.value)}
                        style={{ border: 'none', borderRight: '1px solid #e8e8ec', background: 'transparent', padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', maxWidth: '110px', flexShrink: 0 }}>
                        <option value="">Acervo...</option>
                        {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                      </select>
                      <input type="text" value={item.nome} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="ou digite..."
                        style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', outline: 'none', minWidth: 0 }} />
                    </div>
                  ) : (
                    <input type="text" value={item.nome} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Painel, Mesa, Capa..." style={inputStyle} />
                  )}
                  <input type="number" value={item.custo || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                  <input type="number" value={item.meses || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, meses: parseFloat(e.target.value) || 1 } : i))} placeholder="12" min="1" style={inputStyle} />
                  <input type="number" value={item.festasporMes || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, festasporMes: parseFloat(e.target.value) || 1 } : i))} placeholder="15" min="1" style={inputStyle} />
                  <button onClick={() => setItens(p => p.filter(i => i.id !== item.id))} disabled={itens.length === 1}
                    style={{ width: 36, height: 36, borderRadius: '999px', border: `1px solid ${itens.length === 1 ? '#e8e8ec' : '#fecdd3'}`, background: itens.length === 1 ? '#f9fafb' : '#fff5f5', color: itens.length === 1 ? '#d1d5db' : '#ef4444', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Mobile */}
                <div className="calc-item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#f9fafb', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={labelStyle}>Item</span>
                    <button onClick={() => setItens(p => p.filter(i => i.id !== item.id))} disabled={itens.length === 1} style={{ background: 'transparent', border: 'none', color: itens.length === 1 ? '#d1d5db' : '#ef4444', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Remover
                    </button>
                  </div>
                  <input type="text" value={item.nome} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Painel, Mesa..." style={inputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div><span style={labelStyle}>Custo</span><input type="number" value={item.custo || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0" style={inputStyle} /></div>
                    <div><span style={labelStyle}>Meses</span><input type="number" value={item.meses || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, meses: parseFloat(e.target.value) || 1 } : i))} placeholder="12" style={inputStyle} /></div>
                    <div><span style={labelStyle}>Festas/mês</span><input type="number" value={item.festasporMes || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, festasporMes: parseFloat(e.target.value) || 1 } : i))} placeholder="15" style={inputStyle} /></div>
                  </div>
                </div>

                {item.custo > 0 && item.meses > 0 && item.festasporMes > 0 && (
                  <div style={{ paddingLeft: '4px', display: 'flex', gap: '12px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>{item.meses * item.festasporMes} festas no total</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 700 }}>R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} / festa</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setItens(p => [...p, { id: Date.now(), nome: '', custo: 0, meses: 12, festasporMes: 15 }])}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ffc0ef', borderRadius: '999px', padding: '10px 18px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <Plus size={14} /> Adicionar item
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Custo por festa (todos os itens)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827' }}>R$ {custoPorFestaAvancado.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      )}

      {/* ── Precificação ── */}
      <div style={cardStyle}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: '0 0 18px' }}>Precificação</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Frete por locação (R$)</label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>% Caixa da empresa</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[20, 25, 30].map(n => (
                <button key={n} onClick={() => setCaixaEmpresa(n)} style={{ flex: 1, padding: '10px 0', borderRadius: '10px', border: `1.5px solid ${caixaEmpresa === n ? '#ff33cc' : '#e8e8ec'}`, background: caixaEmpresa === n ? '#fff0fb' : '#fafafa', color: caixaEmpresa === n ? '#ff33cc' : '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  {n}%
                </button>
              ))}
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '5px 0 0' }}>Para reposição, conserto e bolas</p>
          </div>
        </div>

        {/* Slider de lucro */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Margem de lucro</label>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#ff33cc', letterSpacing: '-0.5px' }}>{lucro}%</span>
          </div>
          <input type="range" min={0} max={500} value={lucro} onChange={e => setLucro(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ff33cc', height: '4px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>0%</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: lucro < 100 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
              {lucro < 100 ? '⚠️ Mínimo recomendado: 100%' : '✅ Boa margem'}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>500%</span>
          </div>
        </div>
      </div>

      {/* ── Resultado ── */}
      <div style={{ background: '#111827', borderRadius: '18px', padding: '26px', marginBottom: '14px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 18px' }}>Resultado</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Custo por locação</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', fontWeight: 600 }}>R$ {custoPorFesta.toFixed(2).replace('.', ',')}</span>
          </div>
          {frete > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Frete</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', fontWeight: 600 }}>R$ {frete.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Lucro ({lucro}%)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', fontWeight: 600 }}>R$ {valorLucro.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Caixa empresa ({caixaEmpresa}%)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', fontWeight: 600 }}>R$ {valorCaixa.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#f9fafb' }}>Preço por locação</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '38px', color: '#ff33cc', letterSpacing: '-1.5px' }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4b5563', margin: '10px 0 0', textAlign: 'right' }}>
          Seu lucro líquido: R$ {(precoFinal - custoPorFesta - frete - valorCaixa).toFixed(2).replace('.', ',')} por locação
        </p>
      </div>

      {/* ── Análise de rendimento (expansível) ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', overflow: 'hidden', marginBottom: '14px' }}>
        <button
          onClick={() => setMostrarAnalise(a => !a)}
          style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>Análise de rendimento mensal</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Quanto você vai ganhar por mês com esse kit</p>
            </div>
          </div>
          {mostrarAnalise ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </button>

        {mostrarAnalise && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Meta de salário mensal (R$)</label>
                <input type="number" value={metaSalario || ''} onChange={e => setMetaSalario(parseFloat(e.target.value) || 0)} placeholder="Ex: 2000,00" min="0" step="0.01" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Festas deste kit por mês</label>
                <input type="number" value={festasKitMes || ''} onChange={e => setFestasKitMes(parseFloat(e.target.value) || 1)} placeholder="15" min="1" style={inputStyle} />
              </div>
            </div>

            {precoFinal > 0 && (
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151' }}>
                    {festasKitMes} festa(s) × R$ {precoFinal.toFixed(2).replace('.', ',')}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                    R$ {receitaMensalBruta.toFixed(2).replace('.', ',')} / mês
                  </span>
                </div>

                {metaSalario > 0 && percentualMeta !== null && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Meta: R$ {metaSalario.toLocaleString('pt-BR')}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: percentualMeta >= 100 ? '#10b981' : '#f59e0b' }}>{percentualMeta}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ height: '100%', width: `${Math.min(percentualMeta, 100)}%`, background: percentualMeta >= 100 ? '#10b981' : '#ff33cc', borderRadius: '999px', transition: 'width .3s' }} />
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      {percentualMeta >= 100
                        ? `✅ Atinge a meta com ${festasKitMes} festas/mês`
                        : `Precisa de ${festasParaMeta} festas/mês para atingir R$ ${metaSalario.toLocaleString('pt-BR')}`}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Salvar */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalSalvar(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#111827', margin: '0 0 6px' }}>
              {editandoId ? 'Salvar alterações' : 'Salvar kit'}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>
              Dê um nome para este kit
            </p>
            <input type="text" value={nomeKit} onChange={e => setNomeKit(e.target.value)} placeholder="Ex: Kit Mesa Completo..." autoFocus
              onKeyDown={e => e.key === 'Enter' && salvarKit()}
              style={{ ...inputStyle, fontSize: '15px', padding: '12px 14px', marginBottom: '14px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: 'none', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarKit} disabled={!nomeKit.trim() || salvando} style={{ flex: 2, ...{} as React.CSSProperties, padding: '12px', background: nomeKit.trim() ? '#ff33cc' : '#e5e7eb', border: 'none', borderRadius: '999px', color: nomeKit.trim() ? '#fff' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: nomeKit.trim() ? 'pointer' : 'not-allowed' }}>
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kits */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setModalKits(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>Kits salvos</p>
              <button onClick={() => setModalKits(false)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '16px 20px 32px' }}>
              {carregandoKits ? (
                <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#9ca3af', fontSize: '13px', padding: '32px 0' }}>Carregando...</p>
              ) : kits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum kit salvo</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {kits.map(kit => (
                    <div key={kit.id} style={{ background: editandoId === kit.id ? '#fff0fb' : '#fafafa', border: `1.5px solid ${editandoId === kit.id ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>
                          {kit.nome}
                          {editandoId === kit.id && <span style={{ color: '#ff33cc', fontSize: '10px', marginLeft: '6px' }}>● editando</span>}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                          {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => carregarKit(kit)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                          <Pencil size={11} /> Carregar
                        </button>
                        {exportadoId === kit.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf9', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#059669' }}>✓ Enviado!</span>
                        ) : (
                          <button onClick={() => exportarParaCatalogo(kit)} disabled={exportando} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1.5px solid #ff33cc', borderRadius: '999px', padding: '8px 10px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: exportando ? 0.6 : 1 }}>
                            ↑ Catálogo
                          </button>
                        )}
                        <button onClick={() => deletarKit(kit.id)} style={{ width: 32, height: 32, background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: '999px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <style>{`
        @media (max-width: 768px) {
          .calc-header-desktop { display: none !important; }
          .calc-item-desktop { display: none !important; }
          .calc-item-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  )
}