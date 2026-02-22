'use client'

import { useState } from 'react'
import { Download, Lock, Printer, ChevronDown } from 'lucide-react'
import type { Material } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface Props {
  material: Material
  podeDownload: boolean
}

export default function CardMaterial({ material, podeDownload }: Props) {
  const [baixando, setBaixando] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const supabase = createClient()

  async function baixarArquivo(tipo: 'inteiro' | 'cortado') {
    if (!podeDownload) return
    setBaixando(true)
    setMenuAberto(false)

    try {
      const caminho = tipo === 'cortado' && material.url_arquivo_cortado
        ? material.url_arquivo_cortado
        : material.url_arquivo

      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(caminho, 60)

      if (error || !data) throw new Error('Erro ao gerar link.')

      await supabase.from('historico_downloads').upsert({ material_id: material.id })
      await supabase.rpc('incrementar_downloads', { material_id: material.id })

      const response = await fetch(data.signedUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${material.titulo}${tipo === 'cortado' ? ' - Cortado' : ' - Inteiro'}`
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

  async function imprimir() {
    if (!podeDownload) return

    try {
      const caminho = material.url_arquivo_cortado ?? material.url_arquivo
      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(caminho, 60)

      if (error || !data) throw new Error('Erro ao gerar link.')

      window.open(data.signedUrl, '_blank')
    } catch {
      alert('Erro ao abrir arquivo para impressão.')
    }
  }

  const temArquivoCortado = !!material.url_arquivo_cortado

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #eeeeee',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px #00000008',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px #9900ff18'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px #00000008'
      }}
    >
      {/* Preview */}
      <div style={{
        aspectRatio: '1',
        background: 'linear-gradient(135deg, #f5f0ff, #fff0fa)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {material.url_imagem_preview ? (
          <img
            src={material.url_imagem_preview}
            alt={material.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '48px',
          }}>
            🎪
          </div>
        )}

        {/* Badge categoria */}
        {material.categorias && (
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '100px',
          }}>
            {(material.categorias as { nome: string }).nome}
          </span>
        )}

        {/* Badge cortado disponível */}
        {temArquivoCortado && (
          <span style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#ffffff',
            color: '#9900ff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: '10px',
            padding: '3px 8px',
            borderRadius: '100px',
            border: '1px solid #9900ff33',
          }}>
            ✂️ Cortado
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: '14px',
          color: '#140033',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>
          {material.titulo}
        </h3>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {material.tipos_peca && (
            <span style={{
              background: '#f5f0ff',
              color: '#9900ff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '100px',
            }}>
              {(material.tipos_peca as { nome: string }).nome}
            </span>
          )}
          {material.formatos && (
            <span style={{
              background: '#f5f0ff',
              color: '#9900ff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '100px',
            }}>
              {(material.formatos as { nome: string }).nome}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000033' }}>
            {material.total_downloads} downloads
          </span>

          {podeDownload ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>

              {/* Botão imprimir */}
              <button
                onClick={imprimir}
                title="Abrir para impressão"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px',
                  background: '#f5f0ff',
                  border: '1px solid #9900ff22',
                  borderRadius: '8px',
                  color: '#9900ff',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Printer size={14} />
              </button>

              {/* Botão baixar — com dropdown se tiver cortado */}
              {temArquivoCortado ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden' }}>
                    <button
                      onClick={() => baixarArquivo('inteiro')}
                      disabled={baixando}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                        border: 'none',
                        padding: '8px 12px',
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: baixando ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {baixando ? <span>⏳</span> : <Download size={13} />}
                      {baixando ? 'Baixando...' : 'Baixar'}
                    </button>
                    <button
                      onClick={() => setMenuAberto(!menuAberto)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        background: '#cc00ee',
                        border: 'none',
                        borderLeft: '1px solid #ffffff33',
                        padding: '8px 8px',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Dropdown */}
                  {menuAberto && (
                    <div style={{
                      position: 'absolute', bottom: '42px', right: 0,
                      background: '#fff',
                      border: '1px solid #eeeeee',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px #00000018',
                      overflow: 'hidden',
                      zIndex: 10,
                      minWidth: '180px',
                    }}>
                      <button
                        onClick={() => baixarArquivo('inteiro')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '12px 16px',
                          background: 'none', border: 'none',
                          fontFamily: 'Inter, sans-serif', fontSize: '13px',
                          color: '#140033', cursor: 'pointer',
                          textAlign: 'left', fontWeight: 600,
                        }}
                      >
                        🖨️ Inteiro (para gráfica)
                      </button>
                      <div style={{ height: '1px', background: '#f0f0f0' }} />
                      <button
                        onClick={() => baixarArquivo('cortado')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          width: '100%', padding: '12px 16px',
                          background: 'none', border: 'none',
                          fontFamily: 'Inter, sans-serif', fontSize: '13px',
                          color: '#140033', cursor: 'pointer',
                          textAlign: 'left', fontWeight: 600,
                        }}
                      >
                        ✂️ Cortado (impressão caseira)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => baixarArquivo('inteiro')}
                  disabled={baixando}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                    border: 'none', borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, fontSize: '13px',
                    cursor: baixando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {baixando ? <span>⏳</span> : <Download size={13} />}
                  {baixando ? 'Baixando...' : 'Baixar'}
                </button>
              )}
            </div>
          ) : (
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#f0f0f0', border: 'none', borderRadius: '8px',
              padding: '8px 14px', color: '#00000044',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
              cursor: 'not-allowed',
            }}>
              <Lock size={13} />
              Premium
            </button>
          )}
        </div>
      </div>
    </div>
  )
}