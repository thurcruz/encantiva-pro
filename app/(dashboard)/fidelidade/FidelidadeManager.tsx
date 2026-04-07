'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

// Icones
const IconPlus    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconCopy    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3.5" y="3.5" width="8" height="8" rx="1.5"/><path d="M3.5 3.5V2A1 1 0 0 0 2.5 1h-1A1 1 0 0 0 .5 2v1a1 1 0 0 0 1 1h1"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconUsers   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5" cy="4" r="2.5"/><path d="M1 12c0-2.5 1.8-4 4-4s4 1.5 4 4"/><circle cx="11" cy="5" r="2"/><path d="M13 12c0-2-1.3-3-2-3"/></svg>
const IconEdit    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2l2 2-7 7H2V9l7-7z"/></svg>
const IconGift    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="5" width="12" height="8" rx="1.5"/><path d="M1 8h12M7 5v8"/><path d="M7 5C7 5 4 5 4 3s3-2 3 0M7 5c0 0 3 0 3-2s-3-2-3 0"/></svg>
const IconUpload  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 8.5V2M4 4.5l2.5-2.5L9 4.5"/><path d="M2 10v1a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-1"/></svg>
const IconWhats   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5.5"/><path d="M4 7.5c.5 1 1.5 1.8 2.5 1.8 1.5 0 2.5-1 2.5-2.3 0-1-1-1.5-1.5-1.5s-.5.3-.5.5c0 .5.5.8.5 1.3 0 .8-.8 1.5-1.5 1.5-.5 0-1-.3-1.3-.8L4 7.5z"/></svg>

interface Cartao {
  id: string
  usuario_id: string
  nome: string
  descricao: string | null
  total_selos: number
  premio: string
  ativo: boolean
  foto_url: string | null
  cor: string | null
  criado_em: string
}

interface Participante {
  id: string
  cartao_id: string
  usuario_id: string
  nome: string
  telefone: string | null
  selos: number
  resgatado: boolean
  resgatado_em: string | null
  criado_em: string
  fidelidade_cartoes?: { nome: string } | null
}

interface Props {
  usuarioId: string
  cartoesIniciais: Cartao[]
  participantesIniciais: Participante[]
}

const CORES = [
  { valor: '#ff33cc', label: 'Rosa' },
  { valor: '#9900ff', label: 'Roxo' },
  { valor: '#059669', label: 'Verde' },
  { valor: '#0ea5e9', label: 'Azul' },
  { valor: '#f59e0b', label: 'Dourado' },
  { valor: '#ef4444', label: 'Vermelho' },
  { valor: '#111827', label: 'Preto' },
]

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
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '20px', marginBottom: '12px',
}
const btnPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: '#ff33cc', color: '#fff', border: 'none',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '10px 20px',
}

