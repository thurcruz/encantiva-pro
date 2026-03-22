'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Save, ImageIcon, Plus } from 'lucide-react'

interface Tema      { id: string; nome: string }
interface Categoria { id: string; nome: string }
interface TipoPeca  { id: string; nome: string }
interface Formato   { id: string; nome: string }
interface Material  {
  id: string
  titulo: string
  descricao?: string | null
  codigo?: string | null
  tema_id?: string | null
  categoria_id?: string | null
  tipo_peca_id?: string | null
  formato_id?: string | null
  tags?: string[] | null
  exclusivo?: boolean | null
  url_arquivo: string
  url_imagem_preview?: string | null
}

interface Props {
  material:   Material
  temas:      Tema[]
  categorias: Categoria[]
  tipos:      TipoPeca[]
  formatos:   Formato[]
}

const TAGS_DISPONIVEIS = [
  'Anime', 'Super-herois', 'Princesas', 'Disney', 'Jogos',
  'Filmes', 'Series', 'Infantil', 'Floral', 'Safari',
  'Fazendinha', 'Circo', 'Astronauta', 'Dinossauro', 'Sereia',
  'Unicornio', 'Religioso', 'Esportes', 'Musica', 'Neutro',
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

function gerarSlug(nome: string) {
  return nome.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function FormularioEditar({ material, temas, categorias, tipos, formatos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [titulo, setTitulo] = useState(material.titulo)
  const [descricao, setDescricao] = useState(material.descricao ?? '')
  const [codigo, setCodigo] = useState(material.codigo ?? '')
  const [temaId, setTemaId] = useState(material.tema_id ?? '')
  const [categoriaId, setCategoriaId] = useState(material.categoria_id ?? '')
  const [tipoId, setTipoId] = useState(material.tipo_peca_id ?? '')
  const [formatoId, setFormatoId] = useState(material.formato_id ?? '')
  const [tags, setTags] = useState<string[]>(material.tags ?? [])
  const [exclusivo, setExclusivo] = useState(material.exclusivo ?? false)

  const [novoTema, setNovoTema] = useState('')
  const [criandoTema, setCriandoTema] = useState(false)
  const [temasLista, setTemasLista] = useState<Tema[]>(temas)

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [novoPreview, setNovoPreview] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(material.url_imagem_preview ?? null)
  const [salvando, setSalvando] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  function toggleTag(tag: string) {
    setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])
  }

  async function criarTema() {
    if (!novoTema.trim()) return
    setCriandoTema(true)
    const slug = gerarSlug(novoTema)
    const { data, error } = await supabase
      .from('temas')
      .insert({ nome: novoTema.trim(), slug, ativo: true })
      .select()
      .single()
    if (!error && data) {
      const novo = data as Tema
      setTemasLista(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setTemaId(novo.id)
      setNovoTema('')
    } else if (error) {
      console.error('Erro ao criar tema:', error.message)
    }
    setCriandoTema(false)
  }

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
          canvas.width = size; canvas.height = size
          const ctx = canvas.getContext('2d')!
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
    if (file && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true); setErro(null); setSucesso(false)

    try {
      let urlArquivo = material.url_arquivo
      let urlPreview = material.url_imagem_preview ?? null

      if (arquivo) {
        setProgresso('Enviando arquivo...')
        const nomeArquivo = `${codigo.trim() || 'edit'}-${Date.now()}.${arquivo.name.split('.').pop()}`
        const { error: errArq } = await supabase.storage.from('materials').upload(nomeArquivo, arquivo)
        if (errArq) throw new Error('Erro ao enviar arquivo.')
        urlArquivo = nomeArquivo
      }

      if (novoPreview) {
        setProgresso('Enviando preview...')
        const nomePreview = `preview-${Date.now()}.jpg`
        const { error: errPrev } = await supabase.storage.from('previews').upload(nomePreview, novoPreview, { contentType: 'image/jpeg' })
        if (!errPrev) {
          const { data: pub } = supabase.storage.from('previews').getPublicUrl(nomePreview)
          urlPreview = pub.publicUrl
        }
      }

      if (arquivo && arquivo.type.startsWith('image/') && !novoPreview) {
        setProgresso('Gerando preview...')
        const base64 = await extrairPreview(arquivo)
        if (base64) {
          const blob = await (await fetch(base64)).blob()
          const nomePreview = `preview-${codigo.trim() || 'edit'}-${Date.now()}.jpg`
          const { error: errPrev } = await supabase.storage.from('previews').upload(nomePreview, blob, { contentType: 'image/jpeg' })
          if (!errPrev) {
            const { data: pub } = supabase.storage.from('previews').getPublicUrl(nomePreview)
            urlPreview = pub.publicUrl
          }
        }
      }

      setProgresso('Salvando...')
      const { error: errDB } = await supabase
        .from('materiais')
        .update({
          titulo,
          descricao:           descricao || null,
          codigo:              codigo || null,
          colecao:             temasLista.find(t => t.id === temaId)?.nome ?? null,
          tema_id:             temaId || null,
          categoria_id:        categoriaId || null,
          tipo_peca_id:        tipoId || null,
          formato_id:          formatoId || null,
          tags,
          exclusivo,
          url_arquivo:         urlArquivo,
          url_imagem_preview:  urlPreview,
        })
        .eq('id', material.id)

      if (errDB) throw new Error(`Erro banco: ${errDB.message}`)

      setSucesso(true)
      setTimeout(() => { router.push('/admin/materiais'); router.refresh() }, 1000)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSalvando(false)
      setProgresso('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        <div>
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>Identificacao</h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Colecao</label>
              <select value={temaId} onChange={e => setTemaId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: '#1a0044' }}>Selecionar colecao...</option>
                {temasLista.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  value={novoTema}
                  onChange={e => setNovoTema(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), criarTema())}
                  placeholder="Nova colecao..."
                  style={{ ...inputStyle, flex: 1, fontSize: '13px', padding: '9px 14px' }}
                />
                <button type="button" onClick={criarTema} disabled={criandoTema || !novoTema.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: novoTema.trim() ? '#ff33cc' : '#ffffff18', border: 'none', borderRadius: '10px', padding: '9px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: novoTema.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                  <Plus size={13} />
                  {criandoTema ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Codigo</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '2px' }}
                  placeholder="Ex: MOA01" value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label style={lbl}>Titulo *</label>
                <input style={inputStyle} value={titulo} onChange={e => setTitulo(e.target.value)} required />
              </div>
            </div>
          </div>

          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 16px' }}>Categorizacao</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={lbl}>Ocasiao</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de peca</label>
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

          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 6px' }}>Tags de tema</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: '0 0 14px' }}>Selecione todas que se aplicam</p>
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

          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 12px' }}>Descricao</h2>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
              placeholder="Descricao opcional..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 4px' }}>Arquivo do painel</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: '0 0 16px' }}>
              Atual: <span style={{ fontFamily: 'monospace', color: '#ffffff55' }}>{material.url_arquivo}</span>
            </p>
            <div style={{ background: arquivo ? '#ff33cc08' : '#ffffff05', border: `2px dashed ${arquivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
              <input type="file" onChange={handleArquivoChange} accept=".png,.jpg,.jpeg,.pdf,.zip"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <Upload size={22} style={{ color: arquivo ? '#ff33cc' : '#ffffff33', marginBottom: '8px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', color: arquivo ? '#ff33cc' : '#ffffff55', fontSize: '14px', margin: '0 0 4px', fontWeight: 600 }}>
                {arquivo ? arquivo.name : 'Clique para trocar o arquivo'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '12px', margin: 0 }}>
                {arquivo ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB` : 'PNG, JPG, PDF ou ZIP'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 12px' }}>Preview</h2>
            <div style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', background: 'linear-gradient(135deg, #9900ff22, #ff33cc11)', border: '1px solid #ffffff12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <ImageIcon size={28} style={{ color: '#ffffff22', marginBottom: '8px' }} />
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '11px', margin: 0 }}>Sem preview</p>
                </div>
              )}
            </div>
            <div style={{ background: novoPreview ? '#ff33cc08' : '#ffffff05', border: `2px dashed ${novoPreview ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '14px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
              <input type="file" onChange={e => { const f = e.target.files?.[0] ?? null; setNovoPreview(f); if (f) setPreviewUrl(URL.createObjectURL(f)) }} accept=".png,.jpg,.jpeg,.webp"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              <Upload size={16} style={{ color: novoPreview ? '#ff33cc' : '#ffffff44', marginBottom: '4px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', color: novoPreview ? '#ff33cc' : '#ffffff55', fontSize: '12px', margin: 0, fontWeight: 600 }}>
                {novoPreview ? 'Trocar imagem' : 'Substituir preview'}
              </p>
            </div>
          </div>

          <div style={card}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 12px' }}>Acesso</h2>
            <button type="button" onClick={() => setExclusivo(!exclusivo)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: exclusivo ? '#ff33cc15' : '#ffffff08', border: `1.5px solid ${exclusivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: exclusivo ? '#ff33cc' : '#ffffff88', margin: '0 0 2px' }}>
                  {exclusivo ? 'Exclusivo (planos pagos)' : 'Gratuito (todos)'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', margin: 0 }}>
                  {exclusivo ? 'Free ve bloqueado' : 'Disponivel para todos'}
                </p>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: '999px', background: exclusivo ? '#ff33cc' : '#ffffff18', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: exclusivo ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </button>
          </div>

          <div style={card}>
            {erro && (
              <div style={{ background: '#ff33cc11', border: '1px solid #ff33cc44', borderRadius: '10px', padding: '10px 14px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '12px', marginBottom: '12px' }}>
                {erro}
              </div>
            )}
            {sucesso && (
              <div style={{ background: '#00ff8811', border: '1px solid #00ff8844', borderRadius: '10px', padding: '10px 14px', color: '#00ff88', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                Salvo com sucesso!
              </div>
            )}
            {progresso && (
              <div style={{ background: '#ffffff08', borderRadius: '10px', padding: '10px 14px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontSize: '12px', marginBottom: '12px', textAlign: 'center' }}>
                {progresso}
              </div>
            )}
            <button type="submit" disabled={salvando}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: salvando ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer', width: '100%' }}>
              <Save size={15} />
              {salvando ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}