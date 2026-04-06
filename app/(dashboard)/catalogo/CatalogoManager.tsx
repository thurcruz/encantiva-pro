'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconImage   = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="2"/><circle cx="5.5" cy="8" r="1.2"/><path d="M1 13l4-4 3 3 2.5-2 5.5 5"/></svg>
const IconCopy    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="8" height="8" rx="1.5"/><path d="M3.5 3.5V2A1 1 0 0 0 2.5 1h-1A1 1 0 0 0 .5 2v1a1 1 0 0 0 1 1h1"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconExt     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8M8 1h4v4M12 1L6 7"/></svg>
const IconUpload  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9V2M4 5l3-3 3 3"/><path d="M2 11v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"/></svg>
const IconPackage = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 8.5V4.5L6.5 2 2 4.5v4L6.5 11l4.5-2.5z"/><path d="M2 4.5l4.5 2.5 4.5-2.5M6.5 7v4"/></svg>
const IconTag     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1h5l5.5 5.5a1.5 1.5 0 0 1 0 2L8 12a1.5 1.5 0 0 1-2 0L1 6.5V1z"/><circle cx="3.5" cy="3.5" r="1"/></svg>
const IconPalette = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="6.5" cy="6.5" r="5.5"/><circle cx="4" cy="5" r="1"/><circle cx="6.5" cy="3.5" r="1"/><circle cx="9" cy="5" r="1"/></svg>
const IconOrders  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="11" height="11" rx="2"/><path d="M4 5h5M4 7h3M4 9h4"/></svg>
const IconPencil  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2l2 2-6.5 6.5L2 11l.5-2.5L9 2z"/></svg>
const IconPause   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><rect x="2.5" y="2" width="3" height="9" rx="1"/><rect x="7.5" y="2" width="3" height="9" rx="1"/></svg>
const IconPlay    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><path d="M3 2.5l8 4-8 4V2.5z"/></svg>

const CATEGORIAS_DISPONIVEIS = [
  'Mesversário','Aniversário','Batizado','1ª Eucaristia',
  'Noivado','15 Anos','Casamento','Chá de Bebê',
  'Chá de Panela','Chá de Lingerie','Chá Revelação','Bodas',
]
const ITENS_KIT_SUGESTOES = ['Decoração','Painel','Lembrançinhas','Balões','Bolo','Mesa Posta','Iluminação','Cenografia']
const CATEGORIAS_ADICIONAL = ['Itens avulsos','Consumíveis','Doce','Bebida','Locação','Serviço']

interface Tema        { id: string; nome: string; categoria: string; categorias: string[]; foto_url: string | null; ativo: boolean }
interface Kit         { id: string; usuario_id: string; nome: string; descricao: string | null; preco: number; itens: string[]; foto_url: string | null; ativo: boolean }
interface Adicional   { id: string; usuario_id: string; nome: string; preco: number; categoria: string | null; foto_url: string | null; ativo: boolean }
interface Pedido      { id: string; tema_id: string; catalogo_kit_id: string; nome_cliente: string; telefone_cliente: string | null; data_evento: string; forma_pagamento: string | null; adicionais: string[]; valor_total: number; status: string; observacoes: string | null; criado_em: string }
interface EditKitForm { nome: string; descricao: string; preco: string; itens: string[]; foto_url: string | null }
interface EditAdicionalForm { nome: string; preco: string; categoria: string | null; foto_url: string | null }
interface EditTemaForm { nome: string; categorias: string[]; foto_url: string | null }

interface Props {
  usuarioId: string
  temasIniciais: Tema[]
  kitsIniciais: Kit[]
  adicionaisIniciais: Adicional[]
  pedidosIniciais: Pedido[]
}

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
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px', marginBottom: '16px',
}
const statusCor: Record<string, string> = {
  pendente: '#f59e0b', confirmado: '#10b981', cancelado: '#ef4444', concluido: '#8b5cf6',
}

