'use client'

import { useState } from 'react'
import { Download, Lock } from 'lucide-react'
import type { Material } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface Props {
  material: Material
  podeDownload: boolean
}

export default function CardMaterial({ material, podeDownload }: Props) {
  const [baixando, setBaixando] = useState(false)
  const supabase = createClient()

  async function handleDownload() {
    if (!podeDownload) return
    setBaixando(true)

    try {
      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(material.url_arquivo, 60)

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

        {material.temas && (
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
            {(material.temas as { nome: string }).nome}
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
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#00000033',
          }}>
            {material.total_downloads} downloads
          </span>

          <button
            onClick={handleDownload}
            disabled={!podeDownload || baixando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: podeDownload
                ? 'linear-gradient(135deg, #ff33cc, #9900ff)'
                : '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              color: podeDownload ? '#fff' : '#00000044',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '13px',
              cursor: podeDownload ? 'pointer' : 'not-allowed',
            }}
          >
            {podeDownload ? (
              <>
                {baixando ? <span style={{ fontSize: '12px' }}>⏳</span> : <Download size={13} />}
                {baixando ? 'Baixando...' : 'Baixar'}
              </>
            ) : (
              <>
                <Lock size={13} />
                Premium
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}