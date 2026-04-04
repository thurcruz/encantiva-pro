'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

// ── Ícones ───────────────────────────────────────────────
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2l2 2-7 7H2V9l7-7z"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconX       = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l9 9M11 2L2 11"/></svg>
const IconImage   = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="2"/><circle cx="5.5" cy="8" r="1.2"/><path d="M1 13l4-4 3 3 2.5-2 5.5 5"/></svg>
const IconChev    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 4-4 4"/></svg>
const IconUpload  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 8.5V2M4 4.5l2.5-2.5L9 4.5"/><path d="M2 10v1a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1"/></svg>
const IconFilter  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3h11M3 6.5h7M5 10h3"/></svg>
const IconSearch  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5L12 12"/></svg>
const IconPalette = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="6.5" cy="3.5" r="1" fill="currentColor"/><circle cx="9" cy="5" r="1" fill="currentColor"/></svg>

// ── Constantes ───────────────────────────────────────────
const UNIDADES = ['unidade', 'par', 'kit', 'metro', 'conjunto', 'caixa', 'pacote', 'rolo']
const TAMANHOS = ['', 'PP', 'P', 'M', 'G', 'GG', 'Baixa', 'Alta', 'Pequena', 'Média', 'Grande', '15cm', '20cm', '22cm', '25cm', '30cm', '40cm', '50cm', '60cm']

// Mapa de nomes de cores para hex (para exibir bolinha colorida)
const COR_HEX: Record<string, string> = {
  branca: '#ffffff', branco: '#ffffff',
  preta: '#111827', preto: '#111827',
  vermelha: '#ef4444', vermelho: '#ef4444',
  rosa: '#f472b6',
  azul: '#3b82f6',
  'azul claro': '#93c5fd', 'azul escuro': '#1e3a8a',
  verde: '#22c55e',
  'verde claro': '#86efac', 'verde escuro': '#166534',
  amarela: '#facc15', amarelo: '#facc15',
  laranja: '#f97316',
  roxa: '#a855f7', roxo: '#a855f7',
  dourada: '#f59e0b', dourado: '#f59e0b',
  prateada: '#9ca3af', prateado: '#9ca3af',
  bege: '#d4b896',
  nude: '#e5c9a6',
  lilás: '#c084fc', lilas: '#c084fc',
  coral: '#fb7185',
  'off white': '#f5f0e8',
  turquesa: '#06b6d4',
  marrom: '#92400e',
  'rose gold': '#e8a598',
}

function corHex(cor: string): string {
  return COR_HEX[cor.toLowerCase().trim()] ?? '#e8e8ec'
}

// ── Interfaces ───────────────────────────────────────────
export interface Variacao {
  id: string
  acervo_id: string
  descricao: string
  cor: string | null
  tamanho: string | null
  quantidade: number
  foto_url: string | null
}

export interface ItemAcervo {
  id: string
  usuario_id: string
  nome: string
  custo: number
  unidade: string
  foto_url: string | null
  variacoes?: Variacao[]
}

interface Props {
  usuarioId: string
  acervoInicial: ItemAcervo[]
  variacoesIniciais: Variacao[]
}

// ── Estilos ──────────────────────────────────────────────
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

