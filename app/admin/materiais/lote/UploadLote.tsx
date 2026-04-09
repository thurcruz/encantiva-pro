'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, AlertCircle, Loader, CheckSquare, Square, FolderPlus, Edit2, Trash2 } from 'lucide-react'

interface Tema      { id: string; nome: string }
interface Categoria { id: string; nome: string }
interface TipoPeca  { id: string; nome: string }
interface Formato   { id: string; nome: string }
interface Colecao   { id: string; nome: string }

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
  titulo:     string
  materialId: string | null
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

function nomeArquivoParaTitulo(filename: string): string {
  const semExtensao = filename.replace(/\.[^.]+$/, '')
  const comEspacos = semExtensao.replace(/[_-]+/g, ' ').trim()
  return comEspacos.charAt(0).toUpperCase() + comEspacos.slice(1)
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
  const [novaColecao, setNovaColecao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [tipoId, setTipoId] = useState('')
  const [formatoId, setFormatoId] = useState('')
  const [exclusivo, setExclusivo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [temasLista, setTemasLista] = useState<Tema[]>(temas)

  // Tarefa 1: toggle nome do arquivo (ativo por padrão)
  const [usarNomeArquivo, setUsarNomeArquivo] = useState(true)
  const [nomeBase, setNomeBase] = useState('')
  const [prefixo, setPrefixo] = useState('')

  // Tarefa 2: seleção pós-upload
  const [selecionadosPos, setSelecionadosPos] = useState<Set<string>>(new Set())
  const [modalColecao, setModalColecao] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [colecoesList, setColecoesList] = useState<Colecao[]>([])
  const [carregandoColecoes, setCarregandoColecoes] = useState(false)
  const [selecionadasColecoes, setSelecionadasColecoes] = useState<Set<string>>(new Set())
  const [novaColecaoModal, setNovaColecaoModal] = useState('')
  const [salvandoColecao, setSalvandoColecao] = useState(false)
  const [editCategoriaId, setEditCategoriaId] = useState('')
  const [editExclusivo, setEditExclusivo] = useState<boolean | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  function atualizarTitulo(id: string, titulo: string) {
    setArquivos(prev => prev.map(a => a.id === id ? { ...a, titulo } : a))
  }

  function adicionarArquivos(files: FileList | File[], nomeAuto: boolean) {
    const novos: ArquivoItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({
        file: f, id: `${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(f), status: 'pendente',
        titulo: nomeAuto ? nomeArquivoParaTitulo(f.name) : '',
        materialId: null,
      }))
    setArquivos(prev => [...prev, ...novos])
  }

  function remover(id: string) {
    setArquivos(prev => prev.filter(a => a.id !== id))
  }

  function toggleUsarNomeArquivo() {
    const novoValor = !usarNomeArquivo
    setUsarNomeArquivo(novoValor)
    if (novoValor) {
      setArquivos(prev => prev.map(a =>
        a.status === 'pendente'
          ? { ...a, titulo: nomeArquivoParaTitulo(a.file.name) }
          : a
      ))
    }
  }

  async function garantirColecao(): Promise<{ id: string; nome: string } | null> {
    if (temaId) {
      const encontrado = temasLista.find(t => t.id === temaId)
      return encontrado ?? null
    }
    if (novaColecao.trim()) {
      const nome = novaColecao.trim()
      const existente = temasLista.find(t => t.nome.toLowerCase() === nome.toLowerCase())
      if (existente) { setTemaId(existente.id); return existente }
      const { data, error } = await supabase
        .from('temas')
        .insert({ nome, slug: gerarSlug(nome), ativo: true })
        .select().single()
      if (!error && data) {
        const novo = data as Tema
        setTemasLista(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))
        setTemaId(novo.id); setNovaColecao('')
        return novo
      }
    }
    return null
  }

  async function enviarTodos() {
    if (arquivos.length === 0) return
    setEnviando(true); setConcluido(false)

    const colecao = await garantirColecao()
    const colecaoId   = colecao?.id   ?? null
    const colecaoNome = colecao?.nome ?? null
    const pendentes = arquivos.filter(a => a.status === 'pendente')

    for (let i = 0; i < pendentes.length; i++) {
      const item = pendentes[i]
      setArquivos(prev => prev.map(a => a.id === item.id ? { ...a, status: 'enviando' } : a))

      try {
        const ext = item.file.name.split('.').pop() ?? 'jpg'
        const titulo = usarNomeArquivo
          ? (item.titulo.trim() || nomeArquivoParaTitulo(item.file.name))
          : gerarTitulo(nomeBase, prefixo, i, pendentes.length)
        const slugTitulo = gerarSlug(titulo)
        const nomeArquivo = `${slugTitulo}-${Date.now()}.${ext}`

        const { error: errArq } = await supabase.storage
          .from('materials').upload(nomeArquivo, item.file)
        if (errArq) throw new Error(errArq.message)

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

        const { data: materialData, error: errDB } = await supabase.from('materiais').insert({
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
        }).select('id').single()
        if (errDB) throw new Error(errDB.message)

        setArquivos(prev => prev.map(a =>
          a.id === item.id ? { ...a, status: 'ok', titulo, materialId: materialData?.id ?? null } : a
        ))
      } catch (err) {
        setArquivos(prev => prev.map(a =>
          a.id === item.id
            ? { ...a, status: 'erro', erro: err instanceof Error ? err.message : 'Erro' }
            : a
        ))
      }
    }

    setEnviando(false); setConcluido(true)
  }

  // Pós-upload
  const itensOk = arquivos.filter(a => a.status === 'ok' && a.materialId)

  function toggleSelecionadoPos(materialId: string) {
    setSelecionadosPos(prev => {
      const next = new Set(prev)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      return next
    })
  }

  function toggleTodosPos() {
    const todos = itensOk.map(a => a.materialId!).filter(Boolean)
    if (selecionadosPos.size === todos.length) setSelecionadosPos(new Set())
    else setSelecionadosPos(new Set(todos))
  }

  async function abrirModalColecao() {
    setModalColecao(true); setSelecionadasColecoes(new Set()); setNovaColecaoModal('')
    setCarregandoColecoes(true)
    const { data } = await supabase.from('colecoes').select('id, nome').eq('ativo', true).order('nome')
    setColecoesList((data as Colecao[]) ?? [])
    setCarregandoColecoes(false)
  }

  async function salvarColecoes() {
    if (selecionadosPos.size === 0) return
    setSalvandoColecao(true)
    const idsParaAdicionar = new Set(selecionadasColecoes)

    if (novaColecaoModal.trim()) {
      const { data } = await supabase.from('colecoes')
        .insert({ nome: novaColecaoModal.trim(), ativo: true, ordem: 0 })
        .select('id').single()
      if (data) idsParaAdicionar.add(data.id)
    }

    const rows: { material_id: string; colecao_id: string }[] = []
    for (const materialId of selecionadosPos) {
      for (const colecaoId of idsParaAdicionar) {
        rows.push({ material_id: materialId, colecao_id: colecaoId })
      }
    }
    if (rows.length > 0) {
      await supabase.from('materiais_colecoes').upsert(rows, { onConflict: 'material_id,colecao_id' })
    }

    setSalvandoColecao(false); setModalColecao(false)
  }

  async function salvarEdicao() {
    if (selecionadosPos.size === 0) return
    setSalvandoEdicao(true)
    const updates: Record<string, unknown> = {}
    if (editCategoriaId) updates.categoria_id = editCategoriaId
    if (editExclusivo !== null) updates.exclusivo = editExclusivo

    if (Object.keys(updates).length > 0) {
      for (const materialId of selecionadosPos) {
        await supabase.from('materiais').update(updates).eq('id', materialId)
      }
    }
    setSalvandoEdicao(false); setModalEditar(false)
    setEditCategoriaId(''); setEditExclusivo(null)
  }

  async function excluirSelecionados() {
    const ids = new Set(selecionadosPos)
    if (ids.size === 0) return
    if (!confirm(`Excluir ${ids.size} material(is) selecionado(s)?`)) return
    for (const materialId of ids) {
      await supabase.from('materiais').update({ ativo: false }).eq('id', materialId)
    }
    setSelecionadosPos(new Set())
    setArquivos(prev => prev.map(a =>
      a.materialId && ids.has(a.materialId)
        ? { ...a, status: 'erro', erro: 'Excluído' }
        : a
    ))
  }

  const total   = arquivos.length
  const ok      = arquivos.filter(a => a.status === 'ok').length
  const erros   = arquivos.filter(a => a.status === 'erro').length
  const pendQtd = arquivos.filter(a => a.status === 'pendente').length

  const exemploTitulos = arquivos
    .filter(a => a.status === 'pendente')
    .slice(0, 3)
    .map((item, i) => usarNomeArquivo
      ? (item.titulo || nomeArquivoParaTitulo(item.file.name))
      : gerarTitulo(nomeBase, prefixo, i, pendQtd)
    )

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* Coluna principal */}
        <div>
          {/* Dropzone */}
          <div
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) adicionarArquivos(e.dataTransfer.files, usarNomeArquivo) }}
            onDragOver={e => e.preventDefault()}
            style={{ background: '#ffffff05', border: '2px dashed #ffffff18', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', marginBottom: '20px', position: 'relative', cursor: 'pointer' }}
          >
            <input type="file" multiple accept="image/png,image/jpeg"
              onChange={e => e.target.files && adicionarArquivos(e.target.files, usarNomeArquivo)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            <Upload size={32} style={{ color: '#ffffff33', marginBottom: '12px' }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#ffffff66', margin: '0 0 6px' }}>
              Clique ou arraste os arquivos aqui
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33', margin: 0 }}>
              PNG ou JPG — vários arquivos de uma vez
            </p>
          </div>

          {/* Preview dos títulos (quando toggle off) */}
          {!usarNomeArquivo && pendQtd > 0 && (nomeBase || prefixo) && (
            <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Pré-visualização dos títulos
              </p>
              {exemploTitulos.map((t, i) => (
                <p key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffaa', margin: '0 0 4px' }}>{t}</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {arquivos.map(item => (
                <div key={item.id} style={{ position: 'relative', background: '#ffffff08', border: `1px solid ${item.status === 'ok' ? '#00ff8844' : item.status === 'erro' ? '#ff444444' : '#ffffff12'}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative' }}>
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
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    {usarNomeArquivo && item.status === 'pendente' ? (
                      <input
                        value={item.titulo}
                        onChange={e => atualizarTitulo(item.id, e.target.value)}
                        placeholder={nomeArquivoParaTitulo(item.file.name)}
                        style={{ width: '100%', background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '10px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: item.status === 'erro' ? '#ff4444' : '#ffffff44', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.status === 'erro' ? item.erro : (item.titulo || item.file.name)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pós-upload */}
          {concluido && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: ok > 0 ? '#00ff8811' : '#ff444411', border: `1px solid ${ok > 0 ? '#00ff8844' : '#ff444444'}`, borderRadius: '12px', padding: '16px 20px', marginBottom: itensOk.length > 0 ? '20px' : 0 }}>
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

              {/* Seleção em lote pós-upload */}
              {itensOk.length > 0 && (
                <div>
                  {selecionadosPos.size > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ff33cc15', border: '1px solid #ff33cc33', borderRadius: '12px', padding: '10px 16px', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 700 }}>
                        {selecionadosPos.size} material{selecionadosPos.size > 1 ? 'is' : ''} selecionado{selecionadosPos.size > 1 ? 's' : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={abrirModalColecao}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#9900ff20', border: '1px solid #9900ff44', borderRadius: '8px', padding: '7px 12px', color: '#cc66ff', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <FolderPlus size={13} /> Adicionar a coleção
                        </button>
                        <button onClick={() => setModalEditar(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '8px', padding: '7px 12px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Edit2 size={13} /> Editar selecionados
                        </button>
                        <button onClick={excluirSelecionados}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: '8px', padding: '7px 12px', color: '#ef4444', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Trash2 size={13} /> Excluir selecionados
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ border: '1px solid #ffffff10', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#ffffff05', borderBottom: '1px solid #ffffff10' }}>
                      <button onClick={toggleTodosPos}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: selecionadosPos.size === itensOk.length ? '#ff33cc' : '#ffffff33', display: 'flex', padding: 0 }}>
                        {selecionadosPos.size === itensOk.length ? <CheckSquare size={15} /> : <Square size={15} />}
                      </button>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        {itensOk.length} material{itensOk.length > 1 ? 'is' : ''} enviado{itensOk.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Items */}
                    {itensOk.map(item => (
                      <div key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: '1px solid #ffffff08', background: item.materialId && selecionadosPos.has(item.materialId) ? '#ff33cc08' : 'transparent', transition: 'background 0.15s' }}>
                        <button onClick={() => item.materialId && toggleSelecionadoPos(item.materialId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.materialId && selecionadosPos.has(item.materialId) ? '#ff33cc' : '#ffffff33', display: 'flex', padding: 0, flexShrink: 0 }}>
                          {item.materialId && selecionadosPos.has(item.materialId) ? <CheckSquare size={15} /> : <Square size={15} />}
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.previewUrl} alt={item.titulo} style={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover', border: '1px solid #ffffff12', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.titulo}
                        </span>
                        <CheckCircle size={14} style={{ color: '#00ff88', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
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

            {/* Toggle usar nome do arquivo */}
            <button type="button" onClick={toggleUsarNomeArquivo}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: usarNomeArquivo ? '#ff33cc15' : '#ffffff08', border: `1.5px solid ${usarNomeArquivo ? '#ff33cc55' : '#ffffff18'}`, borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', marginBottom: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: usarNomeArquivo ? '#ff33cc' : '#ffffff88', margin: '0 0 2px' }}>
                  Usar nome do arquivo
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff33', margin: 0 }}>
                  Ex: bandeja_azul.png → Bandeja azul
                </p>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: '999px', background: usarNomeArquivo ? '#ff33cc' : '#ffffff18', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: usarNomeArquivo ? 19 : 3, transition: 'left .2s' }} />
              </div>
            </button>

            {/* Nome base + prefixo (quando toggle off) */}
            {!usarNomeArquivo && (
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
            )}

            {usarNomeArquivo && pendQtd > 0 && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff44', margin: 0, lineHeight: 1.6 }}>
                Nomes preenchidos automaticamente. Edite nas miniaturas se necessário.
              </p>
            )}
          </div>

          {/* Coleção */}
          <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 14px' }}>
              Coleção
            </h3>
            <select value={temaId} onChange={e => { setTemaId(e.target.value); setNovaColecao('') }}
              style={{ ...inputStyle, marginBottom: '10px' }}>
              <option value="" style={{ background: '#1a0044' }}>Selecionar existente...</option>
              {temasLista.map(t => <option key={t.id} value={t.id} style={{ background: '#1a0044' }}>{t.nome}</option>)}
            </select>
            {!temaId && (
              <div>
                <label style={lbl}>Ou nome da nova coleção</label>
                <input value={novaColecao} onChange={e => setNovaColecao(e.target.value)}
                  placeholder="Ex: Urso Marinheiro Azul" style={inputStyle} />
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

      {/* Modal: Adicionar a coleção */}
      {modalColecao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1a0044', border: '1px solid #ffffff18', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff', margin: 0 }}>
                Adicionar a coleção
              </h2>
              <button onClick={() => setModalColecao(false)}
                style={{ background: '#ffffff10', border: 'none', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff66' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff44', margin: '0 0 16px' }}>
              {selecionadosPos.size} material{selecionadosPos.size > 1 ? 'is' : ''} selecionado{selecionadosPos.size > 1 ? 's' : ''}
            </p>

            {carregandoColecoes ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#ffffff33', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                Carregando...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {colecoesList.map(col => {
                  const marcada = selecionadasColecoes.has(col.id)
                  return (
                    <button key={col.id} onClick={() => setSelecionadasColecoes(prev => {
                      const next = new Set(prev)
                      if (next.has(col.id)) next.delete(col.id); else next.add(col.id)
                      return next
                    })}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: marcada ? '#9900ff20' : '#ffffff08', border: `1px solid ${marcada ? '#9900ff44' : '#ffffff12'}`, borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '4px', border: `2px solid ${marcada ? '#9900ff' : '#ffffff30'}`, background: marcada ? '#9900ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {marcada && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: marcada ? '#cc66ff' : '#ffffffcc', fontWeight: marcada ? 700 : 400 }}>
                        {col.nome}
                      </span>
                    </button>
                  )
                })}
                {colecoesList.length === 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff33', textAlign: 'center', padding: '12px 0' }}>
                    Nenhuma coleção criada ainda
                  </p>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid #ffffff10', paddingTop: '16px', marginBottom: '16px' }}>
              <label style={lbl}>Criar nova coleção</label>
              <input value={novaColecaoModal} onChange={e => setNovaColecaoModal(e.target.value)}
                placeholder="Nome da coleção..." style={inputStyle} />
              {novaColecaoModal.trim() && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#cc66ff', margin: '5px 0 0', fontWeight: 600 }}>
                  + Será criada e adicionada automaticamente
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModalColecao(false)}
                style={{ flex: 1, background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '10px', padding: '12px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={salvarColecoes}
                disabled={salvandoColecao || (selecionadasColecoes.size === 0 && !novaColecaoModal.trim())}
                style={{ flex: 2, background: (salvandoColecao || (selecionadasColecoes.size === 0 && !novaColecaoModal.trim())) ? '#ffffff22' : 'linear-gradient(135deg, #9900ff, #6600cc)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: (salvandoColecao || (selecionadasColecoes.size === 0 && !novaColecaoModal.trim())) ? 'not-allowed' : 'pointer' }}>
                {salvandoColecao ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar selecionados */}
      {modalEditar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1a0044', border: '1px solid #ffffff18', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#fff', margin: 0 }}>
                Editar {selecionadosPos.size} material{selecionadosPos.size > 1 ? 'is' : ''}
              </h2>
              <button onClick={() => setModalEditar(false)}
                style={{ background: '#ffffff10', border: 'none', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff66' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: '0 0 16px' }}>
              Apenas os campos preenchidos abaixo serão alterados.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>Ocasião (categoria)</label>
                <select value={editCategoriaId} onChange={e => setEditCategoriaId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Não alterar</option>
                  {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#1a0044' }}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Acesso</label>
                <select
                  value={editExclusivo === null ? '' : editExclusivo ? 'sim' : 'nao'}
                  onChange={e => setEditExclusivo(e.target.value === '' ? null : e.target.value === 'sim')}
                  style={inputStyle}>
                  <option value="" style={{ background: '#1a0044' }}>Não alterar</option>
                  <option value="nao" style={{ background: '#1a0044' }}>Gratuito</option>
                  <option value="sim" style={{ background: '#1a0044' }}>Exclusivo (pago)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setModalEditar(false)}
                style={{ flex: 1, background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '10px', padding: '12px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={salvarEdicao}
                disabled={salvandoEdicao || (editCategoriaId === '' && editExclusivo === null)}
                style={{ flex: 2, background: (salvandoEdicao || (editCategoriaId === '' && editExclusivo === null)) ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: (salvandoEdicao || (editCategoriaId === '' && editExclusivo === null)) ? 'not-allowed' : 'pointer' }}>
                {salvandoEdicao ? 'Salvando...' : 'Aplicar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
