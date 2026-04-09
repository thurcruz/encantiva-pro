'use client'

import { useState } from 'react'
import { Lock, Printer } from 'lucide-react'
import type { Material } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import ModalCortador from './ModalCortador'

interface Props {
  material: Material
  podeDownload: boolean
  isExclusivo?: boolean
  limiteDownloads?: number | 'ilimitado'
  downloadsMes?: number
  planoId?: string
}

const IconDownload  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 9V2M3.5 6.5l3 3 3-3"/><path d="M1.5 11h10"/></svg>
const IconScissors  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="3" cy="3" r="1.5"/><circle cx="3" cy="10" r="1.5"/><path d="M4.5 4.5L10.5 10.5M4.5 8.5l6-6"/></svg>
const IconChevDown  = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4l3 3 3-3"/></svg>

export default function CardMaterial({ material, podeDownload, isExclusivo, limiteDownloads, downloadsMes = 0 }: Props) {
  const [baixando, setBaixando] = useState(false)
  const [popupLimite, setPopupLimite] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [modalCortador, setModalCortador] = useState(false)
  const [imagemOriginalUrl, setImagemOriginalUrl] = useState<string | null>(null)
  const supabase = createClient()

  // Extrai o path relativo do arquivo — aceita tanto path relativo quanto URL completa
  function extrairPath(urlOuPath: string): string {
    try {
      const url = new URL(urlOuPath)
      // URL completa do Supabase: .../storage/v1/object/public/materials/PATH
      const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/materials\/(.+)/)
      if (match) return decodeURIComponent(match[1])
    } catch {
      // não é URL — já é um path relativo
    }
    return urlOuPath
  }

  async function baixarOriginal() {
    if (!podeDownload) { setPopupLimite(true); return }
    setBaixando(true)
    setMenuAberto(false)
    try {
      const path = extrairPath(material.url_arquivo)
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(path, 60)
      if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Erro ao gerar link.')
      // Registrar download
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('historico_downloads').insert({ material_id: material.id, usuario_id: user.id })
        await supabase.rpc('incrementar_downloads', { material_id: material.id })
      }
      const response = await fetch(data.signedUrl)
      if (!response.ok) throw new Error('Falha ao baixar o arquivo.')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = material.titulo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      alert('Erro ao baixar o arquivo. Tente novamente.')
      console.error(e)
    } finally {
      setBaixando(false)
    }
  }

  async function abrirCortador() {
    if (!podeDownload) { setPopupLimite(true); return }
    setMenuAberto(false)
    try {
      const path = extrairPath(material.url_arquivo)
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(path, 3600)
      if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Erro ao carregar imagem.')
      setImagemOriginalUrl(data.signedUrl)
      setModalCortador(true)
    } catch (e) {
      alert('Erro ao abrir o cortador. Verifique se o arquivo existe no storage.')
      console.error(e)
    }
  }

  async function imprimir() {
    if (!podeDownload) { setPopupLimite(true); return }
    try {
      const path = extrairPath(material.url_arquivo)
      const { data, error } = await supabase.storage.from('materials').createSignedUrl(path, 60)
      if (error || !data?.signedUrl) throw new Error()
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

        {/* Imagem — usando img nativo para evitar restrições do next/image */}
        <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #fdf0ff, #fff5fd)' }}>
          {material.url_imagem_preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="mat-img"
              src={material.url_imagem_preview}
              alt={material.titulo}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '44px' }}>🎪</span>
            </div>
          )}

          {/* Overlay */}
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
          {isExclusivo && (
            <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(20,0,51,0.85)', backdropFilter: 'blur(4px)', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', padding: '3px 9px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #ff33cc44' }}>
              <Lock size={9} /> Exclusivo
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
                <button className="btn-dl" onClick={() => setMenuAberto(!menuAberto)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '7px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                  <IconDownload />
                  {baixando ? 'Baixando...' : 'Baixar'}
                  <IconChevDown />
                </button>

                {menuAberto && (
                  <div style={{ position: 'absolute', bottom: '42px', right: 0, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 20, minWidth: '200px' }}
                    onMouseLeave={() => setMenuAberto(false)}
                  >
                    <button onClick={baixarOriginal} disabled={baixando}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: baixando ? 'not-allowed' : 'pointer', borderBottom: '1px solid #f3f4f6', textAlign: 'left', opacity: baixando ? 0.6 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '8px', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconDownload />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', margin: 0 }}>{baixando ? 'Baixando...' : 'Baixar original'}</p>
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

      {/* Popup limite de downloads */}
      {popupLimite && (
        <div onClick={() => setPopupLimite(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(6,0,15,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#110022', border: '1px solid rgba(255,51,204,0.25)', borderRadius: '24px', padding: '36px', maxWidth: '420px', width: '100%', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setPopupLimite(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff66' }}>
              <Lock size={14} />
            </button>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📥</div>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff', margin: '0 0 10px' }}>
              Limite de downloads atingido
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66', margin: '0 0 8px', lineHeight: 1.6 }}>
              Você usou {downloadsMes} de {typeof limiteDownloads === 'number' ? limiteDownloads : '∞'} downloads este mês.
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff44', margin: '0 0 24px', lineHeight: 1.6 }}>
              Os limites reiniciam todo dia 1. Faça upgrade para downloads ilimitados.
            </p>
            <a href="/planos"
              style={{ display: 'block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', marginBottom: '10px' }}>
              Ver planos →
            </a>
            <button onClick={() => setPopupLimite(false)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff33', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer', padding: '8px' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {modalCortador && imagemOriginalUrl && (
        <ModalCortador
          titulo={material.titulo}
          imagemUrl={imagemOriginalUrl as string}
          onClose={() => { setModalCortador(false); setImagemOriginalUrl(null) }}
        />
      )}
    </>
  )
}
