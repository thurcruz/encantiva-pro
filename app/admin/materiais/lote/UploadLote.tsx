'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'

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
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

// Gera título com prefixo e sequência: "MOA-01", "MOA-02"...
function gerarTitulo(nomeBase: string, prefixo: string, indice: number, total: number): string {
  const digitos = total >= 100 ? 3 : 2
  const seq = String(indice + 1).padStart(digitos, '0')
  const codigo = prefixo.trim().toUpperCase()
  const base = nomeBase.trim()
  if (codigo && base) return `${base} ${codigo}-${seq}`
  if (codigo) return `${codigo}-${seq}`
  if (base) return `${base} ${seq}`
  return `Painel ${seq}`
}

export default function UploadLote({ temas, categorias, tipos, formatos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [arquivos, setArquivos] = useState<ArquivoItem[]>([])
  const [temaId, setTemaId] = useState('')
  const [novaColecao, setNovaColecao] = useState('')  // texto livre para nova coleção
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [exclusivo, setExclusivo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [temasLista, setTemasLista] = useState<Tema[]>(temas)

  // Nomenclatura
  const [nomeBase, setNomeBase] = useState('')   // Ex: "Painel Urso Marinheiro"
  const [prefixo, setPrefixo] = useState('')     // Ex: "UMR"

  function adicionarArquivos(files: FileList | File[]) {
    const novos: ArquivoItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file: f, id: `${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(f), status: 'pendente',
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

  // Garante que a coleção existe — cria se necessário
  async function garantirColecao(): Promise<{ id: string; nome: string } | null> {
    // Selecionou uma existente
    if (temaId) {
      const encontrado = temasLista.find(t => t.id === temaId)
      return encontrado ?? null
    }
    // Digitou uma nova
    if (novaColecao.trim()) {
      const nome = novaColecao.trim()
      // Verifica se já existe pelo nome
      const existente = temasLista.find(t => t.nome.toLowerCase() === nome.toLowerCase())
      if (existente) {
        setTemaId(existente.id)
        return existente
      }
      // Cria nova coleção automaticamente
      const { data, error } = await supabase
        .from('temas')
        .insert({ nome, slug: gerarSlug(nome), ativo: true })
        .select().single()
      if (!error && data) {
        const novo = data as Tema
        setTemasLista(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
        setTemaId(novo.id)
        setNovaColecao('')
        return novo
      }
    }
    return null
  }

  async function enviarTodos() {
    if (arquivos.length === 0) return
    setEnviando(true)
    setConcluido(false)

    // Cria ou busca coleção antes de enviar
    const colecao = await garantirColecao()
    const colecaoId   = colecao?.id   ?? null
    const colecaoNome = colecao?.nome ?? null

    const pendentes = arquivos.filter(a => a.status === 'pendente')

    for (let i = 0; i < pendentes.length; i++) {
      const item = pendentes[i]

      setArquivos(prev => prev.map(a =>
        a.id === item.id ? { ...a, status: 'enviando' } : a
      ))

      try {
        // Gera nome do arquivo no storage
        const ext = item.file.name.split('.').pop() ?? 'jpg'
        const titulo = gerarTitulo(nomeBase, prefixo, i, pendentes.length)
        const slugTitulo = gerarSlug(titulo)
        const nomeArquivo = `${slugTitulo}-${Date.now()}.${ext}`

        const { error: errArq } = await supabase.storage
          .from('materials').upload(nomeArquivo, item.file)
        if (errArq) throw new Error(errArq.message)

        // Preview
        let urlPreview: string | null = null
        if (canvasRef.current) {
          const blob = await gerarPreview(item.file, canvasRef.current)
          if (blob) {
            const nomePreview = `preview-${slugTitulo}-${Date.now()}.jpg`
            const { error: errPrev } = await supabase.storage
              .from('previews').upload(nomePreview, blob, { contentType: 'image/jpeg' })
            if (!errPrev) {
              const { data: pub } = supabase.storage.from('previews').getPublicUrl(nomePreview)
              urlPreview = pub.publicUrl
            }
          }
        }

        // Salva no banco com título gerado
        const { error: errDB } = await supabase.from('materiais').insert({
          titulo,
          tema_id:            colecaoId,
          colecao:            colecaoNome,
          categoria_id:       categoriaId || null,
          tipo_peca_id:       tipoId || null,
          formato_id:         formatoId || null,
          url_arquivo:        nomeArquivo,
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
          a.id === item.id
            ? { ...a, status: 'erro', erro: err instanceof Error ? err.message : 'Erro' }
            : a
        ))
      }
    }

    setEnviando(false)
    setConcluido(true)
  }

  const total    = arquivos.length
  const ok       = arquivos.filter(a => a.status === 'ok').length
  const erros    = arquivos.filter(a => a.status === 'erro').length
  const pendQtd  = arquivos.filter(a => a.status === 'pendente').length

  // Preview dos títulos que serão gerados
  const exemploTitulos = arquivos
    .filter(a => a.status === 'pendente')
    .slice(0, 3)
    .map((_, i) => gerarTitulo(nomeBase, prefixo, i, pendQtd))

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* Coluna principal */}
        <div>
          {/* Dropzone */}
          <div
            onDrop={onDrop} onDragOver={e => e.preventDefault()}
            style={{ background: '#ffffff05', border: '2px dashed #ffffff18', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', marginBottom: '20px', position: 'relative', cursor: 'pointer' }}
          >
            <input type="file" multiple accept="image/png,image/jpeg"
              onChange={e => e.target.files && adicionarArquivos(e.target.files)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            <Upload size={32} style={{ color: '#ffffff33', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#ffffff66', margin: '0 0 6px' }}>
              Clique ou arraste os arquivos aqui
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33', margin: 0 }}>
              PNG ou JPG — vários arquivos de uma vez
            </p>
          </div>

          {/* Preview dos títulos que serão gerados */}
          {pendQtd > 0 && (nomeBase || prefixo) && (
            <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Pré-visualização dos títulos
              </p>
              {exemploTitulos.map((t, i) => (
                <p key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffaa', margin: '0 0 4px' }}>
                  {t}
                </p>
              ))}
              {pendQtd > 3 && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', margin: '4px 0 0' }}>
                  + {pendQtd - 3} mais...
                </p>
              )}
            </div>
          )}

          {/* Grid de arquivos */}
          {arquivos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {arquivos.map(item => (
                <div key={item.id} style={{ position: 'relative', background: '#ffffff08', border: `1px solid ${item.status === 'ok' ? '#00ff8844' : item.status === 'erro' ? '#ff444444' : '#ffffff12'}`, borderRadius: '12px', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={item.file.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  {item.status !== 'pendente' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.status === 'enviando' && <Loader size={24} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />}
                      {item.status === 'ok' && <CheckCircle size={24} style={{ color: '#00ff88' }} />}
                      {item.status === 'erro' && <AlertCircle size={24} style={{ color: '#ff4444' }} />}
                    </div>
                  )}
                  {item.status === 'pendente' && (
                    <button onClick={() => remover(item.id)} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '999px', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <X size={11} />
                    </button>
                  )}
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: item.status === 'erro' ? '#ff4444' : '#ffffff44', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                <button onClick={() => router.push('/admin/materiais')}
                  style={{ marginTop: '12px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  Ver materiais →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Nomenclatura */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>
              Nomenclatura
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={lbl}>Nome base</label>
                <input value={nomeBase} onChange={e => setNomeBase(e.target.value)}
                  placeholder="Ex: Painel Urso Marinheiro" style={inputStyle} />
              </div>
              <div>
                <label style={lbl}>Código (3-4 letras)</label>
                <input
                  value={prefixo}
                  onChange={e => setPrefixo(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  placeholder="Ex: UMR"
                  style={{ ...inputStyle, letterSpacing: '2px', fontWeight: 700 }}
                  maxLength={4}
                />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff33', margin: '5px 0 0' }}>
                  {nomeBase || prefixo
                    ? `Resultado: ${gerarTitulo(nomeBase, prefixo, 0, 1)}, ${gerarTitulo(nomeBase, prefixo, 1, 2)}...`
                    : 'Usa o nome do arquivo original'}
                </p>
              </div>
            </div>
          </div>

          {/* Coleção */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>
              Coleção
            </h3>

            {/* Selecionar existente */}
            <select value={temaId} onChange={e => { setTemaId(e.target.value); setNovaColecao('') }}
              style={{ ...inputStyle, marginBottom: '10px' }}>
              <option value="" style={{ background: '#1a0044' }}>Selecionar existente...</option>
              {temasLista.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
            </select>

            {/* Ou criar nova — automático ao enviar */}
            {!temaId && (
              <div>
                <label style={lbl}>Ou nome da nova coleção</label>
                <input
                  value={novaColecao}
                  onChange={e => setNovaColecao(e.target.value)}
                  placeholder="Ex: Urso Marinheiro Azul"
                  style={inputStyle}
                />
                {novaColecao.trim() && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ff33cc', margin: '5px 0 0', fontWeight: 600 }}>
                    ✓ Será criada automaticamente ao enviar
                  </p>
                )}
              </div>
            )}

            {temaId && (
              <button type="button" onClick={() => setTemaId('')}
                style={{ background: 'none', border: 'none', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer', padding: 0, marginTop: '4px' }}>
                Criar nova coleção em vez disso
              </button>
            )}
          </div>

          {/* Categorização */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>Categorização</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={lbl}>Ocasião</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Selecionar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Tipo de peça</label>
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
            <button type="button" onClick={() => setExclusivo(!exclusivo)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: exclusivo ? '#ff33cc15' : '#ffffff08', border: `1.5px solid ${exclusivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '12px 14px', cursor: 'pointer' }}>
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

          {/* Botão enviar */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66' }}>
                {total} arquivo{total !== 1 ? 's' : ''} selecionado{total !== 1 ? 's' : ''}
              </span>
              {enviando && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc' }}>
                  {ok}/{total}
                </span>
              )}
            </div>

            {enviando && total > 0 && (
              <div style={{ background: '#ffffff10', borderRadius: '999px', height: 6, marginBottom: '14px', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, #ff33cc, #9900ff)', height: '100%', width: `${(ok / total) * 100}%`, transition: 'width .3s', borderRadius: '999px' }} />
              </div>
            )}

            <button onClick={enviarTodos} disabled={enviando || total === 0 || pendQtd === 0}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: (enviando || total === 0 || pendQtd === 0) ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: (enviando || total === 0 || pendQtd === 0) ? 'not-allowed' : 'pointer' }}>
              <Upload size={15} />
              {enviando ? `Enviando ${ok + 1} de ${total}...` : `Enviar ${pendQtd} arquivo${pendQtd !== 1 ? 's' : ''}`}
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