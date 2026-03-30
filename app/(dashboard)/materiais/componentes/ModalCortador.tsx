'use client'

import { useState, useEffect, useCallback } from 'react'
import NextImage from 'next/image'

const IconX        = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
const IconDownload = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 10V2M4.5 7.5l3 3 3-3"/><path d="M2 12h11"/></svg>

type Orientacao = 'paisagem' | 'retrato'

interface Props {
  titulo: string
  imagemUrl: string
  onClose: () => void
}

export default function ModalCortador({ titulo, imagemUrl, onClose }: Props) {
  const [orientacao, setOrientacao] = useState<Orientacao>('paisagem')
  const [imagem, setImagem]         = useState<HTMLImageElement | null>(null)
  const [fatias, setFatias]         = useState<string[]>([])
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [gerando, setGerando]       = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro]             = useState<string | null>(null)
  const [comMargem, setComMargem]   = useState(true)

  const COLS = orientacao === 'paisagem' ? 2 : 3
  const ROWS = orientacao === 'paisagem' ? 3 : 2

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => { setImagem(img); setCarregando(false) }
    img.onerror = () => { setErro('Nao foi possivel carregar a imagem. Tente baixar o original.'); setCarregando(false) }
    img.src = imagemUrl
  }, [imagemUrl])

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
    if (imagem) cortarImagem(imagem)
  }, [imagem, orientacao, cortarImagem])

  async function comprimirFatia(fatia: string): Promise<string> {
    return new Promise(resolve => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = orientacao === 'paisagem' ? 1240 : 827
        canvas.height = orientacao === 'paisagem' ? 825  : 1169
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const m = comMargem ? 38 : 0
        ctx.drawImage(img, m, m, canvas.width - m * 2, canvas.height - m * 2)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.src = fatia
    })
  }

  async function gerarPDF() {
    if (!imagem || fatias.length === 0) return
    setGerando(true); setErro(null)
    try {
      const fatiasPequenas = await Promise.all(fatias.map(comprimirFatia))
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gerar-painel-pdf`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ fatias: fatiasPequenas, nome: titulo, orientacao }),
        }
      )
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      const result = await response.json()
      if (result.error) throw new Error(result.error)
      const base64Limpo = result.pdf.replace(/[^A-Za-z0-9+/=]/g, '')
      const pdfBytes = Uint8Array.from(atob(base64Limpo), c => c.charCodeAt(0))
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url; a.download = `painel_${titulo.replace(/\s/g, '_')}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setErro(`Erro ao gerar PDF: ${err}`)
    }
    setGerando(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>Cortar painel</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>{titulo}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <IconX />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {carregando && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>Carregando imagem...</p>
            </div>
          )}

          {erro && !gerando && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#dc2626', margin: 0 }}>{erro}</p>
            </div>
          )}

          {!carregando && !erro && imagem && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>Orientacao das folhas</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                    {orientacao === 'paisagem' ? '2 colunas x 3 linhas folha deitada' : '3 colunas x 2 linhas folha em pe'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '999px', padding: '3px' }}>
                  {(['paisagem', 'retrato'] as Orientacao[]).map(op => (
                    <button key={op} onClick={() => setOrientacao(op)}
                      style={{ padding: '6px 14px', borderRadius: '999px', border: 'none', background: orientacao === op ? '#fff' : 'transparent', color: orientacao === op ? '#111827' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: orientacao === op ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s', textTransform: 'capitalize' }}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '2px', width: orientacao === 'paisagem' ? '60px' : '45px', height: orientacao === 'paisagem' ? '45px' : '60px', flexShrink: 0 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ background: '#fff0fb', border: '1.5px solid #ffd6f5', borderRadius: '2px' }} />
                  ))}
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0, flex: 1 }}>
                  Grade {COLS}x{ROWS} 6 folhas A4
                </p>
                <button
                  type="button"
                  onClick={() => setComMargem(!comMargem)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: comMargem ? '#fff0fb' : '#fafafa', border: `1.5px solid ${comMargem ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '999px', padding: '7px 12px', color: comMargem ? '#ff33cc' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
                >
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: comMargem ? '#ff33cc' : '#d1d5db', transition: 'background .15s' }} />
                  {comMargem ? 'Margem ativada' : 'Sem margem'}
                </button>
              </div>

              <div style={{ background: comMargem ? '#fff0fb' : '#f9fafb', border: `1px solid ${comMargem ? '#ffd6f5' : '#e8e8ec'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: comMargem ? '#9333ea' : '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {comMargem
                    ? 'Com margem cada folha tera borda branca de 1cm, painel montado fica maior que 50x50cm'
                    : 'Sem margem imagem preenche a folha inteira, painel montado fica exatamente 50x50cm'}
                </p>
              </div>

              {fatias.length > 0 && (
                <>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 8px' }}>
                    Clique em uma fatia para ampliar
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px', marginBottom: '12px' }}>
                    {fatias.map((fatia, idx) => (
                      <div key={idx}
                        onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)}
                        style={{ position: 'relative', cursor: 'pointer', border: `2px solid ${previewAtivo === idx ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '8px', overflow: 'hidden', transition: 'border-color .15s' }}
                      >
                        <NextImage src={fatia} width={300} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${idx + 1}`} unoptimized />
                        <div style={{ position: 'absolute', bottom: 5, right: 5, background: previewAtivo === idx ? '#ff33cc' : 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                          {idx + 1}/6
                        </div>
                      </div>
                    ))}
                  </div>

                  {previewAtivo !== null && (
                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e8e8ec', marginBottom: '12px' }}>
                      <NextImage src={fatias[previewAtivo]} width={800} height={800} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${previewAtivo + 1}`} unoptimized />
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '8px', margin: 0 }}>
                        Folha {previewAtivo + 1} de 6
                      </p>
                    </div>
                  )}
                </>
              )}

              {erro && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', margin: 0 }}>{erro}</p>
                </div>
              )}

              <button onClick={gerarPDF} disabled={gerando || fatias.length === 0}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: gerando ? '#f3f4f6' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '14px', color: gerando ? '#9ca3af' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: gerando ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
                <IconDownload />
                {gerando ? 'Gerando PDF...' : `Baixar PDF ${orientacao === 'paisagem' ? 'Paisagem' : 'Retrato'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}