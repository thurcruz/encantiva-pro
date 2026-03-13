'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

// ── Ícones ───────────────────────────────────────────────
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconCalc    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="12" height="12" rx="2"/><path d="M4 4h2M8 4h2M4 7h2M8 7h2M4 10h2M8 10h2"/></svg>
const IconExport  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v2h10v-2M7 1v8M4 6l3 3 3-3"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconPackage = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9.5V4.5L7 2 2 4.5v5L7 12l5-2.5z"/><path d="M2 4.5l5 2.5 5-2.5M7 7v5"/></svg>
const IconEmpty   = () => <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#e0e0e6" strokeWidth="1.2" strokeLinecap="round"><rect x="4" y="4" width="28" height="28" rx="3"/><path d="M12 18h12M18 12v12"/></svg>

const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827',
  background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '10px',
  padding: '10px 12px', outline: 'none',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', letterSpacing: '0.6px',
  textTransform: 'uppercase', marginBottom: '5px',
}
const btnPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: '#ff33cc', color: '#fff', border: 'none',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '10px 20px', whiteSpace: 'nowrap',
}
const btnSec: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  background: 'transparent', color: '#ff33cc', border: '1.5px solid #ff33cc',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
  borderRadius: '999px', cursor: 'pointer', padding: '8px 16px', whiteSpace: 'nowrap',
}

interface ItemKit {
  acervoId: string
  nome: string
  custo: number
  unidade: string
  quantidade: number
}

interface KitSalvo {
  id: string
  nome: string
  itens: ItemKit[]
  custoTotal: number
  precoSugerido: number
  margem: number
  exportado: boolean
}

interface Props {
  usuarioId: string
  acervo: ItemAcervo[]
}