function FotoUpload({ valor, onChange, usuarioId }: { valor: string | null; onChange: (url: string | null) => void; usuarioId: string }) {
  const supabase = createClient()
  const ref = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setEnviando(true)
    const ext = file.name.split('.').pop()
    const path = `${usuarioId}/fidelidade/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('catalogo').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('catalogo').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setEnviando(false)
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fafafa', border: '1.5px dashed #e8e8ec', borderRadius: '10px', padding: '8px 12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', flex: 1 }}>
        <IconUpload /> {enviando ? 'Enviando...' : valor ? 'Trocar logo' : 'Logo do cartao (opcional)'}
      </button>
      {valor && (
        <div style={{ width: 38, height: 38, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e8e8ec', position: 'relative' }}>
          <Image src={valor} fill style={{ objectFit: 'cover' }} alt="logo" unoptimized />
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// Preview do cartao
function CartaoPreview({ nome, premio, totalSelos, cor, foto }: { nome: string; premio: string; totalSelos: number; cor: string; foto: string | null }) {
  return (
    <div style={{ background: cor, borderRadius: '16px', padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: '160px' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cartao Fidelidade</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{nome || 'Nome do cartao'}</p>
        </div>
        {foto && (
          <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', position: 'relative' }}>
            <Image src={foto} fill style={{ objectFit: 'cover' }} alt="logo" unoptimized />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {Array.from({ length: Math.min(totalSelos, 12) }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', opacity: 0.5 }}>★</span>
          </div>
        ))}
        {totalSelos > 12 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.7)', alignSelf: 'center' }}>+{totalSelos - 12}</span>}
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
        Premio: <strong>{premio || 'Defina o premio'}</strong>
      </p>
    </div>
  )
}

export default function FidelidadeManager({ usuarioId, cartoesIniciais, participantesIniciais }: Props) {
  const supabase = createClient()
  const [cartoes, setCartoes] = useState<Cartao[]>(cartoesIniciais)
  const [participantes, setParticipantes] = useState<Participante[]>(participantesIniciais)
  const [aba, setAba] = useState<'cartoes' | 'participantes'>('cartoes')
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string | null>(null)

  const [novoCartao, setNovoCartao] = useState({
    nome: '', descricao: '', total_selos: '10', premio: '', cor: '#ff33cc', foto_url: null as string | null,
  })

  async function criarCartao() {
    if (!novoCartao.nome.trim() || !novoCartao.premio.trim()) return
    setSalvando(true)
    const { data, error } = await supabase.from('fidelidade_cartoes').insert({
      usuario_id: usuarioId,
      nome: novoCartao.nome.trim(),
      descricao: novoCartao.descricao || null,
      total_selos: parseInt(novoCartao.total_selos) || 10,
      premio: novoCartao.premio.trim(),
      cor: novoCartao.cor,
      foto_url: novoCartao.foto_url,
      ativo: true,
    }).select().single()
    if (error) {
      alert('Erro ao criar cartao: ' + error.message + ' | Codigo: ' + error.code)
    } else if (data) {
      setCartoes(p => [data as Cartao, ...p])
      setNovoCartao({ nome: '', descricao: '', total_selos: '10', premio: '', cor: '#ff33cc', foto_url: null })
    }
    setSalvando(false)
  }

  async function deletarCartao(id: string) {
    const { error } = await supabase.from('fidelidade_cartoes').delete().eq('id', id)
    if (!error) setCartoes(p => p.filter(c => c.id !== id))
  }

  async function toggleAtivo(cartao: Cartao) {
    const { error } = await supabase.from('fidelidade_cartoes').update({ ativo: !cartao.ativo }).eq('id', cartao.id)
    if (!error) setCartoes(p => p.map(c => c.id === cartao.id ? { ...c, ativo: !c.ativo } : c))
  }

  async function adicionarSelo(participanteId: string) {
    const p = participantes.find(x => x.id === participanteId)
    if (!p) return
    const cartao = cartoes.find(c => c.id === p.cartao_id)
    if (!cartao) return
    const novosSelos = p.selos + 1
    const resgatado = novosSelos >= cartao.total_selos
    const { error } = await supabase.from('fidelidade_clientes').update({
      selos: novosSelos,
      resgatado: resgatado || p.resgatado,
      resgatado_em: resgatado && !p.resgatado ? new Date().toISOString() : p.resgatado_em,
    }).eq('id', participanteId)
    if (!error) {
      setParticipantes(prev => prev.map(x => x.id === participanteId ? { ...x, selos: novosSelos, resgatado: resgatado || x.resgatado } : x))
    }
  }

  async function removerSelo(participanteId: string) {
    const p = participantes.find(x => x.id === participanteId)
    if (!p || p.selos <= 0) return
    const novosSelos = p.selos - 1
    const { error } = await supabase.from('fidelidade_clientes').update({ selos: novosSelos }).eq('id', participanteId)
    if (!error) setParticipantes(prev => prev.map(x => x.id === participanteId ? { ...x, selos: novosSelos } : x))
  }

  async function marcarResgatado(participanteId: string, resgatado: boolean) {
    const { error } = await supabase.from('fidelidade_clientes').update({
      resgatado,
      resgatado_em: resgatado ? new Date().toISOString() : null,
    }).eq('id', participanteId)
    if (!error) setParticipantes(prev => prev.map(x => x.id === participanteId ? { ...x, resgatado } : x))
  }

  function copiarLink(cartaoId: string) {
    const link = `${window.location.origin}/fidelidade/${cartaoId}`
    navigator.clipboard.writeText(link)
    setCopiado(cartaoId)
    setTimeout(() => setCopiado(null), 2000)
  }

  function abrirWhatsApp(telefone: string | null, nome: string, cartaoNome: string, selos: number, total: number) {
    const link = `${window.location.origin}/fidelidade/${participantes.find(p => p.nome === nome)?.cartao_id ?? ''}`
    const msg = `Ola ${nome}! Voce tem ${selos} de ${total} selos no cartao "${cartaoNome}". Acesse seu cartao: ${link}`
    if (telefone) {
      const tel = telefone.replace(/\D/g, '')
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
    } else {
      navigator.clipboard.writeText(msg)
      alert('Mensagem copiada!')
    }
  }

  const participantesFiltrados = cartaoSelecionado
    ? participantes.filter(p => p.cartao_id === cartaoSelecionado)
    : participantes

  return (
    <div>
      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {([
          { key: 'cartoes', label: 'Meus Cartoes', count: cartoes.length },
          { key: 'participantes', label: 'Participantes', count: participantes.length },
        ] as const).map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '999px', border: `1.5px solid ${aba === a.key ? 'transparent' : '#e8e8ec'}`, background: aba === a.key ? '#ff33cc' : '#fff', color: aba === a.key ? '#fff' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all .15s' }}>
            {a.label}
            <span style={{ background: aba === a.key ? 'rgba(255,255,255,0.25)' : '#f3f4f6', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', color: aba === a.key ? '#fff' : '#9ca3af' }}>{a.count}</span>
          </button>
        ))}
      </div>

      {/* ABA CARTOES */}
      {aba === 'cartoes' && (
        <>
          {/* Formulario novo cartao */}
          <div style={card}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Criar novo cartao</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Formulario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={lbl}>Nome do cartao *</span>
                  <input style={input} placeholder="Ex: Cartao VIP, Fidelidade Rosa..." value={novoCartao.nome} onChange={e => setNovoCartao(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <span style={lbl}>Descricao</span>
                  <input style={input} placeholder="Ex: A cada festa ganhe um selo!" value={novoCartao.descricao} onChange={e => setNovoCartao(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={lbl}>Selos para premio *</span>
                    <input type="number" style={input} min="1" max="20" value={novoCartao.total_selos} onChange={e => setNovoCartao(p => ({ ...p, total_selos: e.target.value }))} />
                  </div>
                  <div>
                    <span style={lbl}>Qual o premio *</span>
                    <input style={input} placeholder="Ex: 20% de desconto" value={novoCartao.premio} onChange={e => setNovoCartao(p => ({ ...p, premio: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <span style={lbl}>Cor do cartao</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {CORES.map(c => (
                      <button key={c.valor} type="button" onClick={() => setNovoCartao(p => ({ ...p, cor: c.valor }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c.valor, border: novoCartao.cor === c.valor ? '3px solid #111827' : '2px solid #fff', boxShadow: '0 0 0 1px #e8e8ec', cursor: 'pointer', transition: 'border .15s' }} title={c.label} />
                    ))}
                  </div>
                </div>
                <FotoUpload valor={novoCartao.foto_url} onChange={url => setNovoCartao(p => ({ ...p, foto_url: url }))} usuarioId={usuarioId} />
                <button onClick={criarCartao} disabled={salvando || !novoCartao.nome.trim() || !novoCartao.premio.trim()}
                  style={{ ...btnPrimario, width: '100%', padding: '12px', borderRadius: '999px', opacity: salvando || !novoCartao.nome.trim() || !novoCartao.premio.trim() ? 0.5 : 1 }}>
                  <IconPlus /> {salvando ? 'Criando...' : 'Criar cartao'}
                </button>
              </div>
              {/* Preview */}
              <div>
                <span style={lbl}>Preview</span>
                <CartaoPreview nome={novoCartao.nome} premio={novoCartao.premio} totalSelos={parseInt(novoCartao.total_selos) || 10} cor={novoCartao.cor} foto={novoCartao.foto_url} />
              </div>
            </div>
          </div>

          {/* Lista de cartoes */}
          {cartoes.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '56px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum cartao criado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Crie seu primeiro cartao de fidelidade acima</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {cartoes.map(c => {
                const totalParticipantes = participantes.filter(p => p.cartao_id === c.id).length
                return (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Cartao visual */}
                    <div style={{ background: c.cor ?? '#ff33cc', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: '#fff', margin: 0 }}>{c.nome}</p>
                          {c.descricao && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>{c.descricao}</p>}
                        </div>
                        {c.foto_url && (
                          <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', position: 'relative', flexShrink: 0 }}>
                            <Image src={c.foto_url} fill style={{ objectFit: 'cover' }} alt={c.nome} unoptimized />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {Array.from({ length: Math.min(c.total_selos, 10) }).map((_, i) => (
                          <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', opacity: 0.5 }}>★</span>
                          </div>
                        ))}
                        {c.total_selos > 10 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(255,255,255,0.7)', alignSelf: 'center' }}>+{c.total_selos - 10}</span>}
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                        Premio: <strong>{c.premio}</strong>
                      </p>
                    </div>

                    {/* Acoes */}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconUsers />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>{totalParticipantes} participante{totalParticipantes !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: c.ativo ? '#059669' : '#9ca3af', fontWeight: 600 }}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                          <button onClick={() => toggleAtivo(c)} style={{ width: 36, height: 20, borderRadius: '999px', background: c.ativo ? '#059669' : '#e8e8ec', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: c.ativo ? 19 : 3, transition: 'left .2s' }} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => copiarLink(c.id)}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: copiado === c.id ? '#f0fdf4' : '#fff0fb', border: `1px solid ${copiado === c.id ? '#bbf7d0' : '#ffd6f5'}`, borderRadius: '999px', padding: '8px', color: copiado === c.id ? '#059669' : '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                          {copiado === c.id ? <><IconCheck /> Copiado!</> : <><IconCopy /> Copiar link</>}
                        </button>
                        <button onClick={() => { setCartaoSelecionado(c.id); setAba('participantes') }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', padding: '8px 12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                          <IconUsers /> Ver
                        </button>
                        <button onClick={() => deletarCartao(c.id)}
                          style={{ width: 34, height: 34, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ABA PARTICIPANTES */}
      {aba === 'participantes' && (
        <>
          {/* Filtro por cartao */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setCartaoSelecionado(null)}
              style={{ padding: '6px 14px', borderRadius: '999px', border: `1.5px solid ${!cartaoSelecionado ? '#ff33cc' : '#e8e8ec'}`, background: !cartaoSelecionado ? '#fff0fb' : '#fff', color: !cartaoSelecionado ? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              Todos ({participantes.length})
            </button>
            {cartoes.map(c => (
              <button key={c.id} onClick={() => setCartaoSelecionado(c.id)}
                style={{ padding: '6px 14px', borderRadius: '999px', border: `1.5px solid ${cartaoSelecionado === c.id ? c.cor ?? '#ff33cc' : '#e8e8ec'}`, background: cartaoSelecionado === c.id ? `${c.cor ?? '#ff33cc'}15` : '#fff', color: cartaoSelecionado === c.id ? c.cor ?? '#ff33cc' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {c.nome} ({participantes.filter(p => p.cartao_id === c.id).length})
              </button>
            ))}
          </div>

          {participantesFiltrados.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum participante ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Compartilhe o link do cartao para as clientes se cadastrarem</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {participantesFiltrados.map(p => {
                const cartao = cartoes.find(c => c.id === p.cartao_id)
                const pct = cartao ? Math.min(100, (p.selos / cartao.total_selos) * 100) : 0
                const cor = cartao?.cor ?? '#ff33cc'
                return (
                  <div key={p.id} style={{ background: '#fff', border: `1px solid ${p.resgatado ? '#bbf7d0' : '#e8e8ec'}`, borderRadius: '14px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Avatar */}
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${cor}20`, border: `2px solid ${cor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px', color: cor }}>{p.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                          {p.resgatado && <span style={{ background: '#dcfce7', color: '#059669', borderRadius: '999px', padding: '1px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>Premio resgatado</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.telefone && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>{p.telefone}</span>}
                          {cartao && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>• {cartao.nome}</span>}
                        </div>
                      </div>
                      {/* Selos */}
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: cor, margin: 0, letterSpacing: '-0.5px' }}>
                          {p.selos}<span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af' }}>/{cartao?.total_selos}</span>
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>selos</p>
                      </div>
                      {/* Acoes */}
                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        <button onClick={() => abrirWhatsApp(p.telefone, p.nome, cartao?.nome ?? '', p.selos, cartao?.total_selos ?? 10)}
                          style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #dcfce7', background: '#f0fdf4', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Enviar mensagem">
                          <IconWhats />
                        </button>
                        <button onClick={() => adicionarSelo(p.id)}
                          style={{ width: 30, height: 30, borderRadius: '999px', border: `1px solid ${cor}44`, background: `${cor}15`, color: cor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px' }}
                          title="Adicionar selo">+</button>
                        <button onClick={() => removerSelo(p.id)} disabled={p.selos <= 0}
                          style={{ width: 30, height: 30, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', color: p.selos <= 0 ? '#d1d5db' : '#6b7280', cursor: p.selos <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px' }}
                          title="Remover selo">-</button>
                        {pct >= 100 && !p.resgatado && (
                          <button onClick={() => marcarResgatado(p.id, true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#059669', border: 'none', borderRadius: '999px', padding: '0 12px', height: 30, color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                            <IconGift /> Resgatar
                          </button>
                        )}
                        {p.resgatado && (
                          <button onClick={() => marcarResgatado(p.id, false)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', padding: '0 10px', height: 30, color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                            <IconEdit /> Desfazer
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    <div style={{ marginTop: '10px', background: '#f3f4f6', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#059669' : cor, borderRadius: '999px', transition: 'width .4s' }} />
                    </div>
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