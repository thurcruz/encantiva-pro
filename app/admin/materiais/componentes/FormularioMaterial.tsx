'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TipoPeca, Formato, Categoria } from '@/types/database'
import { Upload, ImageIcon } from 'lucide-react'

interface Props {
  tipos: TipoPeca[]
  formatos: Formato[]
  categorias: Categoria[]
}

const TAGS_DISPONIVEIS = [
  'Anime', 'Super-heróis', 'Princesas', 'Disney', 'Jogos',
  'Filmes', 'Séries', 'Infantil', 'Floral', 'Safari',
  'Fazendinha', 'Circo', 'Astronauta', 'Dinossauro', 'Sereia',
  'Unicórnio', 'Religioso', 'Esportes', 'Música', 'Neutro',
]

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
  borderRadius: '12px', padding: '12px 16px', color: '#fff',
  fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#ffffff55', marginBottom: '6px',
  letterSpacing: '1px', textTransform: 'uppercase',
}
const card: React.CSSProperties = {
  background: '#ffffff08', border: '1px solid #ffffff12',
  borderRadius: '16px', padding: '24px', marginBottom: '16px',
}

export default function FormularioMaterial({ tipos, formatos, categorias }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Campos básicos
  const [codigo, setCodigo] = useState('')
  const [colecao, setColecao] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [exclusivo, setExclusivo] = useState(false)

  // Arquivo
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])
  }

  // Extrai preview automaticamente do arquivo PNG/JPG
  function extrairPreview(file: File): Promise<string | null> {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) { resolve(null); return }
      const reader = new FileReader()
      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = canvasRef.current
          if (!canvas) { resolve(null); return }
          const size = 800
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')!
          // Crop centralizado quadrado
          const menor = Math.min(img.width, img.height)
          const sx = (img.width - menor) / 2
          const sy = (img.height - menor) / 2
          ctx.drawImage(img, sx, sy, menor, menor, 0, 0, size, size)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setArquivo(file)
    setPreviewUrl(null)
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Gera código sugerido a partir da coleção
  function gerarCodigo(col: string, num: string) {
    const prefixo = col.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
    const n = num.padStart(2, '0')
    return prefixo + n
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) { setErro('Selecione o arquivo do painel.'); return }
    if (!codigo.trim()) { setErro('Informe o código do material.'); return }
    setSalvando(true); setErro(null)

    try {
      // 1. Upload do arquivo principal
      setProgresso('Enviando arquivo...')
      const nomeArquivo = `${codigo.trim()}-${Date.now()}.${arquivo.name.split('.').pop()}`
      const { error: errArquivo } = await supabase.storage.from('materials').upload(nomeArquivo, arquivo)
      if (errArquivo) throw new Error('Erro ao enviar arquivo: ' + errArquivo.message)

      // 2. Extrai e faz upload do preview automaticamente
      let urlPreview: string | null = null
      if (arquivo.type.startsWith('image/')) {
        setProgresso('Gerando preview...')
        const previewBase64 = await extrairPreview(arquivo)
        if (previewBase64) {
          const blob = await (await fetch(previewBase64)).blob()
          const nomePreview = `preview-${codigo.trim()}-${Date.now()}.jpg`
          const { error: errPreview } = await supabase.storage.from('previews').upload(nomePreview, blob, { contentType: 'image/jpeg' })
          if (!errPreview) {
            const { data: pub } = supabase.storage.from('previews').getPublicUrl(nomePreview)
            urlPreview = pub.publicUrl
          }
        }
      }

      // 3. Salva no banco
      setProgresso('Salvando no banco...')
      const { error: errDB } = await supabase.from('materiais').insert({
        titulo: titulo.trim() || codigo.trim(),
        descricao: descricao || null,
        codigo: codigo.trim(),
        colecao: colecao.trim() || null,
        tags,
        categoria_id: categoriaId || null,
        tipo_peca_id: tipoId || null,
        formato_id: formatoId || null,
        url_arquivo: nomeArquivo,
        url_arquivo_cortado: null,
        url_imagem_preview: urlPreview,
        exclusivo,
        ativo: true,
      })
      if (errDB) throw new Error(`Erro banco: ${errDB.message}`)

      router.push('/admin/materiais')
      router.refresh()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSalvando(false)
      setProgresso('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Canvas oculto para extração de preview */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* ── Coluna principal ── */}
        <div>

          {/* Identificação */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>Identificação</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={lbl}>Coleção (tema)</label>
                <input style={inputStyle} placeholder="Ex: Moana, Homem-Aranha..." value={colecao}
                  onChange={e => {
                    setColecao(e.target.value)
                    if (!codigo) setCodigo(gerarCodigo(e.target.value, '01'))
                  }} />
              </div>
              <div>
                <label style={lbl}>Código *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: '2px' }}
                    placeholder="Ex: MOA01" value={codigo}
                    onChange={e => setCodigo(e.target.value.toUpperCase())} />
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff33', margin: '4px 0 0' }}>
                  3 letras + 2 números. Ex: MOA01, MOA02
                </p>
              </div>
            </div>
            <div>
              <label style={lbl}>Título (opcional — usa o código se vazio)</label>
              <input style={inputStyle} placeholder="Ex: Painel Moana Fundo do Mar" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
          </div>

          {/* Tags */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 6px' }}>Tags de gênero</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: '0 0 14px' }}>Selecione todas que se aplicam — usadas nos filtros de busca</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TAGS_DISPONIVEIS.map(tag => {
                const sel = tags.includes(tag)
                return (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    style={{ padding: '5px 12px', borderRadius: '999px', border: `1.5px solid ${sel ? '#ff33cc' : '#ffffff20'}`, background: sel ? '#ff33cc22' : 'transparent', color: sel ? '#ff33cc' : '#ffffff66', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all .12s' }}>
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categorização */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>Categorização</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Categoria</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de peça</label>
                <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {tipos.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Formato</label>
                <select value={formatoId} onChange={e => setFormatoId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {formatos.map(f => <option key={f.id} value={f.id} style={{ background: '#1a0044' }}>{f.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>Descrição</h2>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
              placeholder="Descrição opcional do material..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Arquivo */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 4px' }}>Arquivo do painel *</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: '0 0 16px' }}>
              PNG ou JPG — o preview será gerado automaticamente a partir da imagem
            </p>
            <div style={{ background: arquivo ? '#ff33cc08' : '#ffffff05', border: `2px dashed ${arquivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
              <input type="file" onChange={handleArquivoChange} accept=".png,.jpg,.jpeg,.pdf,.zip"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <Upload size={24} style={{ color: arquivo ? '#ff33cc' : '#ffffff33', marginBottom: '8px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', color: arquivo ? '#ff33cc' : '#ffffff55', fontSize: '14px', margin: '0 0 4px', fontWeight: 600 }}>
                {arquivo ? arquivo.name : 'Clique ou arraste o arquivo aqui'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '12px', margin: 0 }}>
                {arquivo ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB` : 'PNG ou JPG recomendado — mínimo 3000×3000px'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Coluna lateral ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Preview auto */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 12px' }}>Preview</h2>
            <div style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(135deg, #9900ff22, #ff33cc11)', border: '1px solid #ffffff12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <ImageIcon size={28} style={{ color: '#ffffff22', marginBottom: '8px' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                    Gerado automaticamente ao selecionar um PNG ou JPG
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acesso */}
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 12px' }}>Acesso</h2>
            <button type="button" onClick={() => setExclusivo(!exclusivo)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: exclusivo ? '#ff33cc15' : '#ffffff08', border: `1.5px solid ${exclusivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: exclusivo ? '#ff33cc' : '#ffffff88', margin: '0 0 2px' }}>
                  {exclusivo ? 'Exclusivo (planos pagos)' : 'Gratuito (todos)'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', margin: 0 }}>
                  {exclusivo ? 'Free vê bloqueado, pagos têm acesso' : 'Disponível para todos os planos'}
                </p>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: '999px', background: exclusivo ? '#ff33cc' : '#ffffff18', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: exclusivo ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </button>
          </div>

          {/* Erros e botão */}
          <div style={card}>
            {erro && (
              <div style={{ background: '#ff33cc11', border: '1px solid #ff33cc44', borderRadius: '10px', padding: '10px 14px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '12px', marginBottom: '12px' }}>
                {erro}
              </div>
            )}
            {progresso && (
              <div style={{ background: '#ffffff08', borderRadius: '10px', padding: '10px 14px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                {progresso}
              </div>
            )}
            <button type="submit" disabled={salvando}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: salvando ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer', width: '100%' }}>
              <Upload size={15} />
              {salvando ? 'Enviando...' : 'Salvar material'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}