'use client'

import { useState } from 'react'
import { Lock, Printer } from 'lucide-react'
import type { Material } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import ModalCortador from './ModalCortador'
import Image from 'next/image'

interface Props {
  material: Material
  podeDownload: boolean
}

// ── Ícones ───────────────────────────────────────────────
const IconDownload  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 9V2M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg>
const IconScissors  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="3" cy="3" r="1.5"/><circle cx="3" cy="10" r="1.5"/><path d="M4.5 4.5L10.5 10.5M4.5 8.5l6-6"/></svg>
const IconChevDown  = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4l3 3 3-3"/></svg>

export default function CardMaterial({ material, podeDownload }: Props) {
  const [baixando, setBaixando] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [modalCortador, setModalCortador] = useState(false)
  const [imagemOriginalUrl, setImagemOriginalUrl] = useState<string | null>(null)
  const supabase = createClient()

  async function baixarOriginal() {
    if (!podeDownload) return
    setBaixando(true)
    setMenuAberto(false)
    try {
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(material.url_arquivo, 60)
      if (error || !data) throw new Error('Erro ao gerar link.')
      await supabase.from('historico_downloads').upsert({ material_id: material.id })
      await supabase.rpc('incrementar_downloads', { material_id: material.id })
      const response = await fetch(data.signedUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = material.titulo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      alert('Erro ao baixar o arquivo.')
    } finally {
      setBaixando(false)
    }
  }

  async function abrirCortador() {
    if (!podeDownload) return
    setMenuAberto(false)
    try {
      // Busca URL pública ou signed URL da imagem
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(material.url_arquivo, 3600)
      if (error || !data) throw new Error('Erro ao carregar imagem.')
      setImagemOriginalUrl(data.signedUrl)
      setModalCortador(true)
    } catch {
      alert('Erro ao abrir o cortador.')
    }
  }

  async function imprimir() {
    if (!podeDownload) return
    try {
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(material.url_arquivo, 60)
      if (error || !data) throw new Error()
      window.open(data.signedUrl, '_blank')
    } catch {
      alert('Erro ao abrir arquivo.')
    }
  }

  const categoriaNome = (material.categorias as { nome: string } | null)?.nome
  const tipoNome      = (material.tipos_peca as { nome: string } | null)?.nome
  const formatoNome   = (material.formatos as { nome: string } | null)?.nome

  return (
    <>
      <style>{`
        .card-mat { transition: transform .2s cubic-bezier(.34,1.4,.64,1), box-shadow .2s; }
        .card-mat:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(255,51,204,0.12), 0 4px 12px rgba(0,0,0,0.06) !important; }
        .card-mat:hover .mat-overlay { opacity: 1 !important; }
        .card-mat:hover .mat-img { transform: scale(1.04); }
        .mat-img { transition: transform .35s cubic-bezier(.34,1.2,.64,1); }
        .btn-dl:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-dl { transition: opacity .15s, transform .15s; }
      `}</style>

      <div className="card-mat" style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative' }}>

        {/* Imagem */}
        <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #fdf0ff, #fff5fd)' }}>
          {material.url_imagem_preview ? (
            <Image className="mat-img" src={material.url_imagem_preview} alt={material.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '44px' }}>🎪</span>
            </div>
          )}

          {/* Overlay com botão imprimir */}
          <div className="mat-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,0,51,0.7) 0%, rgba(20,0,51,0.1) 60%, transparent 100%)', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'flex-end', padding: '14px', gap: '6px' }}>
            <button onClick={imprimir} title="Abrir para impressão"
              style={{ width: 34, height: 34, borderRadius: '999px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Printer size={14} />
            </button>
          </div>

          {categoriaNome && (
            <span style={{ position: 'absolute', top: 10, left: 10, background: '#ff33cc', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', padding: '3px 9px', borderRadius: '999px', letterSpacing: '0.3px' }}>
              {categoriaNome}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 8px', lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {material.titulo}
          </p>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {tipoNome && <span style={{ background: '#f5f0ff', color: '#7700ff', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>{tipoNome}</span>}
            {formatoNome && <span style={{ background: '#f5f0ff', color: '#7700ff', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>{formatoNome}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
              {material.total_downloads} downloads
            </span>

            {podeDownload ? (
              <div style={{ position: 'relative' }}>
                {/* Botão com dropdown */}
                <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden' }}>
                  <button className="btn-dl" onClick={baixarOriginal} disabled={baixando}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ff33cc', border: 'none', padding: '7px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: baixando ? 'not-allowed' : 'pointer' }}>
                    <IconDownload />
                    {baixando ? '...' : 'Baixar'}
                  </button>
                  <button onClick={() => setMenuAberto(!menuAberto)}
                    style={{ display: 'flex', alignItems: 'center', background: '#e02ab8', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.25)', padding: '7px 8px', color: '#fff', cursor: 'pointer' }}>
                    <IconChevDown />
                  </button>
                </div>

                {menuAberto && (
                  <div style={{ position: 'absolute', bottom: '42px', right: 0, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 20, minWidth: '200px' }}
                    onMouseLeave={() => setMenuAberto(false)}
                  >
                    <button onClick={baixarOriginal}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconDownload />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', margin: 0 }}>Baixar original</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>Arquivo completo para gráfica</p>
                      </div>
                    </button>
                    <button onClick={abrirCortador}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff33cc' }}>
                        <IconScissors />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', margin: 0 }}>Cortar e baixar PDF</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>Para impressão caseira em A4</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f3f4f6', borderRadius: '999px', padding: '6px 12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px' }}>
                <Lock size={11} /> Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal do cortador */}
      {modalCortador && imagemOriginalUrl && (
        <ModalCortador
          titulo={material.titulo}
          imagemUrl={imagemOriginalUrl}
          onClose={() => { setModalCortador(false); setImagemOriginalUrl(null) }}
        />
      )}
    </>
  )
}