// ── Upload de foto ────────────────────────────────────────
function FotoUpload({ valor, onChange, usuarioId, pasta }: {
  valor: string | null; onChange: (url: string | null) => void
  usuarioId: string; pasta: string
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setEnviando(true)
    const ext = file.name.split('.').pop()
    const path = `${usuarioId}/${pasta}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('acervo').upload(path, file, { upsert: true })
    if (error) { alert('Erro ao enviar: ' + error.message); setEnviando(false); return }
    const { data } = supabase.storage.from('acervo').getPublicUrl(path)
    onChange(data.publicUrl)
    setEnviando(false)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fafafa', border: '1.5px dashed #e8e8ec', borderRadius: '10px', padding: '8px 12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', flex: 1 }}>
        <IconUpload /> {enviando ? 'Enviando...' : valor ? 'Trocar foto' : 'Selecionar foto'}
      </button>
      {valor && (
        <>
          <div style={{ width: 38, height: 38, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e8e8ec', position: 'relative' }}>
            <NextImage src={valor} fill style={{ objectFit: 'cover' }} alt="preview" unoptimized />
          </div>
          <button type="button" onClick={() => onChange(null)}
            style={{ width: 28, height: 28, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconX />
          </button>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ── Card de item com variações ────────────────────────────
function ItemCard({ item, variacoes, usuarioId, onDelete, onUpdate, onAddVariacao, onDeleteVariacao, onUpdateVariacao }: {
  item: ItemAcervo
  variacoes: Variacao[]
  usuarioId: string
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<ItemAcervo>) => void
  onAddVariacao: (v: Variacao) => void
  onDeleteVariacao: (id: string) => void
  onUpdateVariacao: (id: string, data: Partial<Variacao>) => void
}) {
  const supabase = createClient()
  const [expandido, setExpandido] = useState(false)
  const [editando, setEditando] = useState(false)
  const [editForm, setEditForm] = useState({ nome: item.nome, custo: String(item.custo), unidade: item.unidade, foto_url: item.foto_url })
  const [salvandoEdit, setSalvandoEdit] = useState(false)

  const [novaVar, setNovaVar] = useState({ descricao: '', cor: '', tamanho: '', quantidade: '1', foto_url: null as string | null })
  const [salvandoVar, setSalvandoVar] = useState(false)
  const [editandoVar, setEditandoVar] = useState<string | null>(null)
  const [editVarForm, setEditVarForm] = useState<Partial<Variacao>>({})

  const totalQtd = variacoes.reduce((s, v) => s + Number(v.quantidade), 0)

  async function salvarEdicao() {
    if (!editForm.nome.trim()) return
    setSalvandoEdit(true)
    const { error } = await supabase.from('acervo').update({
      nome: editForm.nome, custo: parseFloat(editForm.custo) || 0,
      unidade: editForm.unidade, foto_url: editForm.foto_url || null,
    }).eq('id', item.id)
    if (!error) { onUpdate(item.id, { ...editForm, custo: parseFloat(editForm.custo) || 0, foto_url: editForm.foto_url || null }); setEditando(false) }
    setSalvandoEdit(false)
  }

  async function adicionarVariacao() {
    if (!novaVar.descricao.trim()) return
    setSalvandoVar(true)
    const { data, error } = await supabase.from('acervo_variacoes').insert({
      acervo_id: item.id,
      descricao: novaVar.descricao.trim(),
      cor: novaVar.cor || null,
      tamanho: novaVar.tamanho || null,
      quantidade: parseInt(novaVar.quantidade) || 1,
      foto_url: novaVar.foto_url || null,
    }).select().single()
    if (error) {
      alert('Erro ao salvar variação: ' + error.message + ' | Código: ' + error.code)
    } else if (data) {
      onAddVariacao(data as Variacao)
      setNovaVar({ descricao: '', cor: '', tamanho: '', quantidade: '1', foto_url: null })
    }
    setSalvandoVar(false)
  }

  async function salvarVariacao(id: string) {
    const { error } = await supabase.from('acervo_variacoes').update({
      descricao: editVarForm.descricao,
      cor: editVarForm.cor || null,
      tamanho: editVarForm.tamanho || null,
      quantidade: Number(editVarForm.quantidade) || 1,
      foto_url: editVarForm.foto_url || null,
    }).eq('id', id)
    if (!error) { onUpdateVariacao(id, editVarForm); setEditandoVar(null) }
  }

  async function deletarVariacao(id: string) {
    const { error } = await supabase.from('acervo_variacoes').delete().eq('id', id)
    if (!error) onDeleteVariacao(id)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', overflow: 'hidden', marginBottom: '8px' }}>
      {/* Cabeçalho do item */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {/* Foto */}
        <div style={{ width: 64, height: 64, flexShrink: 0, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {item.foto_url
            ? <NextImage src={item.foto_url} fill style={{ objectFit: 'cover' }} alt={item.nome} unoptimized />
            : <span style={{ color: '#d8b4fe' }}><IconImage /></span>}
        </div>

        {editando ? (
          <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px', gap: '8px' }}>
              <input style={{ ...input, padding: '7px 10px', fontSize: '12px' }} value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
              <input type="number" style={{ ...input, padding: '7px 10px', fontSize: '12px' }} value={editForm.custo} onChange={e => setEditForm(p => ({ ...p, custo: e.target.value }))} placeholder="Custo" />
              <select style={{ ...input, padding: '7px 10px', fontSize: '12px' }} value={editForm.unidade} onChange={e => setEditForm(p => ({ ...p, unidade: e.target.value }))}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <FotoUpload valor={editForm.foto_url} onChange={url => setEditForm(p => ({ ...p, foto_url: url }))} usuarioId={usuarioId} pasta="itens" />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={salvarEdicao} disabled={salvandoEdit} style={{ ...btnPrimario, padding: '7px 14px', fontSize: '12px' }}><IconCheck /> Salvar</button>
              <button onClick={() => setEditando(false)} style={{ padding: '7px 14px', borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px', color: '#ff33cc' }}>R$ {Number(item.custo).toFixed(2).replace('.', ',')}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>por {item.unidade}</span>
                {variacoes.length > 0 && (
                  <span style={{ background: '#f0f0fb', color: '#6b7280', borderRadius: '999px', padding: '1px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700 }}>
                    {variacoes.length} variação{variacoes.length > 1 ? 'ões' : ''} · {totalQtd} un.
                  </span>
                )}
              </div>
              {/* Bolinhas de cor das variações */}
              {variacoes.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                  {variacoes.map(v => v.cor && (
                    <div key={v.id} title={`${v.descricao} (${v.quantidade})`}
                      style={{ width: 12, height: 12, borderRadius: '50%', background: corHex(v.cor), border: '1.5px solid #e8e8ec', flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', flexShrink: 0 }}>
              <button onClick={() => setEditando(true)} style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconEdit /></button>
              <button onClick={() => onDelete(item.id)} style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash /></button>
              <button onClick={() => setExpandido(v => !v)}
                style={{ width: 30, height: 30, borderRadius: '999px', border: `1px solid ${expandido ? '#ff33cc' : '#e8e8ec'}`, background: expandido ? '#fff0fb' : '#fafafa', color: expandido ? '#ff33cc' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                <span style={{ transform: expandido ? 'rotate(90deg)' : 'none', transition: 'transform .2s', display: 'flex' }}><IconChev /></span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Painel de variações */}
      {expandido && (
        <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa', padding: '16px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 12px' }}>Variações</p>

          {/* Lista de variações */}
          {variacoes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {variacoes.map(v => (
                <div key={v.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                  {/* Foto ou bolinha de cor */}
                  <div style={{ width: 48, flexShrink: 0, background: v.foto_url ? 'transparent' : `${corHex(v.cor ?? '')}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {v.foto_url
                      ? <NextImage src={v.foto_url} fill style={{ objectFit: 'cover' }} alt={v.descricao} unoptimized />
                      : v.cor
                        ? <div style={{ width: 20, height: 20, borderRadius: '50%', background: corHex(v.cor), border: '2px solid #fff', boxShadow: '0 0 0 1px #e8e8ec' }} />
                        : <span style={{ color: '#d1d5db' }}><IconImage /></span>}
                  </div>

                  {editandoVar === v.id ? (
                    <div style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 60px', gap: '6px' }}>
                        <input style={{ ...input, padding: '6px 8px', fontSize: '12px' }} value={editVarForm.descricao ?? ''} onChange={e => setEditVarForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição" />
                        <input style={{ ...input, padding: '6px 8px', fontSize: '12px' }} value={editVarForm.cor ?? ''} onChange={e => setEditVarForm(p => ({ ...p, cor: e.target.value }))} placeholder="Cor" />
                        <select style={{ ...input, padding: '6px 8px', fontSize: '12px' }} value={editVarForm.tamanho ?? ''} onChange={e => setEditVarForm(p => ({ ...p, tamanho: e.target.value }))}>
                          {TAMANHOS.map(t => <option key={t} value={t}>{t || '—'}</option>)}
                        </select>
                        <input type="number" style={{ ...input, padding: '6px 8px', fontSize: '12px' }} value={editVarForm.quantidade ?? 1} onChange={e => setEditVarForm(p => ({ ...p, quantidade: parseInt(e.target.value) || 1 }))} min="0" />
                      </div>
                      <FotoUpload valor={editVarForm.foto_url ?? null} onChange={url => setEditVarForm(p => ({ ...p, foto_url: url }))} usuarioId={usuarioId} pasta="variacoes" />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => salvarVariacao(v.id)} style={{ ...btnPrimario, padding: '6px 12px', fontSize: '11px' }}><IconCheck /> Salvar</button>
                        <button onClick={() => setEditandoVar(null)} style={{ padding: '6px 12px', borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.descricao}</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {v.cor && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#6b7280' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: corHex(v.cor), border: '1px solid #e8e8ec' }} />
                              {v.cor}
                            </span>
                          )}
                          {v.tamanho && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', background: '#f3f4f6', borderRadius: '4px', padding: '1px 5px' }}>{v.tamanho}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px', color: Number(v.quantidade) === 0 ? '#dc2626' : '#111827', margin: 0, lineHeight: 1 }}>{v.quantidade}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>unid.</p>
                        </div>
                        <button onClick={() => { setEditandoVar(v.id); setEditVarForm({ descricao: v.descricao, cor: v.cor ?? '', tamanho: v.tamanho ?? '', quantidade: v.quantidade, foto_url: v.foto_url }) }}
                          style={{ width: 26, height: 26, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconEdit /></button>
                        <button onClick={() => deletarVariacao(v.id)}
                          style={{ width: 26, height: 26, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Adicionar nova variação */}
          <div style={{ background: '#fff', border: '1px dashed #ffd6f5', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>Nova variação</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 60px', gap: '8px' }}>
                <div>
                  <span style={lbl}>Descrição *</span>
                  <input style={{ ...input, padding: '8px 10px', fontSize: '12px' }} placeholder="Ex: Bandeja azul alta" value={novaVar.descricao} onChange={e => setNovaVar(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div>
                  <span style={lbl}>Cor</span>
                  <input style={{ ...input, padding: '8px 10px', fontSize: '12px' }} placeholder="azul" value={novaVar.cor} onChange={e => setNovaVar(p => ({ ...p, cor: e.target.value }))} />
                </div>
                <div>
                  <span style={lbl}>Tamanho</span>
                  <select style={{ ...input, padding: '8px 10px', fontSize: '12px' }} value={novaVar.tamanho} onChange={e => setNovaVar(p => ({ ...p, tamanho: e.target.value }))}>
                    {TAMANHOS.map(t => <option key={t} value={t}>{t || '—'}</option>)}
                  </select>
                </div>
                <div>
                  <span style={lbl}>Qtd</span>
                  <input type="number" style={{ ...input, padding: '8px 10px', fontSize: '12px' }} min="0" value={novaVar.quantidade} onChange={e => setNovaVar(p => ({ ...p, quantidade: e.target.value }))} />
                </div>
              </div>
              <FotoUpload valor={novaVar.foto_url} onChange={url => setNovaVar(p => ({ ...p, foto_url: url }))} usuarioId={usuarioId} pasta="variacoes" />
              <button onClick={adicionarVariacao} disabled={salvandoVar || !novaVar.descricao.trim()}
                style={{ ...btnPrimario, width: '100%', padding: '9px', fontSize: '12px', borderRadius: '999px', opacity: salvandoVar || !novaVar.descricao.trim() ? 0.5 : 1 }}>
                <IconPlus /> {salvandoVar ? 'Salvando...' : 'Adicionar variação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────
export default function AcervoCliente({ usuarioId, acervoInicial, variacoesIniciais }: Props) {
  const supabase = createClient()

  const [itens, setItens] = useState<ItemAcervo[]>(acervoInicial)
  const [variacoes, setVariacoes] = useState<Variacao[]>(variacoesIniciais)
  const [salvando, setSalvando] = useState(false)

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroCor, setFiltroCor] = useState('')
  const [filtroNome, setFiltroNome] = useState('')

  // Form novo item
  const [novo, setNovo] = useState({ nome: '', custo: '', unidade: 'unidade', foto_url: null as string | null })

  // ── Cálculos ────────────────────────────────────────
  const totalCusto = itens.reduce((s, i) => s + Number(i.custo), 0)
  const totalVariacoes = variacoes.reduce((s, v) => s + Number(v.quantidade), 0)

  // Cores únicas de todas as variações
  const coresUnicas = useMemo(() =>
    [...new Set(variacoes.filter(v => v.cor).map(v => v.cor!.toLowerCase().trim()))].sort()
  , [variacoes])

  // Nomes únicos dos itens para filtro rápido
  const nomesUnicos = useMemo(() =>
    [...new Set(itens.map(i => i.nome))].sort()
  , [itens])

  // Itens filtrados
  const itensFiltrados = useMemo(() => {
    let resultado = itens

    if (busca.trim()) {
      resultado = resultado.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
    }

    if (filtroNome) {
      resultado = resultado.filter(i => i.nome === filtroNome)
    }

    if (filtroCor) {
      // Mostrar apenas itens que têm variação com a cor filtrada
      const idsComCor = new Set(
        variacoes.filter(v => v.cor?.toLowerCase().trim() === filtroCor).map(v => v.acervo_id)
      )
      resultado = resultado.filter(i => idsComCor.has(i.id))
    }

    return resultado
  }, [itens, variacoes, busca, filtroNome, filtroCor])

  // Variações por item
  function variacoesDo(itemId: string) {
    return variacoes.filter(v => v.acervo_id === itemId)
  }

  // ── Handlers ────────────────────────────────────────
  async function criarItem() {
    if (!novo.nome.trim() || !novo.custo) return
    setSalvando(true)
    const { data, error } = await supabase.from('acervo').insert({
      usuario_id: usuarioId, nome: novo.nome.trim(),
      custo: parseFloat(novo.custo.replace(',', '.')),
      unidade: novo.unidade, foto_url: novo.foto_url || null,
    }).select().single()
    if (!error && data) {
      setItens(p => [...p, data as ItemAcervo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovo({ nome: '', custo: '', unidade: 'unidade', foto_url: null })
    }
    setSalvando(false)
  }

  async function deletarItem(id: string) {
    const { error } = await supabase.from('acervo').delete().eq('id', id)
    if (!error) {
      setItens(p => p.filter(i => i.id !== id))
      setVariacoes(p => p.filter(v => v.acervo_id !== id))
    }
  }

  function atualizarItem(id: string, data: Partial<ItemAcervo>) {
    setItens(p => p.map(i => i.id === id ? { ...i, ...data } : i))
  }

  function adicionarVariacao(v: Variacao) {
    setVariacoes(p => [...p, v])
  }

  function deletarVariacao(id: string) {
    setVariacoes(p => p.filter(v => v.id !== id))
  }

  function atualizarVariacao(id: string, data: Partial<Variacao>) {
    setVariacoes(p => p.map(v => v.id === id ? { ...v, ...data } : v))
  }

  const filtrosAtivos = !!(busca || filtroNome || filtroCor)

  return (
    <div>
      {/* ── Resumo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Tipos de item', value: String(itens.length), color: '#111827' },
          { label: 'Unidades em estoque', value: String(totalVariacoes), color: '#7700ff' },
          { label: 'Valor do acervo', value: `R$ ${totalCusto.toFixed(2).replace('.', ',')}`, color: '#ff33cc' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px 18px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 4px' }}>{card.label}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 900, color: card.color, margin: 0, letterSpacing: '-0.5px' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Formulário novo item ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Adicionar item ao acervo</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '10px' }}>
            <div>
              <span style={lbl}>Nome do item *</span>
              <input style={input} placeholder="Ex: Bandeja retangular" value={novo.nome} onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))} onKeyDown={e => e.key === 'Enter' && criarItem()} />
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
            <span style={lbl}>Foto do item (opcional)</span>
            <FotoUpload valor={novo.foto_url} onChange={url => setNovo(p => ({ ...p, foto_url: url }))} usuarioId={usuarioId} pasta="itens" />
          </div>
          <button onClick={criarItem} disabled={salvando || !novo.nome.trim() || !novo.custo}
            style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novo.nome.trim() || !novo.custo ? 0.5 : 1, cursor: salvando || !novo.nome.trim() || !novo.custo ? 'not-allowed' : 'pointer' }}>
            <IconPlus /> {salvando ? 'Salvando...' : 'Adicionar item'}
          </button>
        </div>
      </div>

      {/* ── Filtros em cascata ── */}
      {itens.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <span style={{ color: '#9ca3af' }}><IconFilter /></span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>Filtrar acervo</p>
            {filtrosAtivos && (
              <button onClick={() => { setBusca(''); setFiltroNome(''); setFiltroCor('') }}
                style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '999px', padding: '3px 10px', color: '#ef4444', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                <IconX /> Limpar filtros
              </button>
            )}
          </div>

          {/* Busca por texto */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><IconSearch /></span>
            <input style={{ ...input, paddingLeft: '36px' }} placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          {/* Filtro por tipo de item */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px' }}>Tipo de item</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {nomesUnicos.map(nome => (
                <button key={nome} onClick={() => setFiltroNome(filtroNome === nome ? '' : nome)}
                  style={{ padding: '5px 12px', borderRadius: '999px', border: `1.5px solid ${filtroNome === nome ? '#ff33cc' : '#e8e8ec'}`, background: filtroNome === nome ? '#fff0fb' : '#fafafa', color: filtroNome === nome ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                  {nome}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por cor */}
          {coresUnicas.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconPalette /> Cor
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {coresUnicas.map(cor => (
                  <button key={cor} onClick={() => setFiltroCor(filtroCor === cor ? '' : cor)}
                    style={{ padding: '5px 12px', borderRadius: '999px', border: `1.5px solid ${filtroCor === cor ? corHex(cor) : '#e8e8ec'}`, background: filtroCor === cor ? `${corHex(cor)}22` : '#fafafa', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: corHex(cor), border: '1px solid #e8e8ec', flexShrink: 0 }} />
                    {cor}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lista de itens ── */}
      {itens.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', textAlign: 'center', padding: '56px 24px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Acervo vazio</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Cadastre seus itens para usá-los nos kits e na calculadora</p>
        </div>
      ) : itensFiltrados.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', textAlign: 'center', padding: '40px 24px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum item com esses filtros</p>
          <button onClick={() => { setBusca(''); setFiltroNome(''); setFiltroCor('') }}
            style={{ ...btnPrimario, padding: '8px 16px', fontSize: '12px', marginTop: '12px' }}>Limpar filtros</button>
        </div>
      ) : (
        <div>
          {filtrosAtivos && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 10px 4px' }}>
              {itensFiltrados.length} item{itensFiltrados.length !== 1 ? 'ns' : ''} encontrado{itensFiltrados.length !== 1 ? 's' : ''}
            </p>
          )}
          {itensFiltrados.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              variacoes={variacoesDo(item.id)}
              usuarioId={usuarioId}
              onDelete={deletarItem}
              onUpdate={atualizarItem}
              onAddVariacao={adicionarVariacao}
              onDeleteVariacao={deletarVariacao}
              onUpdateVariacao={atualizarVariacao}
            />
          ))}
        </div>
      )}
    </div>
  )
}