// ── Componente de upload de foto ────────────────────────
function FotoUpload({
  valor, onChange, label: labelTexto, usuarioId, pasta,
}: {
  valor: string | null
  onChange: (url: string | null) => void
  label?: string
  usuarioId: string
  pasta: string
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${usuarioId}/${pasta}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('catalogo').upload(path, file, { upsert: true })
      if (error) { alert('Erro ao enviar foto: ' + error.message); return }
      const { data } = supabase.storage.from('catalogo').getPublicUrl(path)
      onChange(data.publicUrl)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      {labelTexto && <span style={lbl}>{labelTexto}</span>}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fafafa', border: '1.5px dashed #e8e8ec', borderRadius: '10px', padding: '9px 14px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', flex: 1 }}
        >
          <IconUpload />
          {enviando ? 'Enviando...' : valor ? 'Trocar foto' : 'Selecionar foto da galeria'}
        </button>
        {valor && (
          <>
            <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e8e8ec', position: 'relative' }}>
              <img src={valor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{ width: 28, height: 28, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <IconTrash />
            </button>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ── Seletor de itens de kit (predefinidos + customizados) ────────────────────────
function ItensKitSelector({
  itens, onChange,
}: {
  itens: string[]
  onChange: (itens: string[]) => void
}) {
  const [customInput, setCustomInput] = useState('')

  function toggleItem(item: string) {
    onChange(itens.includes(item) ? itens.filter(i => i !== item) : [...itens, item])
  }
  function addCustom() {
    const val = customInput.trim()
    if (!val || itens.includes(val)) return
    onChange([...itens, val])
    setCustomInput('')
  }

  const sugestoes = ITENS_KIT_SUGESTOES.filter(i => !itens.includes(i))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Itens selecionados */}
      {itens.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {itens.map(item => (
            <button key={item} type="button"
              onClick={() => toggleItem(item)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '999px', border: '1.5px solid #ff33cc', background: '#fff0fb', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              {item}
              <span style={{ fontSize: '14px', lineHeight: 1, marginTop: '-1px' }}>×</span>
            </button>
          ))}
        </div>
      )}
      {/* Input para item customizado */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          style={{ ...input, flex: 1 }}
          placeholder="Adicionar item... (ex: Topo de bolo)"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
        />
        <button type="button" onClick={addCustom}
          disabled={!customInput.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', background: customInput.trim() ? '#ff33cc' : '#f3f4f6', border: 'none', borderRadius: '10px', color: customInput.trim() ? '#fff' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: customInput.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
          <IconPlus /> Adicionar
        </button>
      </div>
      {/* Sugestões */}
      {sugestoes.length > 0 && (
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 6px', letterSpacing: '0.4px' }}>Sugestões:</p>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {sugestoes.map(item => (
              <button key={item} type="button" onClick={() => toggleItem(item)}
                style={{ padding: '4px 10px', borderRadius: '999px', border: '1.5px dashed #e8e8ec', background: '#fafafa', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                + {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CatalogoManager({ usuarioId, temasIniciais, kitsIniciais, adicionaisIniciais, pedidosIniciais }: Props) {
  const supabase = createClient()
  const [temas, setTemas] = useState<Tema[]>(temasIniciais)
  const [kits, setKits] = useState<Kit[]>(kitsIniciais)
  const [adicionais, setAdicionais] = useState<Adicional[]>(adicionaisIniciais)
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciais)
  const [aba, setAba] = useState<'kits' | 'adicionais' | 'temas' | 'pedidos'>('kits')
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // ── Estado de criação ──
  const [novoKit, setNovoKit] = useState({ nome: '', descricao: '', preco: '', itens: [] as string[], foto_url: null as string | null })
  const [novoAdicional, setNovoAdicional] = useState({ nome: '', preco: '', categoria: '', foto_url: null as string | null })
  const [novoTema, setNovoTema] = useState({ nome: '', categorias: [] as string[], foto_url: null as string | null })

  // ── Estado de edição ──
  const [editandoKit, setEditandoKit] = useState<string | null>(null)
  const [editKit, setEditKit] = useState<EditKitForm>({ nome: '', descricao: '', preco: '', itens: [], foto_url: null })
  const [editandoAdicional, setEditandoAdicional] = useState<string | null>(null)
  const [editAdicional, setEditAdicional] = useState<EditAdicionalForm>({ nome: '', preco: '', categoria: null, foto_url: null })
  const [editandoTema, setEditandoTema] = useState<string | null>(null)
  const [editTema, setEditTema] = useState<EditTemaForm>({ nome: '', categorias: [], foto_url: null })

  const linkPublico = typeof window !== 'undefined'
    ? `${window.location.origin}/pedido/${usuarioId}`
    : `/pedido/${usuarioId}`

  async function copiarLink() {
    await navigator.clipboard.writeText(linkPublico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function toggleCategoria(cat: string) {
    setNovoTema(p => ({
      ...p,
      categorias: p.categorias.includes(cat) ? p.categorias.filter(c => c !== cat) : [...p.categorias, cat],
    }))
  }
  function toggleCategoriaEdit(cat: string) {
    setEditTema(p => {
      const cats = p.categorias ?? []
      return { ...p, categorias: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat] }
    })
  }

  // ── CRUD Kits ──
  async function criarKit() {
    if (!novoKit.nome.trim() || !novoKit.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('catalogo_kits').insert({
      usuario_id: usuarioId, nome: novoKit.nome, descricao: novoKit.descricao || null,
      preco: parseFloat(novoKit.preco), itens: novoKit.itens, foto_url: novoKit.foto_url,
    }).select().single()
    if (!error && data) { setKits(p => [data, ...p]); setNovoKit({ nome: '', descricao: '', preco: '', itens: [], foto_url: null }) }
    setSalvando(false)
  }
  async function salvarKit(id: string) {
    if (!editKit.nome?.trim() || !editKit.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('catalogo_kits').update({
      nome: editKit.nome, descricao: editKit.descricao || null,
      preco: parseFloat(String(editKit.preco)), itens: editKit.itens ?? [],
      foto_url: editKit.foto_url ?? null,
    }).eq('id', id).select().single()
    if (!error && data) { setKits(p => p.map(k => k.id === id ? data : k)); setEditandoKit(null) }
    else if (error) alert('Erro ao salvar: ' + error.message)
    setSalvando(false)
  }
  async function deletarKit(id: string) {
    const { error } = await supabase.from('catalogo_kits').delete().eq('id', id)
    if (!error) setKits(p => p.filter(k => k.id !== id))
    else alert('Erro ao deletar kit: ' + error.message)
  }

  // ── CRUD Adicionais ──
  async function criarAdicional() {
    if (!novoAdicional.nome.trim() || !novoAdicional.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('adicionais').insert({
      usuario_id: usuarioId, nome: novoAdicional.nome,
      preco: parseFloat(novoAdicional.preco),
      categoria: novoAdicional.categoria || null,
      foto_url: novoAdicional.foto_url,
    }).select().single()
    if (!error && data) { setAdicionais(p => [data, ...p]); setNovoAdicional({ nome: '', preco: '', categoria: '', foto_url: null }) }
    setSalvando(false)
  }
  async function salvarAdicional(id: string) {
    if (!editAdicional.nome?.trim() || !editAdicional.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('adicionais').update({
      nome: editAdicional.nome,
      preco: parseFloat(String(editAdicional.preco)),
      categoria: editAdicional.categoria || null,
      foto_url: editAdicional.foto_url ?? null,
    }).eq('id', id).select().single()
    if (!error && data) { setAdicionais(p => p.map(a => a.id === id ? data : a)); setEditandoAdicional(null) }
    else if (error) alert('Erro ao salvar: ' + error.message)
    setSalvando(false)
  }
  async function deletarAdicional(id: string) {
    const { error } = await supabase.from('adicionais').delete().eq('id', id)
    if (!error) setAdicionais(p => p.filter(a => a.id !== id))
    else alert('Erro ao deletar adicional: ' + error.message)
  }

  // ── CRUD Temas ──
  async function criarTema() {
    if (!novoTema.nome.trim()) return
    setSalvando(true)
    const { data, error } = await supabase.from('catalogo_temas').insert({
      usuario_id: usuarioId, nome: novoTema.nome,
      categorias: novoTema.categorias,
      categoria: novoTema.categorias[0] ?? null,
      foto_url: novoTema.foto_url,
      ativo: true,
    }).select().single()
    if (!error && data) { setTemas(p => [data, ...p]); setNovoTema({ nome: '', categorias: [], foto_url: null }) }
    setSalvando(false)
  }
  async function salvarTema(id: string) {
    if (!editTema.nome?.trim()) return
    setSalvando(true)
    const cats = editTema.categorias ?? []
    const { data, error } = await supabase.from('catalogo_temas').update({
      nome: editTema.nome,
      categorias: cats,
      categoria: cats[0] ?? null,
      foto_url: editTema.foto_url ?? null,
    }).eq('id', id).select().single()
    if (!error && data) { setTemas(p => p.map(t => t.id === id ? data : t)); setEditandoTema(null) }
    else if (error) alert('Erro ao salvar: ' + error.message)
    setSalvando(false)
  }
  async function deletarTema(id: string) {
    const { error } = await supabase.from('catalogo_temas').delete().eq('id', id)
    if (!error) setTemas(p => p.filter(t => t.id !== id))
    else alert('Erro ao deletar tema: ' + error.message)
  }

  async function toggleAtivoKit(id: string, ativo: boolean) {
    const { error } = await supabase.from('catalogo_kits').update({ ativo: !ativo }).eq('id', id)
    if (!error) setKits(p => p.map(k => k.id === id ? { ...k, ativo: !ativo } : k))
    else alert('Erro ao atualizar kit: ' + error.message)
  }
  async function toggleAtivoAdicional(id: string, ativo: boolean) {
    const { error } = await supabase.from('adicionais').update({ ativo: !ativo }).eq('id', id)
    if (!error) setAdicionais(p => p.map(a => a.id === id ? { ...a, ativo: !ativo } : a))
    else alert('Erro ao atualizar adicional: ' + error.message)
  }
  async function toggleAtivoTema(id: string, ativo: boolean) {
    const { error } = await supabase.from('catalogo_temas').update({ ativo: !ativo }).eq('id', id)
    if (!error) setTemas(p => p.map(t => t.id === id ? { ...t, ativo: !ativo } : t))
    else alert('Erro ao atualizar tema: ' + error.message)
  }

  async function atualizarStatusPedido(id: string, status: string) {
    await supabase.from('pedidos').update({ status }).eq('id', id)
    setPedidos(p => p.map(x => x.id === id ? { ...x, status } : x))
  }

  const ABAS = [
    { key: 'kits',       label: 'Kits',       icone: <IconPackage />, count: kits.length      },
    { key: 'adicionais', label: 'Adicionais',  icone: <IconTag />,     count: adicionais.length },
    { key: 'temas',      label: 'Temas',       icone: <IconPalette />, count: temas.length     },
    { key: 'pedidos',    label: 'Pedidos',     icone: <IconOrders />,  count: pedidos.length   },
  ] as const

  return (
    <div>
      {/* ── Link público ── */}
      <div style={{ background: '#fff', border: '1px solid #ffd6f5', borderRadius: '16px', padding: '16px 18px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 6px' }}>Seu link de pedidos</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkPublico}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copiarLink} style={{ ...btnPrimario, flex: 1, background: copiado ? '#059669' : '#ff33cc' }}>
            {copiado ? <><IconCheck /> Copiado!</> : <><IconCopy /> Copiar link</>}
          </button>
          <a href={linkPublico} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#fafafa', border: '1.5px solid #ff33cc', borderRadius: '999px', color: '#ff33cc', flexShrink: 0, textDecoration: 'none' }}>
            <IconExt />
          </a>
        </div>
      </div>

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px' }}>
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', whiteSpace: 'nowrap', background: aba === a.key ? '#ff33cc' : '#fff', border: `1.5px solid ${aba === a.key ? 'transparent' : '#e8e8ec'}`, borderRadius: '999px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: aba === a.key ? '#fff' : '#6b7280', transition: 'all .15s' }}>
            {a.icone} {a.label}
            <span style={{ background: aba === a.key ? 'rgba(255,255,255,0.25)' : '#f3f4f6', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', color: aba === a.key ? '#fff' : '#9ca3af' }}>{a.count}</span>
          </button>
        ))}
      </div>

      {/* ════ ABA KITS ════ */}
      {aba === 'kits' && (
        <>
          <div style={card}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Novo kit / pacote</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><span style={lbl}>Nome do kit *</span><input style={input} placeholder="Ex: Kit Básico" value={novoKit.nome} onChange={e => setNovoKit(p => ({ ...p, nome: e.target.value }))} /></div>
                <div><span style={lbl}>Preço (R$) *</span><input style={input} type="number" placeholder="0,00" value={novoKit.preco} onChange={e => setNovoKit(p => ({ ...p, preco: e.target.value }))} /></div>
              </div>
              <div><span style={lbl}>Descrição</span><input style={input} placeholder="O que está incluso, diferenciais..." value={novoKit.descricao} onChange={e => setNovoKit(p => ({ ...p, descricao: e.target.value }))} /></div>
              <FotoUpload
                label="Foto do kit (opcional)"
                valor={novoKit.foto_url}
                onChange={url => setNovoKit(p => ({ ...p, foto_url: url }))}
                usuarioId={usuarioId}
                pasta="kits"
              />
              <div>
                <span style={lbl}>Itens inclusos</span>
                <ItensKitSelector itens={novoKit.itens} onChange={itens => setNovoKit(p => ({ ...p, itens }))} />
              </div>
              <button onClick={criarKit} disabled={salvando || !novoKit.nome.trim() || !novoKit.preco}
                style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novoKit.nome.trim() || !novoKit.preco ? 0.5 : 1 }}>
                <IconPlus /> {salvando ? 'Salvando...' : 'Adicionar kit'}
              </button>
            </div>
          </div>

          {kits.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: 0 }}>Nenhum kit cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kits.map(kit => (
                <div key={kit.id}>
                  {editandoKit === kit.id ? (
                    /* ── Formulário de edição inline ── */
                    <div style={{ background: '#fff', border: '2px solid #ff33cc', borderRadius: '14px', padding: '16px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: '0 0 12px' }}>Editar kit</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div><span style={lbl}>Nome *</span><input style={input} value={editKit.nome ?? ''} onChange={e => setEditKit(p => ({ ...p, nome: e.target.value }))} /></div>
                          <div><span style={lbl}>Preço (R$) *</span><input style={input} type="number" value={editKit.preco ?? ''} onChange={e => setEditKit(p => ({ ...p, preco: e.target.value }))} /></div>
                        </div>
                        <div><span style={lbl}>Descrição</span><input style={input} value={editKit.descricao ?? ''} onChange={e => setEditKit(p => ({ ...p, descricao: e.target.value }))} /></div>
                        <FotoUpload
                          label="Foto"
                          valor={editKit.foto_url ?? null}
                          onChange={url => setEditKit(p => ({ ...p, foto_url: url }))}
                          usuarioId={usuarioId}
                          pasta="kits"
                        />
                        <div>
                          <span style={lbl}>Itens inclusos</span>
                          <ItensKitSelector itens={editKit.itens ?? []} onChange={itens => setEditKit(p => ({ ...p, itens }))} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => salvarKit(kit.id)} disabled={salvando || !editKit.nome?.trim()}
                            style={{ ...btnPrimario, flex: 1, padding: '10px', opacity: salvando || !editKit.nome?.trim() ? 0.5 : 1 }}>
                            {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => setEditandoKit(null)}
                            style={{ padding: '10px 16px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Card normal ── */
                    <div style={{ background: '#fff', border: `1px solid ${kit.ativo === false ? '#e8e8ec' : '#e8e8ec'}`, borderRadius: '14px', overflow: 'hidden', display: 'flex', opacity: kit.ativo === false ? 0.55 : 1 }}>
                      <div style={{ width: 80, flexShrink: 0, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {kit.foto_url
                          ? <img src={kit.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} alt={kit.nome} />
                          : <span style={{ color: '#d8b4fe' }}><IconImage /></span>}
                        {kit.ativo === false && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ background: '#f3f4f6', borderRadius: '999px', padding: '2px 7px', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: '#9ca3af' }}>PAUSADO</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kit.nome}</p>
                          {kit.descricao && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kit.descricao}</p>}
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Array.isArray(kit.itens) && kit.itens.length > 0 ? kit.itens.join(' · ') : 'Sem itens'}</p>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#ff33cc', margin: 0 }}>R$ {Number(kit.preco).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => toggleAtivoKit(kit.id, kit.ativo !== false)}
                            title={kit.ativo === false ? 'Reativar kit' : 'Pausar kit'}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: `1px solid ${kit.ativo === false ? '#d1fae5' : '#fde68a'}`, background: kit.ativo === false ? '#f0fdf4' : '#fffbeb', color: kit.ativo === false ? '#059669' : '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {kit.ativo === false ? <IconPlay /> : <IconPause />}
                          </button>
                          <button onClick={() => { setEditandoKit(kit.id); setEditKit({ nome: kit.nome, descricao: kit.descricao ?? '', preco: String(kit.preco), itens: kit.itens ?? [], foto_url: kit.foto_url }) }}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPencil /></button>
                          <button onClick={() => deletarKit(kit.id)}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════ ABA ADICIONAIS ════ */}
      {aba === 'adicionais' && (
        <>
          <div style={card}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Novo adicional</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><span style={lbl}>Nome *</span><input style={input} placeholder="Ex: Mesa Cavalete" value={novoAdicional.nome} onChange={e => setNovoAdicional(p => ({ ...p, nome: e.target.value }))} /></div>
                <div><span style={lbl}>Preço (R$) *</span><input style={input} type="number" placeholder="0,00" value={novoAdicional.preco} onChange={e => setNovoAdicional(p => ({ ...p, preco: e.target.value }))} /></div>
              </div>
              <div>
                <span style={lbl}>Categoria</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {CATEGORIAS_ADICIONAL.map(cat => {
                    const sel = novoAdicional.categoria === cat
                    return (
                      <button key={cat} type="button"
                        onClick={() => setNovoAdicional(p => ({ ...p, categoria: sel ? '' : cat }))}
                        style={{ padding: '5px 11px', borderRadius: '999px', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, background: sel ? '#fff0fb' : '#fafafa', color: sel ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
                <input style={{ ...input, marginTop: '8px' }} placeholder="Ou digite uma categoria personalizada..." value={novoAdicional.categoria} onChange={e => setNovoAdicional(p => ({ ...p, categoria: e.target.value }))} />
              </div>
              <FotoUpload
                label="Foto (opcional)"
                valor={novoAdicional.foto_url}
                onChange={url => setNovoAdicional(p => ({ ...p, foto_url: url }))}
                usuarioId={usuarioId}
                pasta="adicionais"
              />
              <button onClick={criarAdicional} disabled={salvando || !novoAdicional.nome.trim() || !novoAdicional.preco}
                style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novoAdicional.nome.trim() || !novoAdicional.preco ? 0.5 : 1 }}>
                <IconPlus /> {salvando ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>

          {adicionais.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: 0 }}>Nenhum adicional cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adicionais.map(a => (
                <div key={a.id}>
                  {editandoAdicional === a.id ? (
                    <div style={{ background: '#fff', border: '2px solid #ff33cc', borderRadius: '14px', padding: '16px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: '0 0 12px' }}>Editar adicional</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div><span style={lbl}>Nome *</span><input style={input} value={editAdicional.nome ?? ''} onChange={e => setEditAdicional(p => ({ ...p, nome: e.target.value }))} /></div>
                          <div><span style={lbl}>Preço (R$) *</span><input style={input} type="number" value={editAdicional.preco ?? ''} onChange={e => setEditAdicional(p => ({ ...p, preco: e.target.value }))} /></div>
                        </div>
                        <div>
                          <span style={lbl}>Categoria</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {CATEGORIAS_ADICIONAL.map(cat => {
                              const sel = editAdicional.categoria === cat
                              return (
                                <button key={cat} type="button"
                                  onClick={() => setEditAdicional(p => ({ ...p, categoria: sel ? null : cat }))}
                                  style={{ padding: '5px 11px', borderRadius: '999px', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, background: sel ? '#fff0fb' : '#fafafa', color: sel ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                                  {cat}
                                </button>
                              )
                            })}
                          </div>
                          <input style={{ ...input, marginTop: '8px' }} placeholder="Ou categoria personalizada..." value={editAdicional.categoria ?? ''} onChange={e => setEditAdicional(p => ({ ...p, categoria: e.target.value }))} />
                        </div>
                        <FotoUpload
                          label="Foto"
                          valor={editAdicional.foto_url ?? null}
                          onChange={url => setEditAdicional(p => ({ ...p, foto_url: url }))}
                          usuarioId={usuarioId}
                          pasta="adicionais"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => salvarAdicional(a.id)} disabled={salvando || !editAdicional.nome?.trim()}
                            style={{ ...btnPrimario, flex: 1, padding: '10px', opacity: salvando || !editAdicional.nome?.trim() ? 0.5 : 1 }}>
                            {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => setEditandoAdicional(null)}
                            style={{ padding: '10px 16px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden', display: 'flex', opacity: a.ativo === false ? 0.55 : 1 }}>
                      <div style={{ width: 64, flexShrink: 0, background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {a.foto_url
                          ? <img src={a.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} alt={a.nome} />
                          : <span style={{ color: '#f9a8d4' }}><IconImage /></span>}
                        {a.ativo === false && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ background: '#f3f4f6', borderRadius: '999px', padding: '2px 5px', fontFamily: 'Inter, sans-serif', fontSize: '8px', fontWeight: 700, color: '#9ca3af' }}>PAUSADO</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>{a.nome}</p>
                          {a.categoria && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '0 0 2px' }}>{a.categoria}</p>}
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px', color: '#ff33cc', margin: 0 }}>R$ {Number(a.preco).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => toggleAtivoAdicional(a.id, a.ativo !== false)}
                            title={a.ativo === false ? 'Reativar adicional' : 'Pausar adicional'}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: `1px solid ${a.ativo === false ? '#d1fae5' : '#fde68a'}`, background: a.ativo === false ? '#f0fdf4' : '#fffbeb', color: a.ativo === false ? '#059669' : '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {a.ativo === false ? <IconPlay /> : <IconPause />}
                          </button>
                          <button onClick={() => { setEditandoAdicional(a.id); setEditAdicional({ nome: a.nome, preco: String(a.preco), categoria: a.categoria, foto_url: a.foto_url }) }}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPencil /></button>
                          <button onClick={() => deletarAdicional(a.id)}
                            style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════ ABA TEMAS ════ */}
      {aba === 'temas' && (
        <>
          <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#92400e', margin: '0 0 4px' }}>Opção &ldquo;Não encontrei meu tema&rdquo;</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#b45309', margin: 0 }}>
              No formulário de pedido sempre aparece o botão <strong>&ldquo;Não encontrei meu tema&rdquo;</strong> — a cliente digita o tema livremente.
            </p>
          </div>

          <div style={card}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Novo tema</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={lbl}>Nome do tema *</span>
                <input style={input} placeholder="Ex: Urso Marinheiro" value={novoTema.nome} onChange={e => setNovoTema(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <span style={lbl}>Categorias (selecione todas que se aplicam)</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {CATEGORIAS_DISPONIVEIS.map(cat => {
                    const sel = novoTema.categorias.includes(cat)
                    return (
                      <button key={cat} type="button" onClick={() => toggleCategoria(cat)}
                        style={{ padding: '6px 12px', borderRadius: '999px', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, background: sel ? '#fff0fb' : '#fafafa', color: sel ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all .12s' }}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <FotoUpload
                label="Foto do tema (opcional)"
                valor={novoTema.foto_url}
                onChange={url => setNovoTema(p => ({ ...p, foto_url: url }))}
                usuarioId={usuarioId}
                pasta="temas"
              />
              <button onClick={criarTema} disabled={salvando || !novoTema.nome.trim()}
                style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novoTema.nome.trim() ? 0.5 : 1 }}>
                <IconPlus /> {salvando ? 'Salvando...' : 'Adicionar tema'}
              </button>
            </div>
          </div>

          {temas.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: 0 }}>Nenhum tema cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {temas.map(tema => {
                const cats = tema.categorias?.length > 0 ? tema.categorias : (tema.categoria ? [tema.categoria] : [])
                if (editandoTema === tema.id) {
                  const editCats = editTema.categorias ?? []
                  return (
                    <div key={tema.id} style={{ background: '#fff', border: '2px solid #ff33cc', borderRadius: '14px', padding: '14px', gridColumn: '1 / -1' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: '0 0 12px' }}>Editar tema</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div><span style={lbl}>Nome *</span><input style={input} value={editTema.nome ?? ''} onChange={e => setEditTema(p => ({ ...p, nome: e.target.value }))} /></div>
                        <div>
                          <span style={lbl}>Categorias</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {CATEGORIAS_DISPONIVEIS.map(cat => {
                              const sel = editCats.includes(cat)
                              return (
                                <button key={cat} type="button" onClick={() => toggleCategoriaEdit(cat)}
                                  style={{ padding: '5px 10px', borderRadius: '999px', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, background: sel ? '#fff0fb' : '#fafafa', color: sel ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                                  {cat}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <FotoUpload
                          label="Foto"
                          valor={editTema.foto_url ?? null}
                          onChange={url => setEditTema(p => ({ ...p, foto_url: url }))}
                          usuarioId={usuarioId}
                          pasta="temas"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => salvarTema(tema.id)} disabled={salvando || !editTema.nome?.trim()}
                            style={{ ...btnPrimario, flex: 1, padding: '10px', opacity: salvando || !editTema.nome?.trim() ? 0.5 : 1 }}>
                            {salvando ? 'Salvando...' : 'Salvar'}
                          </button>
                          <button onClick={() => setEditandoTema(null)}
                            style={{ padding: '10px 16px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={tema.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden', opacity: tema.ativo === false ? 0.55 : 1 }}>
                    <div style={{ height: 90, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {tema.foto_url
                        ? <img src={tema.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} alt={tema.nome} />
                        : <span style={{ fontSize: '28px' }}>🎨</span>}
                      {tema.ativo === false && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ background: '#f3f4f6', borderRadius: '999px', padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: '#9ca3af' }}>PAUSADO</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.nome}</p>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {cats.slice(0, 2).map(c => (
                          <span key={c} style={{ background: '#fff0fb', color: '#ff33cc', borderRadius: '999px', padding: '1px 7px', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700 }}>{c}</span>
                        ))}
                        {cats.length > 2 && <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: '999px', padding: '1px 7px', fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700 }}>+{cats.length - 2}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleAtivoTema(tema.id, tema.ativo !== false)}
                          title={tema.ativo === false ? 'Reativar tema' : 'Pausar tema'}
                          style={{ flex: 1, height: 28, borderRadius: '999px', border: `1px solid ${tema.ativo === false ? '#d1fae5' : '#fde68a'}`, background: tema.ativo === false ? '#f0fdf4' : '#fffbeb', color: tema.ativo === false ? '#059669' : '#d97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {tema.ativo === false ? <IconPlay /> : <IconPause />}
                        </button>
                        <button onClick={() => { setEditandoTema(tema.id); setEditTema({ nome: tema.nome, categorias: cats, foto_url: tema.foto_url }) }}
                          style={{ flex: 1, height: 28, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPencil /></button>
                        <button onClick={() => deletarTema(tema.id)}
                          style={{ flex: 1, height: 28, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconTrash /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ════ ABA PEDIDOS ════ */}
      {aba === 'pedidos' && (
        <>
          {pedidos.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '56px 24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum pedido ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>Compartilhe seu link para receber pedidos</p>
              <button onClick={copiarLink} style={btnPrimario}><IconCopy /> Copiar link</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pedidos.map(pedido => {
                const tema = temas.find(t => t.id === pedido.tema_id)
                const kit  = kits.find(k => k.id === pedido.catalogo_kit_id)
                const cor  = statusCor[pedido.status] ?? '#9ca3af'
                return (
                  <div key={pedido.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.nome_cliente}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{[tema?.nome, kit?.nome, new Date(pedido.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')].filter(Boolean).join(' · ')}</p>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#ff33cc', margin: 0, flexShrink: 0 }}>R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <select value={pedido.status} onChange={e => atualizarStatusPedido(pedido.id, e.target.value)}
                      style={{ background: `${cor}15`, border: `1.5px solid ${cor}40`, borderRadius: '999px', padding: '6px 12px', color: cor, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', outline: 'none', width: '100%' }}>
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    {pedido.observacoes && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: '10px 0 0', background: '#f9fafb', borderRadius: '8px', padding: '8px 12px' }}>{pedido.observacoes}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
