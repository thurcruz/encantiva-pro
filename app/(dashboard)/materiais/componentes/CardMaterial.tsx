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
      // Gera URL assinada temporária (60 segundos)
      const { data, error } = await supabase.storage
        .from('materials')
        .createSignedUrl(material.url_arquivo, 60)

      if (error || !data) throw error

      // Registra download
      await supabase.from('historico_downloads').upsert({
        material_id: material.id,
      })

      // Chama função para incrementar contador
      await supabase.rpc('incrementar_downloads', { material_id: material.id })

      // Abre o download
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      alert('Erro ao baixar o arquivo. Tente novamente.')
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
      {/* Preview */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {material.url_imagem_preview ? (
          <img
            src={material.url_imagem_preview}
            alt={material.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-5xl">🎪</span>
          </div>
        )}

        {/* Badge tema */}
        {material.temas && (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
            {material.temas.nome}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight">{material.titulo}</h3>

        <div className="flex gap-2 mt-2 flex-wrap">
          {material.tipos_peca && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {material.tipos_peca.nome}
            </span>
          )}
          {material.formatos && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {material.formatos.nome}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">{material.total_downloads} downloads</span>

          <button
            onClick={handleDownload}
            disabled={!podeDownload || baixando}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${podeDownload
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {podeDownload ? (
              <>
                {baixando ? (
                  <span className="animate-spin text-xs">⏳</span>
                ) : (
                  <Download size={14} />
                )}
                {baixando ? 'Baixando...' : 'Baixar'}
              </>
            ) : (
              <>
                <Lock size={14} />
                Premium
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}