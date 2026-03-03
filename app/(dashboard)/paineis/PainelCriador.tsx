'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Download, Trash2, ImageIcon } from 'lucide-react'

interface Painel {
  id: string
  nome: string
  tipo: string
  imagem_url: string | null
  pdf_url: string | null
  criado_em: string
}

interface Props {
  usuarioId: string
  paineis: Painel[]
}

export default function PainelCriador({ usuarioId, paineis: paineisSalvos }: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [imagem, setImagem] = useState<HTMLImageElement | null>(null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState<'6' | '9'>('6')
  const [nome, setNome] = useState('')
  const [gerando, setGerando] = useState(false)
  const [paineis, setPaineis] = useState<Painel[]>(paineisSalvos)
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [fatias, setFatias] = useState<string[]>([])

  

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

 const cortarImagem = useCallback((img: HTMLImageElement) => {
  const cols = tipo === '6' ? 3 : 3
  const rows = tipo === '6' ? 2 : 3
  const novasFatias: string[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const canvas = document.createElement('canvas')
      const larguraFatia = img.width / cols
      const alturaFatia = img.height / rows
      canvas.width = larguraFatia
      canvas.height = alturaFatia
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, col * larguraFatia, row * alturaFatia, larguraFatia, alturaFatia, 0, 0, larguraFatia, alturaFatia)
      novasFatias.push(canvas.toDataURL('image/jpeg', 0.95))
    }
  }
  setFatias(novasFatias)
}, [tipo])

