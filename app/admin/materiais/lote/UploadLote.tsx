'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, AlertCircle, Loader, Plus } from 'lucide-react'

interface Tema      { id: string; nome: string }
interface Categoria { id: string; nome: string }
interface TipoPeca  { id: string; nome: string }
interface Formato   { id: string; nome: string }

interface Props {
  temas:      Tema[]
  categorias: Categoria[]
  tipos:      TipoPeca[]
  formatos:   Formato[]
}

interface ArquivoItem {
  file:       File
  id:         string
  previewUrl: string
  status:     'pendente' | 'enviando' | 'ok' | 'erro'
  erro?:      string
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
  borderRadius: '12px', padding: '11px 14px', color: '#fff',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', cursor: 'pointer',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#ffffff55', marginBottom: '5px',
  letterSpacing: '1px', textTransform: 'uppercase',
}

function gerarSlug(nome: string) {
  return nome.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function gerarPreview(file: File, canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        const size = 800
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const menor = Math.min(img.width, img.height)
        const sx = (img.width - menor) / 2
        const sy = (img.height - menor) / 2
        ctx.drawImage(img, sx, sy, menor, menor, 0, 0, size, size)
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85)
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export default function UploadLote({ temas, categorias, tipos, formatos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const [arquivos, setArquivos] = useState<ArquivoItem[]>([])
  const [temaId, setTemaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [exclusivo, setExclusivo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [novoTema, setNovoTema] = useState('')
  const [criandoTema, setCriandoTema] = useState(false)
  const [temasLista, setTemasLista] = useState<Tema[]>(temas)

  async function criarTema() {
    if (!novoTema.trim()) return
    setCriandoTema(true)
    const { data, error } = await supabase
      .from('temas')
      .insert({ nome: novoTema.trim(), slug: gerarSlug(novoTema), ativo: true })
      .select()
      .single()
    if (!error && data) {
      const novo = data as Tema
      setTemasLista(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
      setTemaId(novo.id)
      setNovoTema('')
    }
    setCriandoTema(false)
  }

  function adicionarArquivos(files: FileList | File[]) {
    const novos: ArquivoItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file: f,
        id: `${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(f),
        status: 'pendente',
      }))
    setArquivos(prev => [...prev, ...novos])
  }

  function remover(id: string) {
    setArquivos(prev => prev.filter(a => a.id !== id))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) adicionarArquivos(e.dataTransfer.files)
  }, [])

  async function enviarTodos() {
    if (arquivos.length === 0) return
    setEnviando(true)
    setConcluido(false)

    const nomeColecao = temasLista.find(t => t.id === temaId)?.nome ?? null

    for (let i = 0; i < arquivos.length; i++) {
      const item = arquivos[i]

      setArquivos(prev => prev.map(a =>
        a.id === item.id ? { ...a, status: 'enviando' } : a
      ))

      try {
        // 1. Upload do arquivo original
        const ext = item.file.name.split('.').pop() ?? 'jpg'
        const nomeBase = item.file.name.replace(/\.[^.]+$/, '').replace(/\s/g, '_')
        const nomeArquivo = `${nomeBase}-${Date.now()}.${ext}`

        const { error: errArq } = await supabase.storage
          .from('materials')
          .upload(nomeArquivo, item.file)
        if (errArq) throw new Error(errArq.message)

        // 2. Gera e faz upload do preview
        let urlPreview: string | null = null
        if (canvasRef.current) {
          const blob = await gerarPreview(item.file, canvasRef.current)
          if (blob) {
            const nomePreview = `preview-${nomeBase}-${Date.now()}.jpg`
            const { error: errPrev } = await supabase.storage
              .from('previews')
              .upload(nomePreview, blob, { contentType: 'image/jpeg' })
            if (!errPrev) {
              const { data: pub } = supabase.storage.from('previews').getPublicUrl(nomePreview)
              urlPreview = pub.publicUrl
            }
          }
        }

        // 3. Salva no banco
        const titulo = nomeBase.replace(/_/g, ' ')
        const { error: errDB } = await supabase.from('materiais').insert({
          titulo,
          tema_id:         temaId || null,
          colecao:         nomeColecao,
          categoria_id:    categoriaId || null,
          tipo_peca_id:    tipoId || null,
          formato_id:      formatoId || null,
          url_arquivo:     nomeArquivo,
          url_imagem_preview: urlPreview,
          exclusivo,
          ativo: true,
        })
        if (errDB) throw new Error(errDB.message)

        setArquivos(prev => prev.map(a =>
          a.id === item.id ? { ...a, status: 'ok' } : a
        ))
      } catch (err) {
        setArquivos(prev => prev.map(a =>
          a.id === item.id ? { ...a, status: 'erro', erro: err instanceof Error ? err.message : 'Erro' } : a
        ))
      }
    }

    setEnviando(false)
    setConcluido(true)
  }

  const total = arquivos.length
  const ok = arquivos.filter(a => a.status === 'ok').length
  const erros = arquivos.filter(a => a.status === 'erro').length
  const pendentes = arquivos.filter(a => a.status === 'pendente').length

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* Coluna principal */}
        <div>

          {/* Dropzone */}
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            style={{ background: '#ffffff05', border: '2px dashed #ffffff18', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', marginBottom: '20px', position: 'relative', cursor: 'pointer', transition: 'border-color .15s' }}
          >
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg"
              onChange={e => e.target.files && adicionarArquivos(e.target.files)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
            <Upload size={32} style={{ color: '#ffffff33', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#ffffff66', margin: '0 0 6px' }}>
              Clique ou arraste os arquivos aqui
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33', margin: 0 }}>
              PNG ou JPG — varios arquivos de uma vez
            </p>
          </div>

          {/* Grid de arquivos */}
          {arquivos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {arquivos.map(item => (
                <div key={item.id} style={{ position: 'relative', background: '#ffffff08', border: `1px solid ${item.status === 'ok' ? '#00ff8844' : item.status === 'erro' ? '#ff444444' : '#ffffff12'}`, borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Preview */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={item.file.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />

                  {/* Status overlay */}
                  {item.status !== 'pendente' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.status === 'enviando' && <Loader size={24} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />}
                      {item.status === 'ok' && <CheckCircle size={24} style={{ color: '#00ff88' }} />}
                      {item.status === 'erro' && <AlertCircle size={24} style={{ color: '#ff4444' }} />}
                    </div>
                  )}

                  {/* Remover */}
                  {item.status === 'pendente' && (
                    <button
                      onClick={() => remover(item.id)}
                      style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '999px', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                    >
                      <X size={11} />
                    </button>
                  )}

                  {/* Nome */}
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: item.status === 'erro' ? '#ff4444' : '#ffffff66', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.status === 'erro' ? item.erro : item.file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status geral */}
          {concluido && (
            <div style={{ marginTop: '20px', background: ok > 0 ? '#00ff8811' : '#ff444411', border: `1px solid ${ok > 0 ? '#00ff8844' : '#ff444444'}`, borderRadius: '12px', padding: '16px 20px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: ok > 0 ? '#00ff88' : '#ff4444', margin: '0 0 4px' }}>
                {ok === total ? 'Todos enviados com sucesso!' : `${ok} de ${total} enviados`}
              </p>
              {erros > 0 && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff4444', margin: 0 }}>{erros} falharam</p>}
              {ok > 0 && (
                <button
                  onClick={() => router.push('/admin/materiais')}
                  style={{ marginTop: '12px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Ver materiais e editar detalhes →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Coluna lateral — configuracoes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Colecao */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>Colecao (aplicado a todos)</h3>
            <select value={temaId} onChange={e => setTemaId(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }}>
              <option value="" style={{ background: '#1a0044' }}>Sem colecao</option>
              {temasLista.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={novoTema}
                onChange={e => setNovoTema(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), criarTema())}
                placeholder="Nova colecao..."
                style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '8px 12px' }}
              />
              <button
                type="button"
                onClick={criarTema}
                disabled={criandoTema || !novoTema.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: novoTema.trim() ? '#ff33cc' : '#ffffff18', border: 'none', borderRadius: '10px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: novoTema.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
              >
                <Plus size={12} />
                {criandoTema ? '...' : 'Criar'}
              </button>
            </div>
          </div>

          {/* Categorizacao */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>Categorizacao</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={lbl}>Ocasiao</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de peca</label>
                <select value={tipoId} onChange={e => setTipoId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {tipos.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Formato</label>
                <select value={formatoId} onChange={e => setFormatoId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {formatos.map(f => <option key={f.id} value={f.id} style={{ background: '#1a0044' }}>{f.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Acesso */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <button
              type="button"
              onClick={() => setExclusivo(!exclusivo)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: exclusivo ? '#ff33cc15' : '#ffffff08', border: `1.5px solid ${exclusivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '12px 14px', cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: exclusivo ? '#ff33cc' : '#ffffff88', margin: '0 0 2px' }}>
                  {exclusivo ? 'Exclusivo' : 'Gratuito'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', margin: 0 }}>
                  {exclusivo ? 'Planos pagos' : 'Todos os planos'}
                </p>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: '999px', background: exclusivo ? '#ff33cc' : '#ffffff18', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: exclusivo ? 19 : 3, transition: 'left .2s' }} />
              </div>
            </button>
          </div>

          {/* Botao enviar */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>
                {total} arquivo{total !== 1 ? 's' : ''} selecionado{total !== 1 ? 's' : ''}
              </span>
              {enviando && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc' }}>
                  {ok}/{total} enviados
                </span>
              )}
            </div>

            {/* Barra de progresso */}
            {enviando && total > 0 && (
              <div style={{ background: '#ffffff10', borderRadius: '999px', height: 6, marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, #ff33cc, #9900ff)', height: '100%', width: `${(ok / total) * 100}%`, transition: 'width .3s', borderRadius: '999px' }} />
              </div>
            )}

            <button
              onClick={enviarTodos}
              disabled={enviando || total === 0 || pendentes === 0}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: (enviando || total === 0 || pendentes === 0) ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: (enviando || total === 0 || pendentes === 0) ? 'not-allowed' : 'pointer' }}
            >
              <Upload size={15} />
              {enviando ? `Enviando ${ok + 1} de ${total}...` : `Enviar ${pendentes} arquivo${pendentes !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}