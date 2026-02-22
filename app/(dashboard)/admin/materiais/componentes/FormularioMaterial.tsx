'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tema, TipoPeca, Formato, Categoria } from '@/types/database'
import { Upload, FileText, Image } from 'lucide-react'

interface Props {
  temas: Tema[]
  tipos: TipoPeca[]
  formatos: Formato[]
  categorias: Categoria[]
}

export default function FormularioMaterial({ temas, tipos, formatos, categorias }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [temaId, setTemaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoCortado, setArquivoCortado] = useState<File | null>(null)
  const [preview, setPreview] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handlePreviewChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPreview(file)
    if (file) setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) {
      setErro('Selecione o arquivo inteiro para download.')
      return
    }
    setSalvando(true)
    setErro(null)

    try {
      // Upload arquivo inteiro
      const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/\s/g, '_')}`
      const { error: errArquivo } = await supabase.storage
        .from('materials')
        .upload(nomeArquivo, arquivo)
      if (errArquivo) throw new Error('Erro ao enviar arquivo.')

      // Upload arquivo cortado
      let nomeArquivoCortado = null
      if (arquivoCortado) {
        nomeArquivoCortado = `${Date.now()}-cortado-${arquivoCortado.name.replace(/\s/g, '_')}`
        const { error: errCortado } = await supabase.storage
          .from('materials')
          .upload(nomeArquivoCortado, arquivoCortado)
        if (errCortado) throw new Error('Erro ao enviar arquivo cortado.')
      }

      // Upload preview
      let urlPreview = null
      if (preview) {
        const nomePreview = `${Date.now()}-${preview.name.replace(/\s/g, '_')}`
        const { error: errPreview } = await supabase.storage
          .from('previews')
          .upload(nomePreview, preview)
        if (!errPreview) {
          const { data: publicUrl } = supabase.storage.from('previews').getPublicUrl(nomePreview)
          urlPreview = publicUrl.publicUrl
        }
      }

      // Salva no banco
      const { error: errDB } = await supabase.from('materiais').insert({
        titulo,
        descricao: descricao || null,
        tema_id: temaId || null,
        categoria_id: categoriaId || null,
        tipo_peca_id: tipoId || null,
        formato_id: formatoId || null,
        url_arquivo: nomeArquivo,
        url_arquivo_cortado: nomeArquivoCortado,
        url_imagem_preview: urlPreview,
      })
      if (errDB) throw new Error(`Erro banco: ${errDB.message}`)

      router.push('/admin/materiais')
      router.refresh()
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro inesperado.'
      setErro(mensagem)
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#ffffff0d',
    border: '1px solid #ffffff18',
    borderRadius: '12px',
    padding: '14px 18px',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#ffffff55',
    marginBottom: '8px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#ffffff08',
    border: '1px solid #ffffff12',
    borderRadius: '16px',
    padding: '24px',
  }

  function AreaUpload({ arquivo, onChange, accept, label, sublabel }: {
    arquivo: File | null
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    accept: string
    label: string
    sublabel: string
  }) {
    return (
      <div style={{
        background: arquivo ? '#ff33cc08' : '#ffffff05',
        border: `2px dashed ${arquivo ? '#ff33cc55' : '#ffffff18'}`,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
      }}>
        <input
          type="file"
          onChange={onChange}
          accept={accept}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
        <FileText size={24} style={{ color: arquivo ? '#ff33cc' : '#ffffff33', marginBottom: '8px' }} />
        <p style={{ fontFamily: 'Inter, sans-serif', color: arquivo ? '#ff33cc' : '#ffffff55', fontSize: '14px', margin: '0 0 4px 0', fontWeight: 600 }}>
          {arquivo ? arquivo.name : label}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '12px', margin: 0 }}>
          {arquivo ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB` : sublabel}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

        {/* Coluna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Informações básicas */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 20px 0' }}>
              Informações básicas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                  placeholder="Ex: Painel Dinossáuro Verde A4"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                  onBlur={e => e.target.style.borderColor = '#ffffff18'}
                />
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Descrição opcional do material..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                  onBlur={e => e.target.style.borderColor = '#ffffff18'}
                />
              </div>
            </div>
          </div>

          {/* Categorização */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 20px 0' }}>
              Categorização
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipo de peça</label>
                <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {tipos.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Formato</label>
                <select value={formatoId} onChange={e => setFormatoId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {formatos.map(f => <option key={f.id} value={f.id} style={{ background: '#1a0044' }}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tema</label>
                <input
                  type="text"
                  value={temaId}
                  onChange={e => setTemaId(e.target.value)}
                  placeholder="Ex: Dinossáuro Verde"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                  onBlur={e => e.target.style.borderColor = '#ffffff18'}
                />
              </div>
            </div>
          </div>

          {/* Arquivos */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 8px 0' }}>
              Arquivos para download
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff44', margin: '0 0 20px 0' }}>
              O arquivo inteiro é para gráfica. O cortado é para impressão caseira.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Arquivo inteiro (para gráfica) *</label>
                <AreaUpload
                  arquivo={arquivo}
                  onChange={e => setArquivo(e.target.files?.[0] ?? null)}
                  accept=".pdf,.zip,.png,.jpg,.jpeg"
                  label="Clique ou arraste o arquivo aqui"
                  sublabel="PDF, ZIP, PNG, JPG"
                />
              </div>
              <div>
                <label style={labelStyle}>Arquivo cortado (para impressão caseira)</label>
                <AreaUpload
                  arquivo={arquivoCortado}
                  onChange={e => setArquivoCortado(e.target.files?.[0] ?? null)}
                  accept=".pdf,.zip,.png,.jpg,.jpeg"
                  label="Clique ou arraste o arquivo cortado aqui"
                  sublabel="PDF, ZIP, PNG, JPG — opcional"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Preview */}
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 16px 0' }}>
              Imagem de preview
            </h2>

            <div style={{
              aspectRatio: '1',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #9900ff22, #ff33cc11)',
              border: '1px solid #ffffff12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Image size={32} style={{ color: '#ffffff22', marginBottom: '8px' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '12px', margin: 0 }}>Sem preview</p>
                </div>
              )}
            </div>

            <div style={{
              background: preview ? '#ff33cc08' : '#ffffff05',
              border: `2px dashed ${preview ? '#ff33cc55' : '#ffffff18'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}>
              <input
                type="file"
                onChange={handlePreviewChange}
                accept=".png,.jpg,.jpeg,.webp"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
              <Upload size={18} style={{ color: preview ? '#ff33cc' : '#ffffff44', marginBottom: '6px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', color: preview ? '#ff33cc' : '#ffffff55', fontSize: '13px', margin: 0, fontWeight: 600 }}>
                {preview ? 'Trocar imagem' : 'Selecionar imagem'}
              </p>
            </div>
          </div>

          {/* Botão salvar */}
          <div style={cardStyle}>
            {erro && (
              <div style={{
                background: '#ff33cc11',
                border: '1px solid #ff33cc44',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ff33cc',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                marginBottom: '16px',
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: salvando ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '15px',
                cursor: salvando ? 'not-allowed' : 'pointer',
                width: '100%',
              }}
            >
              <Upload size={16} />
              {salvando ? 'Enviando...' : 'Salvar material'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}