useEffect(() => {
  if (!imagem) return
  cortarImagem(imagem)
}, [imagem, tipo, cortarImagem])

  async function gerarPDF() {
    if (!imagem || fatias.length === 0) return
    if (!nome.trim()) return alert('Dê um nome ao painel antes de gerar.')
    setGerando(true)

    try {
      // Chama Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gerar-painel-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ fatias, tipo, nome }),
        }
      )

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      // Converte base64 para blob
      const pdfBytes = Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

      // Upload da imagem original
      let imagemUrl = null
      if (imagemFile) {
        const { data: imgData } = await supabase.storage
          .from('paineis')
          .upload(`${usuarioId}/${Date.now()}_original.jpg`, imagemFile, { upsert: true })
        if (imgData) {
          const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(imgData.path)
          imagemUrl = urlData.publicUrl
        }
      }

      // Upload do PDF
      const pdfPath = `${usuarioId}/${Date.now()}_${nome}.pdf`
      const { data: pdfData } = await supabase.storage
        .from('paineis')
        .upload(pdfPath, pdfBlob, { upsert: true })

      let pdfUrl = null
      if (pdfData) {
        const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(pdfData.path)
        pdfUrl = urlData.publicUrl
      }

      // Salva no banco
      const { data: novoPainel } = await supabase.from('paineis').insert({
        usuario_id: usuarioId,
        nome,
        tipo,
        imagem_url: imagemUrl,
        pdf_url: pdfUrl,
      }).select().single()

      if (novoPainel) setPaineis(prev => [novoPainel, ...prev])

      // Download automático
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

  async function deletarPainel(id: string) {
    await supabase.from('paineis').delete().eq('id', id)
    setPaineis(prev => prev.filter(p => p.id !== id))
  }

  const cardStyle = {
    background: '#fff', border: '1px solid #eeeeee',
    borderRadius: '16px', padding: '24px', marginBottom: '20px',
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  }

  const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '12px', padding: '12px 16px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div>

      {/* Upload e configuração */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          🖼️ Configurar painel
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome do painel</label>
            <input
              type="text" value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Painel Unicórnio"
              style={inputStyle}
            />
          </div>

          {/* Tipo */}
          <div>
            <label style={labelStyle}>Número de folhas</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['6', '9'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTipo(t)} style={{
                  flex: 1, padding: '14px',
                  background: tipo === t ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f9f9f9',
                  border: `1px solid ${tipo === t ? 'transparent' : '#e5e5e5'}`,
                  borderRadius: '12px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: '14px', color: tipo === t ? '#fff' : '#140033',
                  transition: 'all 0.2s',
                }}>
                  {t === '6' ? '6 folhas (paisagem)' : '9 folhas (vertical)'}
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, opacity: 0.8, marginTop: '2px' }}>
                    {t === '6' ? 'Grade 3×2' : 'Grade 3×3'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div>
            <label style={labelStyle}>Imagem do painel</label>
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${imagem ? '#ff33cc55' : '#e5e5e5'}`,
                borderRadius: '16px', padding: '32px',
                textAlign: 'center', cursor: 'pointer',
                background: imagem ? '#fff5fd' : '#fafafa',
                transition: 'all 0.2s',
              }}
            >
              {imagem ? (
                <div>
                 <NextImage
  src={imagem.src}
  width={200}
  height={200}
  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', marginBottom: '8px', objectFit: 'contain' }}
  alt="Preview"
  unoptimized
/>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 600, margin: 0 }}>
                    ✅ Imagem carregada — clique para trocar
                  </p>
                </div>
              ) : (
                <div>
                  <ImageIcon size={32} style={{ color: '#00000022', marginBottom: '8px' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', margin: '0 0 4px 0' }}>
                    Clique para fazer upload
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000033', margin: 0 }}>
                    JPG, PNG — recomendado 2000×2000px ou maior
                  </p>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* Preview das fatias */}
      {fatias.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
            🔍 Preview — {tipo === '6' ? 'Grade 3×2' : 'Grade 3×3'}
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
            Clique em uma fatia para ampliar
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            marginBottom: '16px',
          }}>
            {fatias.map((fatia, idx) => (
              <div key={idx} onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)} style={{
                position: 'relative', cursor: 'pointer',
                border: `2px solid ${previewAtivo === idx ? '#ff33cc' : 'transparent'}`,
                borderRadius: '8px', overflow: 'hidden',
              }}>
                <NextImage
  src={fatia}
  width={300}
  height={300}
  style={{ width: '100%', height: 'auto', display: 'block' }}
  alt={`Fatia ${idx + 1}`}
  unoptimized
/>
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  background: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                  padding: '2px 6px', fontFamily: 'Inter, sans-serif',
                  fontSize: '10px', fontWeight: 700, color: '#fff',
                }}>
                  {idx + 1}/{fatias.length}
                </div>
              </div>
            ))}
          </div>

          {/* Fatia ampliada */}
          {previewAtivo !== null && (
            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #ff33cc33' }}>
              <NextImage
  src={fatias[previewAtivo]}
  width={800}
  height={600}
  style={{ width: '100%', height: 'auto', display: 'block' }}
  alt={`Fatia ${previewAtivo + 1} ampliada`}
  unoptimized
/>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', textAlign: 'center', padding: '8px', margin: 0 }}>
                Folha {previewAtivo + 1} de {fatias.length}
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
            {gerando ? 'Gerando PDF...' : !nome.trim() ? 'Dê um nome ao painel' : 'Gerar e baixar PDF'}
          </button>
        </div>
      )}

      {/* Histórico */}
      {paineis.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>
            📁 Painéis gerados
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {paineis.map(painel => (
              <div key={painel.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f9f9f9', borderRadius: '12px', padding: '14px 16px', gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {painel.imagem_url ? (
                   <NextImage
  src={painel.imagem_url}
  width={40}
  height={40}
  style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
  alt={painel.nome}
  unoptimized
/>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={16} style={{ color: '#9900ff' }} />
                    </div>
                  )}
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px 0' }}>
                      {painel.nome}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                      {painel.tipo} folhas · {new Date(painel.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {painel.pdf_url && (
                    <a href={painel.pdf_url} download target="_blank" rel="noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                      borderRadius: '8px', padding: '8px 12px',
                      color: '#fff', fontFamily: 'Inter, sans-serif',
                      fontWeight: 600, fontSize: '12px', textDecoration: 'none',
                    }}>
                      <Download size={12} /> PDF
                    </a>
                  )}
                  <button onClick={() => deletarPainel(painel.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px', background: '#fff5fd',
                    border: '1px solid #ff33cc33', borderRadius: '8px',
                    color: '#ff33cc', cursor: 'pointer',
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}