export default function CalculadoraCliente({ usuarioId, acervo }: Props) {
  const supabase = createClient()

  // Kit em montagem
  const [nomeKit, setNomeKit] = useState('')
  const [itensKit, setItensKit] = useState<ItemKit[]>([])
  const [margem, setMargem] = useState(30)
  const [busca, setBusca] = useState('')

  // Kits salvos nesta sessão
  const [kitsSalvos, setKitsSalvos] = useState<KitSalvo[]>([])
  const [salvando, setSalvando] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  const acervoFiltrado = acervo.filter(a =>
    busca.trim() === '' || a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function adicionarItem(item: ItemAcervo) {
    setItensKit(prev => {
      const existe = prev.find(i => i.acervoId === item.id)
      if (existe) return prev.map(i => i.acervoId === item.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { acervoId: item.id, nome: item.nome, custo: Number(item.custo), unidade: item.unidade, quantidade: 1 }]
    })
  }

  function removerItem(acervoId: string) {
    setItensKit(prev => prev.filter(i => i.acervoId !== acervoId))
  }

  function alterarQtd(acervoId: string, qtd: number) {
    if (qtd < 1) return removerItem(acervoId)
    setItensKit(prev => prev.map(i => i.acervoId === acervoId ? { ...i, quantidade: qtd } : i))
  }

  const custoTotal = itensKit.reduce((s, i) => s + i.custo * i.quantidade, 0)
  const precoSugerido = custoTotal * (1 + margem / 100)

  function salvarKit() {
    if (!nomeKit.trim() || itensKit.length === 0) return
    const kit: KitSalvo = {
      id: crypto.randomUUID(),
      nome: nomeKit,
      itens: [...itensKit],
      custoTotal,
      precoSugerido,
      margem,
      exportado: false,
    }
    setKitsSalvos(p => [kit, ...p])
    setNomeKit('')
    setItensKit([])
    setMargem(30)
  }

  async function exportarParaCatalogo(kit: KitSalvo) {
    setExportando(true)
    setSalvando(kit.id)

    const { error } = await supabase.from('catalogo_kits').insert({
      usuario_id: usuarioId,
      nome: kit.nome,
      descricao: `Kit com ${kit.itens.length} item(ns)`,
      preco: kit.precoSugerido,
      itens: kit.itens.map(i => i.nome),
      foto_url: null,
    })

    if (!error) {
      setKitsSalvos(p => p.map(k => k.id === kit.id ? { ...k, exportado: true } : k))
    }

    setSalvando(null)
    setExportando(false)
  }

  return (
    <div>

      {/* ── Montagem do kit ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

        {/* Coluna esquerda: acervo para selecionar */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 12px' }}>
              Selecione os itens do acervo
            </p>
            <input
              style={{ ...input, marginBottom: '12px' }}
              placeholder="Buscar item..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {acervo.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><IconEmpty /></div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                  Cadastre itens no Acervo primeiro
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                {acervoFiltrado.map(item => {
                  const noKit = itensKit.find(i => i.acervoId === item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => adicionarItem(item)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: '10px', width: '100%', textAlign: 'left',
                        border: `1.5px solid ${noKit ? '#ff33cc' : '#e8e8ec'}`,
                        background: noKit ? '#fff0fb' : '#fafafa',
                        cursor: 'pointer', gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nome}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                          R$ {Number(item.custo).toFixed(2).replace('.', ',')} / {item.unidade}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {noKit && (
                          <span style={{ background: '#ff33cc', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}>
                            ×{noKit.quantidade}
                          </span>
                        )}
                        <span style={{ width: 24, height: 24, borderRadius: '999px', background: noKit ? '#ff33cc' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: noKit ? '#fff' : '#9ca3af' }}>
                          <IconPlus />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: resumo do kit */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 14px' }}>
              Kit em montagem
            </p>

            {/* Nome do kit */}
            <div style={{ marginBottom: '12px' }}>
              <span style={lbl}>Nome do kit</span>
              <input style={input} placeholder="Ex: Kit Básico Flores" value={nomeKit} onChange={e => setNomeKit(e.target.value)} />
            </div>

            {/* Itens adicionados */}
            {itensKit.length === 0 ? (
              <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '20px', textAlign: 'center', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                  Clique nos itens à esquerda para adicionar
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {itensKit.map(item => (
                  <div key={item.acervoId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#fafafa', borderRadius: '9px', border: '1px solid #e8e8ec' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nome}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        R$ {(item.custo * item.quantidade).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {/* Quantidade */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => alterarQtd(item.acervoId, item.quantidade - 1)} style={{ width: 22, height: 22, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fff', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>−</button>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', minWidth: '16px', textAlign: 'center' }}>{item.quantidade}</span>
                      <button onClick={() => alterarQtd(item.acervoId, item.quantidade + 1)} style={{ width: 22, height: 22, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fff', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 700, fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>+</button>
                    </div>
                    <button onClick={() => removerItem(item.acervoId)} style={{ width: 22, height: 22, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Margem */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ ...lbl, margin: 0 }}>Margem de lucro</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#ff33cc' }}>{margem}%</span>
              </div>
              <input
                type="range" min={0} max={200} value={margem}
                onChange={e => setMargem(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ff33cc' }}
              />
            </div>

            {/* Resumo de valores */}
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Custo total</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  R$ {custoTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Margem ({margem}%)</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                  + R$ {(precoSugerido - custoTotal).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div style={{ borderTop: '1px solid #e8e8ec', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#111827' }}>Preço sugerido</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 900, color: '#ff33cc', letterSpacing: '-0.3px' }}>
                  R$ {precoSugerido.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <button
              onClick={salvarKit}
              disabled={!nomeKit.trim() || itensKit.length === 0}
              style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: !nomeKit.trim() || itensKit.length === 0 ? 0.4 : 1, cursor: !nomeKit.trim() || itensKit.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              <IconCalc /> Salvar orçamento
            </button>
          </div>
        </div>
      </div>

      {/* ── Kits salvos ── */}
      {kitsSalvos.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px 2px' }}>
            Orçamentos salvos nesta sessão
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {kitsSalvos.map(kit => (
              <div key={kit.id} style={{ background: '#fff', border: `1px solid ${kit.exportado ? '#bbf7d0' : '#e8e8ec'}`, borderRadius: '14px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{kit.nome}</p>
                      {kit.exportado && (
                        <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '999px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <IconCheck /> No catálogo
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                      {kit.itens.map(i => `${i.nome}${i.quantidade > 1 ? ` ×${i.quantidade}` : ''}`).join(' · ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Preço sugerido</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '15px', color: '#ff33cc', margin: 0, letterSpacing: '-0.3px' }}>
                        R$ {kit.precoSugerido.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    {!kit.exportado && (
                      <button
                        onClick={() => exportarParaCatalogo(kit)}
                        disabled={salvando === kit.id}
                        style={{ ...btnSec, opacity: salvando === kit.id ? 0.6 : 1 }}
                      >
                        <IconExport />
                        {salvando === kit.id ? 'Exportando...' : 'Enviar ao catálogo'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}