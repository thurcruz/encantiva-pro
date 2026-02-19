'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tema, TipoPeca, Formato } from '@/types/database'
import { Upload } from 'lucide-react'

interface Props {
  temas: Tema[]
  tipos: TipoPeca[]
  formatos: Formato[]
}

export default function FormularioMaterial({ temas, tipos, formatos }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [temaId, setTemaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) return setErro('Selecione o arquivo para download.')
    setSalvando(true)
    setErro(null)

    try {
      // Upload do arquivo principal (bucket privado)
      const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/\s/g, '_')}`
      const { error: errArquivo } = await supabase.storage
        .from('materials')
        .upload(nomeArquivo, arquivo)
      if (errArquivo) throw new Error('Erro ao enviar arquivo.')

      // Upload da imagem de preview (bucket público)
      let urlPreview = null
      if (preview) {
        const nomePreview = `${Date.now()}-${preview.name.replace(/\s/g, '_')}`
        const { data: dataPreview, error: errPreview } = await supabase.storage
          .from('previews')
          .upload(nomePreview, preview)
        if (!errPreview && dataPreview) {
          const { data: publicUrl } = supabase.storage
            .from('previews')
            .getPublicUrl(nomePreview)
          urlPreview = publicUrl.publicUrl
        }
      }

      // Salva no banco
      const { error: errDB } = await supabase.from('materiais').insert({
        titulo,
        descricao: descricao || null,
        tema_id: temaId || null,
        tipo_peca_id: tipoId || null,
        formato_id: formatoId || null,
        url_arquivo: nomeArquivo,
        url_imagem_preview: urlPreview,
      })
      if (errDB) throw new Error(`Erro banco: ${errDB.message} | Code: ${errDB.code}`)

      router.push('/admin/materiais')
      router.refresh()
    } catch (err: unknown) {
  const mensagem = err instanceof Error ? err.message : 'Erro inesperado.'
  console.error('Erro completo:', err)
  setErro(mensagem)
} finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-2xl">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input
          type="text"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Ex: Painel Dinossáuro Verde A4"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Descrição opcional do material..."
        />
      </div>

      {/* Seletores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
          <select
            value={temaId}
            onChange={e => setTemaId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Selecionar</option>
            {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de peça</label>
          <select
            value={tipoId}
            onChange={e => setTipoId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Selecionar</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
          <select
            value={formatoId}
            onChange={e => setFormatoId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Selecionar</option>
            {formatos.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Arquivo para download */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Arquivo para download * <span className="text-gray-400 font-normal">(PDF, ZIP, PNG...)</span>
        </label>
        <input
          type="file"
          onChange={e => setArquivo(e.target.files?.[0] ?? null)}
          accept=".pdf,.zip,.png,.jpg,.jpeg"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Imagem de preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagem de preview <span className="text-gray-400 font-normal">(opcional — aparece no card)</span>
        </label>
        <input
          type="file"
          onChange={e => setPreview(e.target.files?.[0] ?? null)}
          accept=".png,.jpg,.jpeg,.webp"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {erro && <p className="text-red-500 text-sm">{erro}</p>}

      <button
        type="submit"
        disabled={salvando}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
      >
        <Upload size={16} />
        {salvando ? 'Enviando...' : 'Salvar material'}
      </button>
    </form>
  )
}