'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import Link from 'next/link'
import { Download, Trash2, ImageIcon, Upload, Users, Lock, X, Check } from 'lucide-react'
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

export default function PainelCriador({ usuarioId, paineis: paineisSalvos, isAssinante }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [imagem, setImagem] = useState<HTMLImageElement | null>(null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [gerando, setGerando] = useState(false)
  const [paineis, setPaineis] = useState<Painel[]>(paineisSalvos)
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [fatias, setFatias] = useState<string[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'meus' | 'comunidade'>('meus')
  const [paineisComunidade, setPaineisComunidade] = useState<PainelComunidade[]>([])
  const [carregandoComunidade, setCarregandoComunidade] = useState(false)
  const [modalUpgrade, setModalUpgrade] = useState(false)
  const [publicando, setPublicando] = useState<string | null>(null)
  const [orientacao, setOrientacao] = useState<Orientacao>('paisagem')

  // Paisagem = 2 colunas × 3 linhas | Retrato = 3 colunas × 2 linhas
  const COLS = orientacao === 'paisagem' ? 2 : 3
  const ROWS = orientacao === 'paisagem' ? 3 : 2

  const cortarImagem = useCallback((img: HTMLImageElement) => {
    const novasFatias: string[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const canvas = document.createElement('canvas')
        const larguraFatia = img.naturalWidth / COLS
        const alturaFatia = img.naturalHeight / ROWS
        canvas.width = larguraFatia
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
    const { data } = await supabase.from('paineis_comunidade').select('*').order('downloads', { ascending: false })
    if (data) setPaineisComunidade(data)
    setCarregandoComunidade(false)
  }, [supabase])

  useEffect(() => {
    if (abaAtiva === 'comunidade') carregarComunidade()
  }, [abaAtiva, carregarComunidade])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagemFile(file)
    const img = new window.Image()
    img.onload = () => {
      setImagem(img)
      setFatias([])
      setPreviewAtivo(null)
    }
    img.src = URL.createObjectURL(file)
  }

  async function comprimirFatia(fatia: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Paisagem: fatia larga (1240×825) | Retrato: fatia alta (825×1240) aprox A4
        const largura = orientacao === 'paisagem' ? 1240 : 827
        const altura  = orientacao === 'paisagem' ? 825  : 1169
        canvas.width = largura
        canvas.height = altura
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ fatias: fatiasPequenas, nome, orientacao }),
        }
      )

      if (!response.ok) throw new Error(`Erro ${response.status}: ${await response.text()}`)
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      const base64Limpo = result.pdf.replace(/[^A-Za-z0-9+/=]/g, '')
      const pdfBytes = Uint8Array.from(atob(base64Limpo), c => c.charCodeAt(0))
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

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
      a.href = url
      a.download = `painel_${nome}.pdf`
      a.click()
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

  const cardStyle = { background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '20px' }
  const labelStyle = { display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' as const }
  const inputStyle = { width: '100%', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '12px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      {/* Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'meus', label: '🖼️ Minha Biblioteca' },
          { key: 'comunidade', label: '👥 Comunidade' },
        ].map(aba => (
          <button key={aba.key} onClick={() => setAbaAtiva(aba.key as 'meus' | 'comunidade')} style={{
            flex: 1, padding: '12px 16px',
            background: abaAtiva === aba.key ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff',
            border: `1px solid ${abaAtiva === aba.key ? 'transparent' : '#e5e5e5'}`,
            borderRadius: '12px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
            color: abaAtiva === aba.key ? '#fff' : '#140033',
          }}>
            {aba.label}
            {aba.key === 'comunidade' && !isAssinante && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>🔒 Download</span>}
          </button>
        ))}
      </div>

      {/* ABA: MINHA BIBLIOTECA */}
      {abaAtiva === 'meus' && (
        <>
          {/* Toggle de orientação */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 2px 0' }}>📐 Orientação das folhas</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>
                {orientacao === 'paisagem' ? 'Paisagem — 2 colunas × 3 linhas — folha deitada' : 'Retrato — 3 colunas × 2 linhas — folha em pé'}
              </p>
            </div>
            <OrientacaoToggle value={orientacao} onChange={setOrientacao} />
          </div>

          {/* Cards exemplo + upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Exemplo */}
            <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid #ff33cc22' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Exemplo</p>
              <div style={{ position: 'relative', width: orientacao === 'paisagem' ? '120px' : '80px', height: orientacao === 'paisagem' ? '80px' : '120px' }}>
                <svg viewBox="0 0 120 80" width={orientacao === 'paisagem' ? '120' : '80'} height={orientacao === 'paisagem' ? '80' : '120'}
                  style={{ transform: orientacao === 'retrato' ? 'rotate(90deg)' : 'none' }}>
                  <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff33cc" /><stop offset="100%" stopColor="#9900ff" /></linearGradient></defs>
                  <rect width="120" height="80" fill="url(#grad)" rx="4" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px dashed rgba(255,255,255,0.5)', borderRadius: '2px' }} />)}
                </div>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9900ff', fontWeight: 600, margin: 0, textAlign: 'center' }}>
                Grade {COLS}×{ROWS} — 6 folhas A4
              </p>
            </div>

            {/* Upload */}
            <div onClick={() => inputRef.current?.click()} style={{
              ...cardStyle, marginBottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '12px', cursor: 'pointer', minHeight: '200px',
              border: `2px dashed ${imagem ? '#ff33cc55' : '#e5e5e5'}`,
              background: imagem ? '#fff5fd' : '#fafafa', transition: 'all 0.2s',
            }}>
              {imagem ? (
                <>
                  <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
                    <NextImage src={imagem.src} fill style={{ objectFit: 'cover' }} alt="Imagem selecionada" unoptimized />
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
                      {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px solid rgba(255,255,255,0.6)' }} />)}
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 600, margin: 0 }}>✅ Clique para trocar</p>
                </>
              ) : (
                <>
                  <ImageIcon size={32} style={{ color: '#00000022' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000044', margin: 0, textAlign: 'center' }}>Clique para fazer upload</p>
                </>
              )}
            </div>
          </div>

          {/* Dica */}
          <div style={{ background: '#f5f0ff', border: '1px solid #9900ff22', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9900ff', margin: 0 }}>
              Use imagens <strong>PNG ou JPEG</strong> de no mínimo <strong>3000×3000px</strong> para melhor qualidade.
            </p>
          </div>

          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />

          {/* Config */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>⚙️ Configurar painel</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome do painel</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Painel Unicórnio" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descrição (opcional)</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Painel floral rosa para mesversário" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Preview */}
          {fatias.length > 0 && (
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
                🔍 Preview — Grade {COLS}×{ROWS}
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>Clique em uma fatia para ampliar</p>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px', marginBottom: '16px' }}>
                {fatias.map((fatia, idx) => (
                  <div key={idx} onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)} style={{
                    position: 'relative', cursor: 'pointer',
                    border: `2px solid ${previewAtivo === idx ? '#ff33cc' : 'transparent'}`,
                    borderRadius: '8px', overflow: 'hidden',
                  }}>
                    <NextImage src={fatia} width={300} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${idx + 1}`} unoptimized />
                    <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {idx + 1}/6
                    </div>
                  </div>
                ))}
              </div>

              {previewAtivo !== null && (
                <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #ff33cc33' }}>
                  <NextImage src={fatias[previewAtivo]} width={800} height={800} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${previewAtivo + 1} ampliada`} unoptimized />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', textAlign: 'center', padding: '8px', margin: 0 }}>
                    Folha {previewAtivo + 1} de 6
                  </p>
                </div>
              )}

              <button onClick={gerarPDF} disabled={gerando || !nome.trim()} style={{
                width: '100%',
                background: gerando || !nome.trim() ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: '14px', padding: '16px',
                color: gerando || !nome.trim() ? '#00000033' : '#fff',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: gerando || !nome.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: gerando || !nome.trim() ? 'none' : '0 8px 32px rgba(255,51,204,0.3)',
              }}>
                <Download size={16} />
                {gerando ? 'Gerando PDF...' : !nome.trim() ? 'Dê um nome ao painel' : `Gerar PDF — ${orientacao === 'paisagem' ? '🖼️ Paisagem' : '📄 Retrato'}`}
              </button>
            </div>
          )}

          {/* Histórico */}
          {paineis.length > 0 && (
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>📁 Meus painéis</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paineis.map(painel => (
                  <div key={painel.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9f9f9', borderRadius: '12px', padding: '14px 16px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {painel.imagem_url ? (
                        <NextImage src={painel.imagem_url} width={40} height={40} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} alt={painel.nome} unoptimized />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={16} style={{ color: '#9900ff' }} />
                        </div>
                      )}
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px 0' }}>{painel.nome}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                            {new Date(painel.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                          {painel.tipo && (
                            <span style={{ background: '#f5f0ff', color: '#9900ff', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px' }}>
                              {painel.tipo === '6-retrato' ? '📄 Retrato' : '🖼️ Paisagem'}
                            </span>
                          )}
                          {painel.publicado_comunidade && (
                            <span style={{ background: '#e8f5e9', color: '#2e7d32', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px' }}>✅ Comunidade</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {painel.pdf_url && (
                        <a href={painel.pdf_url} download target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '8px', padding: '7px 10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', textDecoration: 'none' }}>
                          <Download size={12} />
                        </a>
                      )}
                      {!painel.publicado_comunidade && painel.pdf_url && painel.imagem_url && (
                        <button onClick={() => publicarNaComunidade(painel)} disabled={publicando === painel.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: publicando === painel.id ? '#f0f0f0' : '#f0fff4', border: '1px solid #00aa5533', borderRadius: '8px', padding: '7px 10px', color: '#00aa55', cursor: publicando === painel.id ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px' }}>
                          <Users size={12} />
                          {publicando === painel.id ? '...' : 'Compartilhar'}
                        </button>
                      )}
                      <button onClick={() => deletarPainel(painel.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '8px', color: '#ff33cc', cursor: 'pointer' }}>
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

      {/* ABA: COMUNIDADE */}
      {abaAtiva === 'comunidade' && (
        <div>
          {!isAssinante && (
            <div style={{ background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid #9900ff22', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={20} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 4px 0' }}>Download bloqueado no plano gratuito</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>Você pode visualizar e publicar painéis. Para baixar, faça upgrade.</p>
              </div>
              <button onClick={() => setModalUpgrade(true)} style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ver planos
              </button>
            </div>
          )}

          {carregandoComunidade ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Inter, sans-serif', color: '#00000044' }}>Carregando painéis...</div>
          ) : paineisComunidade.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '32px', margin: '0 0 12px 0' }}>🖼️</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>Nenhum painel na comunidade ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>Seja o primeiro a compartilhar um painel!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {paineisComunidade.map(painel => (
                <div key={painel.id} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', aspectRatio: '1', background: '#f9f9f9' }}>
                    <NextImage src={painel.imagem_url} fill style={{ objectFit: 'cover' }} alt={painel.nome} unoptimized />
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: painel.usuario_id === 'encantiva' ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {painel.usuario_id === 'encantiva' ? '✨ Encantiva' : '👥 Comunidade'}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 4px 0' }}>{painel.nome}</p>
                    {painel.descricao && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 10px 0' }}>{painel.descricao}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044' }}>⬇️ {painel.downloads} downloads</span>
                      <button onClick={() => baixarDaComunidade(painel)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isAssinante ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 12px', color: isAssinante ? '#fff' : '#00000044', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                        {isAssinante ? <Download size={12} /> : <Lock size={12} />}
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

      {/* Modal Upgrade */}
      {modalUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '420px', width: '100%', position: 'relative' }}>
            <button onClick={() => setModalUpgrade(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Upload size={24} style={{ color: '#fff' }} />
              </div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 8px 0' }}>Acesse a Comunidade</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>Faça upgrade para baixar todos os painéis compartilhados.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {['Download ilimitado de painéis da comunidade', 'Acesso a painéis exclusivos da Encantiva', 'Geração ilimitada de painéis personalizados', 'Suporte prioritário'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} style={{ color: '#fff' }} />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
            <Link href="/planos" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '14px', padding: '16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,51,204,0.3)' }}>
              Ver planos →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}