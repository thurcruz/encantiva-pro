'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

// ── Ícones ───────────────────────────────────────────────
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2l2 2-7 7H2V9l7-7z"/></svg>
const IconCheck = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconX     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l9 9M11 2L2 11"/></svg>
const IconImage = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="2"/><circle cx="5.5" cy="8" r="1.2"/><path d="M1 13l4-4 3 3 2.5-2 5.5 5"/></svg>
const IconEmpty = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.2" strokeLinecap="round"><rect x="4" y="8" width="32" height="24" rx="3"/><path d="M4 14h32M12 8v6M20 8v6M28 8v6"/></svg>

export interface ItemAcervo {
  id: string
  usuario_id: string
  nome: string
  custo: number
  unidade: string
  foto_url: string | null
}

const UNIDADES = ['unidade', 'par', 'kit', 'metro', 'conjunto', 'caixa', 'pacote', 'rolo']

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
  borderRadius: '999px', cursor: 'pointer', padding: '10px 20px',
}

interface Props {
  usuarioId: string
  acervoInicial: ItemAcervo[]
}

export default function AcervoCliente({ usuarioId, acervoInicial }: Props) {
  const supabase = createClient()
  const [itens, setItens] = useState<ItemAcervo[]>(acervoInicial)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ItemAcervo>>({})

  const [novo, setNovo] = useState({
    nome: '', custo: '', unidade: 'unidade', foto_url: '',
  })

  async function criarItem() {
    if (!novo.nome.trim() || !novo.custo) return
    setSalvando(true)
    const { data, error } = await supabase.from('acervo').insert({
      usuario_id: usuarioId,
      nome: novo.nome.trim(),
      custo: parseFloat(novo.custo.replace(',', '.')),
      unidade: novo.unidade,
      foto_url: novo.foto_url || null,
    }).select().single()
    if (!error && data) {
      setItens(p => [...p, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovo({ nome: '', custo: '', unidade: 'unidade', foto_url: '' })
    }
    setSalvando(false)
  }

  async function deletarItem(id: string) {
    await supabase.from('acervo').delete().eq('id', id)
    setItens(p => p.filter(i => i.id !== id))
  }

  function iniciarEdicao(item: ItemAcervo) {
    setEditandoId(item.id)
    setEditForm({ nome: item.nome, custo: item.custo, unidade: item.unidade, foto_url: item.foto_url ?? '' })
  }

  async function salvarEdicao(id: string) {
    if (!editForm.nome?.trim()) return
    await supabase.from('acervo').update({
      nome: editForm.nome,
      custo: Number(editForm.custo),
      unidade: editForm.unidade,
      foto_url: editForm.foto_url || null,
    }).eq('id', id)
    setItens(p => p.map(i => i.id === id ? { ...i, ...editForm, custo: Number(editForm.custo) } as ItemAcervo : i))
    setEditandoId(null)
  }

  const totalCusto = itens.reduce((s, i) => s + Number(i.custo), 0)

  return (
    <div>

      {/* ── Resumo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 4px' }}>Total de itens</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>{itens.length}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 4px' }}>Valor total do acervo</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 900, color: '#ff33cc', margin: 0, letterSpacing: '-0.5px' }}>
            R$ {totalCusto.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* ── Formulário novo item ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Adicionar item ao acervo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '10px' }}>
            <div>
              <span style={lbl}>Nome do item *</span>
              <input style={input} placeholder="Ex: Boleira 3 andares" value={novo.nome} onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))} onKeyDown={e => e.key === 'Enter' && criarItem()} />
            </div>
            <div>
              <span style={lbl}>Custo (R$) *</span>
              <input style={input} placeholder="0,00" value={novo.custo} onChange={e => setNovo(p => ({ ...p, custo: e.target.value }))} />
            </div>
            <div>
              <span style={lbl}>Unidade</span>
              <select style={input} value={novo.unidade} onChange={e => setNovo(p => ({ ...p, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <span style={lbl}>Foto (opcional)</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input style={{ ...input, flex: 1 }} placeholder="https://... URL da imagem" value={novo.foto_url} onChange={e => setNovo(p => ({ ...p, foto_url: e.target.value }))} />
              {novo.foto_url && (
                <div style={{ width: 38, height: 38, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e8e8ec', position: 'relative' }}>
                  <NextImage src={novo.foto_url} fill style={{ objectFit: 'cover' }} alt="preview" unoptimized />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={criarItem}
            disabled={salvando || !novo.nome.trim() || !novo.custo}
            style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novo.nome.trim() || !novo.custo ? 0.5 : 1, cursor: salvando || !novo.nome.trim() || !novo.custo ? 'not-allowed' : 'pointer' }}
          >
            <IconPlus /> {salvando ? 'Salvando...' : 'Adicionar item'}
          </button>
        </div>
      </div>

      {/* ── Lista ── */}
      {itens.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><IconEmpty /></div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Acervo vazio</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            Cadastre seus itens para usá-los nos kits e na calculadora
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {itens.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>

              {/* Foto */}
              <div style={{ width: 56, flexShrink: 0, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {item.foto_url ? (
                  <NextImage src={item.foto_url} fill style={{ objectFit: 'cover' }} alt={item.nome} unoptimized />
                ) : (
                  <span style={{ color: '#d8b4fe' }}><IconImage /></span>
                )}
              </div>

              {/* Conteúdo */}
              <div style={{ flex: 1, minWidth: 0, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                {editandoId === item.id ? (
                  // Modo edição inline
                  <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      style={{ ...input, flex: '2 1 120px', padding: '6px 10px', fontSize: '12px' }}
                      value={editForm.nome ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))}
                    />
                    <input
                      style={{ ...input, width: '80px', padding: '6px 10px', fontSize: '12px' }}
                      value={editForm.custo ?? ''}
                      onChange={e => setEditForm(p => ({ ...p, custo: parseFloat(e.target.value) || 0 }))}
                    />
                    <select
                      style={{ ...input, width: '100px', padding: '6px 10px', fontSize: '12px' }}
                      value={editForm.unidade ?? 'unidade'}
                      onChange={e => setEditForm(p => ({ ...p, unidade: e.target.value }))}
                    >
                      {UNIDADES.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => salvarEdicao(item.id)} style={{ width: 30, height: 30, borderRadius: '999px', border: 'none', background: '#ff33cc', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconCheck />
                      </button>
                      <button onClick={() => setEditandoId(null)} style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconX />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo visualização
                  <>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nome}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        por {item.unidade}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#ff33cc', margin: 0 }}>
                        R$ {Number(item.custo).toFixed(2).replace('.', ',')}
                      </p>
                      <button onClick={() => iniciarEdicao(item)} style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconEdit />
                      </button>
                      <button onClick={() => deletarItem(item.id)} style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconTrash />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}