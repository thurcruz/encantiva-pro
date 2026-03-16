'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import Link from 'next/link'
import { Download, Trash2, ImageIcon, Users, Lock, X, Check } from 'lucide-react'
import OrientacaoToggle from '../componentes/OrientacaoToggle'

interface Painel {
  id: string
  nome: string
  tipo: string
  imagem_url: string | null
  pdf_url: string | null
  publicado_comunidade: boolean
  criado_em: string
}

interface PainelComunidade {
  id: string
  usuario_id: string
  nome: string
  descricao: string | null
  imagem_url: string
  pdf_url: string
  downloads: number
  criado_em: string
}

interface Props {
  usuarioId: string
  paineis: Painel[]
  isAssinante: boolean
}

type Orientacao = 'paisagem' | 'retrato'

const IconUpload = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 14V4M7 8l4-4 4 4"/>
    <path d="M3 16v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/>
  </svg>
)

export default function PainelCriador({ usuarioId, paineis: paineisSalvos, isAssinante }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [imagem, setImagem]           = useState<HTMLImageElement | null>(null)
  const [imagemFile, setImagemFile]   = useState<File | null>(null)
  const [nome, setNome]               = useState('')
  const [descricao, setDescricao]     = useState('')
  const [gerando, setGerando]         = useState(false)
  const [paineis, setPaineis]         = useState<Painel[]>(paineisSalvos)
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [fatias, setFatias]           = useState<string[]>([])
  const [abaAtiva, setAbaAtiva]       = useState<'meus' | 'comunidade'>('meus')
  const [paineisComunidade, setPaineisComunidade] = useState<PainelComunidade[]>([])
  const [carregandoComunidade, setCarregandoComunidade] = useState(false)
  const [modalUpgrade, setModalUpgrade] = useState(false)
  const [publicando, setPublicando]   = useState<string | null>(null)
  const [orientacao, setOrientacao]   = useState<Orientacao>('paisagem')
  const [dragOver, setDragOver]       = useState(false)

  const COLS = orientacao === 'paisagem' ? 2 : 3
  const ROWS = orientacao === 'paisagem' ? 3 : 2

  const cortarImagem = useCallback((img: HTMLImageElement) => {
    const novasFatias: string[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const canvas = document.createElement('canvas')
        const larguraFatia = img.naturalWidth / COLS
        const alturaFatia  = img.naturalHeight / ROWS
        canvas.width  = larguraFatia
        canvas.height = alturaFatia
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, col * larguraFatia, row * alturaFatia, larguraFatia, alturaFatia, 0, 0, larguraFatia, alturaFatia)
        novasFatias.push(canvas.toDataURL('image/jpeg', 0.95))
      }
    }
    setFatias(novasFatias)
  }, [COLS, ROWS])

  useEffect(() => {
    if (!imagem) return
    cortarImagem(imagem)
  }, [imagem, orientacao, cortarImagem])

  const carregarComunidade = useCallback(async () => {
    setCarregandoComunidade(true)
    const { data } = await supabase
      .from('paineis_comunidade')
      .select('*')
      .order('downloads', { ascending: false })
    if (data) setPaineisComunidade(data)
    setCarregandoComunidade(false)
  }, [supabase])

  useEffect(() => {
    if (abaAtiva === 'comunidade') void carregarComunidade()
  }, [abaAtiva, carregarComunidade])

  function processarArquivo(file: File) {
    setImagemFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload  = () => { setImagem(img); setFatias([]); setPreviewAtivo(null) }
      img.onerror = () => alert('Erro ao carregar imagem. Tente outro arquivo.')
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processarArquivo(file)
  }

  async function comprimirFatia(fatia: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = orientacao === 'paisagem' ? 1240 : 827
        canvas.height = orientacao === 'paisagem' ? 825  : 1169
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.src = fatia
    })
  }

  async function gerarPDF() {
    if (!imagem || fatias.length === 0) return
    if (!nome.trim()) return alert('Dê um nome ao painel antes de gerar.')
    setGerando(true)
    try {
      const fatiasPequenas = await Promise.all(fatias.map(comprimirFatia))
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gerar-painel-pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ fatias: fatiasPequenas, nome, orientacao }),
        }
      )
      if (!response.ok) throw new Error(`Erro ${response.status}: ${await response.text()}`)
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      const base64Limpo = result.pdf.replace(/[^A-Za-z0-9+/=]/g, '')
      const pdfBytes    = Uint8Array.from(atob(base64Limpo), c => c.charCodeAt(0))
      const pdfBlob     = new Blob([pdfBytes], { type: 'application/pdf' })

      let imagemUrl = null
      if (imagemFile) {
        const { data: imgData } = await supabase.storage.from('paineis').upload(`${usuarioId}/${Date.now()}_original.jpg`, imagemFile, { upsert: true })
        if (imgData) {
          const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(imgData.path)
          imagemUrl = urlData.publicUrl
        }
      }
      const pdfPath = `${usuarioId}/${Date.now()}_${nome}.pdf`
      const { data: pdfData } = await supabase.storage.from('paineis').upload(pdfPath, pdfBlob, { upsert: true })
      let pdfUrl = null
      if (pdfData) {
        const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(pdfData.path)
        pdfUrl = urlData.publicUrl
      }
      const { data: novoPainel } = await supabase.from('paineis').insert({
        usuario_id: usuarioId, nome,
        tipo: orientacao === 'paisagem' ? '6-paisagem' : '6-retrato',
        imagem_url: imagemUrl, pdf_url: pdfUrl, publicado_comunidade: false,
      }).select().single()
      if (novoPainel) setPaineis(prev => [novoPainel, ...prev])

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url; a.download = `painel_${nome}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Erro ao gerar PDF: ${err}`)
    }
    setGerando(false)
  }

  async function publicarNaComunidade(painel: Painel) {
    if (!painel.pdf_url || !painel.imagem_url) return
    setPublicando(painel.id)
    const { error } = await supabase.from('paineis_comunidade').insert({
      usuario_id: usuarioId, nome: painel.nome, descricao: descricao || null,
      imagem_url: painel.imagem_url, pdf_url: painel.pdf_url,
    })
    if (!error) {
      await supabase.from('paineis').update({ publicado_comunidade: true }).eq('id', painel.id)
      setPaineis(prev => prev.map(p => p.id === painel.id ? { ...p, publicado_comunidade: true } : p))
    }
    setPublicando(null)
  }

  async function baixarDaComunidade(painel: PainelComunidade) {
    if (!isAssinante) { setModalUpgrade(true); return }
    await supabase.from('paineis_comunidade').update({ downloads: painel.downloads + 1 }).eq('id', painel.id)
    window.open(painel.pdf_url, '_blank')
  }

  async function deletarPainel(id: string) {
    await supabase.from('paineis').delete().eq('id', id)
    setPaineis(prev => prev.filter(p => p.id !== id))
  }

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
  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e8e8ec',
    borderRadius: '14px', padding: '18px', marginBottom: '12px',
  }

  return (
    <div>
      <style>{`
        .painel-upload-zone:hover { border-color: #ff33cc !important; background: #fff0fb !important; }
        .painel-fatia:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(255,51,204,0.15); }
        .painel-fatia { transition: transform .15s, box-shadow .15s; }
        .painel-kit-card:hover { border-color: #ffd6f5 !important; }
      `}</style>

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { key: 'meus',      label: 'Minha Biblioteca' },
          { key: 'comunidade', label: 'Comunidade' },
        ].map(aba => (
          <button
            key={aba.key}
            onClick={() => setAbaAtiva(aba.key as 'meus' | 'comunidade')}
            style={{
              flex: 1, padding: '10px 16px',
              background: abaAtiva === aba.key ? '#ff33cc' : '#fff',
              border: `1.5px solid ${abaAtiva === aba.key ? 'transparent' : '#e8e8ec'}`,
              borderRadius: '999px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
              color: abaAtiva === aba.key ? '#fff' : '#6b7280',
              transition: 'all .15s',
            }}
          >
            {aba.label}
            {aba.key === 'comunidade' && !isAssinante && (
              <span style={{ marginLeft: '6px', fontSize: '10px', opacity: 0.8 }}>🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* ── ABA MEUS ── */}
      {abaAtiva === 'meus' && (
        <>
          {/* Orientação */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 3px' }}>
                Orientação das folhas
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                {orientacao === 'paisagem' ? '2 colunas × 3 linhas — folha deitada' : '3 colunas × 2 linhas — folha em pé'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Mini-preview da grade */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                gap: '3px',
                width: orientacao === 'paisagem' ? '60px' : '45px',
                height: orientacao === 'paisagem' ? '45px' : '60px',
                flexShrink: 0,
              }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: '#fff0fb', border: '1.5px solid #ffd6f5', borderRadius: '3px' }} />
                ))}
              </div>
              <OrientacaoToggle value={orientacao} onChange={setOrientacao} />
            </div>
          </div>

          {/* Upload — agora em bloco separado, 100% de largura */}
          <div
            className="painel-upload-zone"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              background: dragOver ? '#fff0fb' : imagem ? '#fff0fb' : '#fafafa',
              border: `2px dashed ${dragOver || imagem ? '#ff33cc' : '#e8e8ec'}`,
              borderRadius: '14px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '28px 20px',
              marginBottom: '12px',
              transition: 'all .2s', boxSizing: 'border-box',
            }}
          >
            {imagem ? (
              <>
                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <NextImage src={imagem.src} fill style={{ objectFit: 'cover' }} alt="Imagem selecionada" unoptimized />
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px solid rgba(255,255,255,0.6)' }} />)}
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 700, margin: 0 }}>
                  ✅ Clique para trocar
                </p>
              </>
            ) : (
              <>
                <span style={{ color: '#d1d5db' }}><IconUpload /></span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>
                    Clique ou arraste a imagem
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>
                    PNG ou JPEG · mín. 3000×3000px
                  </p>
                </div>
              </>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />

          {/* Nome + Descrição */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nome do painel *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Painel Unicórnio" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Descrição (opcional)</label>
              <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Painel floral rosa para mesversário" style={inputStyle} />
            </div>
          </div>

          {/* Preview das fatias */}
          {fatias.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>
                    Preview — Grade {COLS}×{ROWS}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                    Clique em uma fatia para ampliar
                  </p>
                </div>
                <span style={{ background: '#fff0fb', color: '#ff33cc', borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}>
                  6 folhas A4
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px', marginBottom: previewAtivo !== null ? '10px' : '0' }}>
                {fatias.map((fatia, idx) => (
                  <div
                    key={idx} className="painel-fatia"
                    onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)}
                    style={{ position: 'relative', cursor: 'pointer', border: `2px solid ${previewAtivo === idx ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '10px', overflow: 'hidden' }}
                  >
                    <NextImage src={fatia} width={300} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${idx + 1}`} unoptimized />
                    <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: previewAtivo === idx ? '#ff33cc' : 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '2px 7px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {idx + 1}/6
                    </div>
                  </div>
                ))}
              </div>
              {previewAtivo !== null && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e8e8ec' }}>
                  <NextImage src={fatias[previewAtivo]} width={800} height={800} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${previewAtivo + 1} ampliada`} unoptimized />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '8px', margin: 0, borderTop: '1px solid #f3f4f6' }}>
                    Folha {previewAtivo + 1} de 6
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botão gerar PDF */}
          <button
            onClick={gerarPDF}
            disabled={gerando || !nome.trim() || fatias.length === 0}
            style={{
              width: '100%', border: 'none', borderRadius: '999px', padding: '14px',
              background: gerando || !nome.trim() || fatias.length === 0 ? '#f3f4f6' : '#ff33cc',
              color:      gerando || !nome.trim() || fatias.length === 0 ? '#9ca3af' : '#fff',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
              cursor: gerando || !nome.trim() || fatias.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '24px', transition: 'background .2s',
            }}
          >
            <Download size={15} />
            {gerando
              ? 'Gerando PDF...'
              : fatias.length === 0
                ? 'Envie uma imagem primeiro'
                : !nome.trim()
                  ? 'Dê um nome ao painel'
                  : `Gerar PDF — ${orientacao === 'paisagem' ? 'Paisagem' : 'Retrato'}`}
          </button>

          {/* Histórico */}
          {paineis.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>
                  Meus painéis <span style={{ color: '#9ca3af', fontWeight: 400 }}>({paineis.length})</span>
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {paineis.map((painel, idx) => (
                  <div
                    key={painel.id} className="painel-kit-card"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', gap: '12px', borderBottom: idx < paineis.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'border-color .15s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      {painel.imagem_url ? (
                        <div style={{ width: 38, height: 38, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <NextImage src={painel.imagem_url} fill style={{ objectFit: 'cover' }} alt={painel.nome} unoptimized />
                        </div>
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: '8px', background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ImageIcon size={16} style={{ color: '#ff33cc' }} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {painel.nome}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af' }}>
                            {new Date(painel.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                          {painel.tipo && (
                            <span style={{ background: '#f5f0ff', color: '#7700ff', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px' }}>
                              {painel.tipo === '6-retrato' ? 'Retrato' : 'Paisagem'}
                            </span>
                          )}
                          {painel.publicado_comunidade && (
                            <span style={{ background: '#dcfce7', color: '#16a34a', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '999px' }}>
                              Comunidade
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {painel.pdf_url && (
                        <a href={painel.pdf_url} download target="_blank" rel="noreferrer" style={{ width: 32, height: 32, background: '#ff33cc', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff' }}>
                          <Download size={13} />
                        </a>
                      )}
                      {!painel.publicado_comunidade && painel.pdf_url && painel.imagem_url && (
                        <button onClick={() => publicarNaComunidade(painel)} disabled={publicando === painel.id} style={{ width: 32, height: 32, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '999px', color: '#16a34a', cursor: publicando === painel.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={13} />
                        </button>
                      )}
                      <button onClick={() => deletarPainel(painel.id)} style={{ width: 32, height: 32, background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: '999px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ABA COMUNIDADE ── */}
      {abaAtiva === 'comunidade' && (
        <div>
          {!isAssinante && (
            <div style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '14px', padding: '16px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>Download bloqueado no plano gratuito</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Você pode visualizar e publicar. Para baixar, faça upgrade.</p>
              </div>
              <button onClick={() => setModalUpgrade(true)} style={{ background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                Ver planos
              </button>
            </div>
          )}

          {carregandoComunidade ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af' }}>
              Carregando painéis...
            </div>
          ) : paineisComunidade.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', textAlign: 'center', padding: '60px 24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum painel na comunidade ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Seja a primeira a compartilhar!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {paineisComunidade.map(painel => (
                <div key={painel.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', aspectRatio: '1', background: '#f9fafb' }}>
                    <NextImage src={painel.imagem_url} fill style={{ objectFit: 'cover' }} alt={painel.nome} unoptimized />
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: painel.usuario_id === 'encantiva' ? '#ff33cc' : 'rgba(0,0,0,0.55)', borderRadius: '999px', padding: '3px 9px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {painel.usuario_id === 'encantiva' ? 'Encantiva' : 'Comunidade'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 3px' }}>{painel.nome}</p>
                    {painel.descricao && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 10px' }}>{painel.descricao}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>{painel.downloads} downloads</span>
                      <button
                        onClick={() => baixarDaComunidade(painel)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isAssinante ? '#ff33cc' : '#f3f4f6', border: 'none', borderRadius: '999px', padding: '6px 12px', color: isAssinante ? '#fff' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                      >
                        {isAssinante ? <Download size={11} /> : <Lock size={11} />}
                        {isAssinante ? 'Baixar PDF' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Upgrade ── */}
      {modalUpgrade && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setModalUpgrade(false)}
        >
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 36px', maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#111827', margin: 0 }}>Acesse a Comunidade</p>
              <button onClick={() => setModalUpgrade(false)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {['Download ilimitado de painéis da comunidade', 'Acesso a painéis exclusivos da Encantiva', 'Geração ilimitada de painéis personalizados', 'Suporte prioritário'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} style={{ color: '#fff' }} />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151', margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
            <Link href="/planos" style={{ display: 'block', textAlign: 'center', background: '#ff33cc', borderRadius: '999px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
              Ver planos →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}