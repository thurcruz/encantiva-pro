'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Download, ImageIcon, Check, BookOpen, Calendar, DollarSign, Users, ArrowRight, Lock } from 'lucide-react'
import ModalLogin from './ModalLogin'
import OrientacaoToggle from '../(dashboard)/componentes/OrientacaoToggle'

export interface Props {
  usuarioLogado: boolean
  usuarioId: string | null
}

type Orientacao = 'paisagem' | 'retrato'

interface PainelComunidade {
  id: string
  usuario_id: string
  nome: string
  descricao: string | null
  imagem_url: string
  pdf_url: string
  downloads: number
  criado_em: string
}

const FUNCIONALIDADES = [
  { icon: BookOpen,   label: 'Catálogo Digital',  desc: 'Monte e compartilhe seu catálogo',   cor: '#ff33cc' },
  { icon: Calendar,   label: 'Agenda de Pedidos', desc: 'Organize entregas e encomendas',      cor: '#9900ff' },
  { icon: DollarSign, label: 'Financeiro',         desc: 'Acompanhe receitas e despesas',      cor: '#ff33cc' },
  { icon: Users,      label: 'Comunidade',         desc: 'Painéis prontos de artesãs',         cor: '#9900ff' },
]

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec',
  borderRadius: '14px', padding: '18px', marginBottom: '12px',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase',
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
  borderRadius: '10px', padding: '10px 12px', color: '#111827',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}

export default function CortadorPublico({ usuarioLogado, usuarioId }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [imagem, setImagem]             = useState<HTMLImageElement | null>(null)
  const [imagemFile, setImagemFile]     = useState<File | null>(null)
  const [nome, setNome]                 = useState('')
  const [gerando, setGerando]           = useState(false)
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [fatias, setFatias]             = useState<string[]>([])
  const [modalLogin, setModalLogin]     = useState(false)
  const [logado, setLogado]             = useState(usuarioLogado)
  const [uid, setUid]                   = useState<string | null>(usuarioId)
  const [pdfBaixado, setPdfBaixado]     = useState(false)
  const [orientacao, setOrientacao]     = useState<Orientacao>('paisagem')
  const [dragOver, setDragOver]         = useState(false)
  const [comMargem, setComMargem] = useState(true)

  // Comunidade
  const [abaAtiva, setAbaAtiva]               = useState<'cortador' | 'comunidade'>('cortador')
  const [paineisComunidade, setPaineisComunidade] = useState<PainelComunidade[]>([])
  const [carregandoComunidade, setCarregandoComunidade] = useState(false)

  const COLS = orientacao === 'paisagem' ? 2 : 3
  const ROWS = orientacao === 'paisagem' ? 3 : 2

  const cortarImagem = useCallback(async (img: HTMLImageElement) => {
    if (img.decode) { try { await img.decode() } catch { } }
    const novasFatias: string[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const canvas = document.createElement('canvas')
        const lf = img.naturalWidth / COLS
        const af = img.naturalHeight / ROWS
        canvas.width = lf; canvas.height = af
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, col * lf, row * af, lf, af, 0, 0, lf, af)
        novasFatias.push(canvas.toDataURL('image/jpeg', 0.95))
      }
    }
    setFatias(novasFatias)
  }, [COLS, ROWS])

  useEffect(() => { if (imagem) void cortarImagem(imagem) }, [imagem, orientacao, cortarImagem])

  const carregarComunidade = useCallback(async () => {
    setCarregandoComunidade(true)
    const { data } = await supabase
      .from('paineis_comunidade')
      .select('*')
      .order('downloads', { ascending: false })
    if (data) setPaineisComunidade(data)
    setCarregandoComunidade(false)
  }, [supabase])

  useEffect(() => {
    if (abaAtiva === 'comunidade') void carregarComunidade()
  }, [abaAtiva, carregarComunidade])

  function processarArquivo(file: File) {
    setImagemFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload  = () => { setImagem(img); setFatias([]); setPreviewAtivo(null); setPdfBaixado(false) }
      img.onerror = () => alert('Erro ao carregar imagem.')
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (file) processarArquivo(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) processarArquivo(file)
  }

  async function comprimirFatia(fatia: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = orientacao === 'paisagem' ? 1240 : 827
        canvas.height = orientacao === 'paisagem' ? 825  : 1169
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas não suportado')); return }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // SEM margem = 50x50cm exatos; COM margem = painel maior
        const m = comMargem ? 0 : 38
        ctx.drawImage(img, m, m, canvas.width - m * 2, canvas.height - m * 2)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.onerror = () => reject(new Error('Erro ao processar fatia'))
      img.src = fatia
    })
  }

  async function aoFazerLogin() {
    setModalLogin(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { setLogado(true); setUid(user.id); await gerarPDF(user.id) }
  }

  async function handleBotaoDownload() {
    if (!imagem || fatias.length === 0) return
    if (!nome.trim()) return alert('Dê um nome ao painel antes de gerar.')
    if (!logado) { setModalLogin(true); return }
    await gerarPDF(uid!)
  }

  async function gerarPDF(userId: string) {
    setGerando(true)
    try {
      const fatiasPequenas = await Promise.all(fatias.map(comprimirFatia))
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gerar-painel-pdf`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` }, body: JSON.stringify({ fatias: fatiasPequenas, nome, orientacao }) }
      )
      if (!response.ok) throw new Error(`Erro ${response.status}`)
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      const base64Limpo = result.pdf.replace(/[^A-Za-z0-9+/=]/g, '')
      const pdfBlob = new Blob([Uint8Array.from(atob(base64Limpo), c => c.charCodeAt(0))], { type: 'application/pdf' })

      let imagemUrl = null
      if (imagemFile) {
        const { data: imgData } = await supabase.storage.from('paineis').upload(`${userId}/${Date.now()}_original.jpg`, imagemFile, { upsert: true })
        if (imgData) { const { data: u } = supabase.storage.from('paineis').getPublicUrl(imgData.path); imagemUrl = u.publicUrl }
      }
      const { data: pdfData } = await supabase.storage.from('paineis').upload(`${userId}/${Date.now()}_${nome}.pdf`, pdfBlob, { upsert: true })
      let pdfUrl = null
      if (pdfData) { const { data: u } = supabase.storage.from('paineis').getPublicUrl(pdfData.path); pdfUrl = u.publicUrl }

      await supabase.from('paineis').insert({
        usuario_id: userId, nome,
        tipo: orientacao === 'paisagem' ? '6-paisagem' : '6-retrato',
        imagem_url: imagemUrl, pdf_url: pdfUrl, publicado_comunidade: false,
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a'); a.href = url; a.download = `painel_${nome}.pdf`; a.click()
      URL.revokeObjectURL(url)
      setPdfBaixado(true)
    } catch (err) { alert(`Erro ao gerar PDF: ${err}`) }
    setGerando(false)
  }

  async function baixarDaComunidade(painel: PainelComunidade) {
    if (!logado) { setModalLogin(true); return }
    await supabase.from('paineis_comunidade').update({ downloads: painel.downloads + 1 }).eq('id', painel.id)
    window.open(painel.pdf_url, '_blank')
  }

  const botaoDesabilitado = gerando || !nome.trim() || !imagem

  return (
    <div>
      <style>{`
        .cp-upload:hover { border-color: #ff33cc !important; background: #fff0fb !important; }
        .cp-fatia { transition: transform .15s, box-shadow .15s; cursor: pointer; }
        .cp-fatia:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(255,51,204,0.15); }
      `}</style>

      {/* ── Abas ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { key: 'cortador',   label: 'Cortador' },
          { key: 'comunidade', label: 'Comunidade' },
        ].map(aba => (
          <button key={aba.key} onClick={() => setAbaAtiva(aba.key as 'cortador' | 'comunidade')}
            style={{ flex: 1, padding: '10px 16px', background: abaAtiva === aba.key ? '#ff33cc' : '#fff', border: `1.5px solid ${abaAtiva === aba.key ? 'transparent' : '#e8e8ec'}`, borderRadius: '999px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: abaAtiva === aba.key ? '#fff' : '#6b7280', transition: 'all .15s' }}>
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── ABA CORTADOR ── */}
      {abaAtiva === 'cortador' && (
        <>
          {/* Banner pós-download */}
          {pdfBaixado && (
            <div style={{ background: '#fff', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={16} style={{ color: '#fff' }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>PDF baixado com sucesso!</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Veja tudo que a Encantiva Pro oferece</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {FUNCIONALIDADES.map((f, i) => (
                  <div key={i} style={{ background: '#fafafa', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e8e8ec' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '7px', background: `${f.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <f.icon size={13} style={{ color: f.cor }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', color: '#111827', margin: 0 }}>{f.label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#ff33cc', borderRadius: '999px', padding: '12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
                Explorar tudo grátis <ArrowRight size={14} />
              </a>
            </div>
          )}

          {/* Orientação + Margem */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 3px' }}>Orientação das folhas</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                {orientacao === 'paisagem' ? '2 colunas × 3 linhas — folha deitada' : '3 colunas × 2 linhas — folha em pé'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '3px', width: orientacao === 'paisagem' ? '60px' : '45px', height: orientacao === 'paisagem' ? '45px' : '60px', flexShrink: 0 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: '#fff0fb', border: '1.5px solid #ffd6f5', borderRadius: '3px' }} />
                ))}
              </div>
              <OrientacaoToggle value={orientacao} onChange={setOrientacao} />
              {/* Toggle de margem */}
              <button
                type="button"
                onClick={() => setComMargem(!comMargem)}
                title="Adiciona 1cm de margem em volta de cada folha para facilitar a colagem"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: comMargem ? '#fff0fb' : '#fafafa', border: `1.5px solid ${comMargem ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '999px', padding: '7px 12px', color: comMargem ? '#ff33cc' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: comMargem ? '#ff33cc' : '#d1d5db', flexShrink: 0, transition: 'background .15s' }} />
                Margem 1cm
              </button>
            </div>
          </div>

          {/* Info margem */}
          <div style={{ background: comMargem ? '#f9fafb' : '#fff0fb', border: `1px solid ${comMargem ? '#e8e8ec' : '#ffd6f5'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: comMargem ? '#6b7280' : '#9333ea', margin: 0, lineHeight: 1.5 }}>
              {comMargem
                ? '📏 Sem margem — imagem preenche a folha inteira, painel montado fica exatamente 50×50cm'
                : '📐 Com margem — cada folha terá borda branca de ~1cm, painel montado fica maior que 50×50cm para facilitar a colagem'}
            </p>
          </div>

          {/* Upload */}
          <div
            className="cp-upload"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ background: dragOver ? '#fff0fb' : imagem ? '#fff0fb' : '#fafafa', border: `2px dashed ${dragOver || imagem ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '28px 20px', marginBottom: '12px', transition: 'all .2s', boxSizing: 'border-box' }}
          >
            {imagem ? (
              <>
                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  <NextImage src={imagem.src} fill style={{ objectFit: 'cover' }} alt="Preview" unoptimized />
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px solid rgba(255,255,255,0.6)' }} />)}
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 700, margin: 0 }}>✅ Clique para trocar</p>
              </>
            ) : (
              <>
                <ImageIcon size={28} style={{ color: '#d1d5db' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Clique ou arraste a imagem</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>PNG ou JPEG · mín. 3000×3000px</p>
                </div>
              </>
            )}
          </div>

          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />

          {/* Nome */}
          <div style={card}>
            <label style={labelStyle}>Nome do painel *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Painel Unicórnio" style={inputStyle} />
          </div>

          {/* Preview + Botão */}
          {fatias.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>Preview — Grade {COLS}×{ROWS}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Clique em uma fatia para ampliar</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {comMargem && (
                    <span style={{ background: '#fff0fb', color: '#ff33cc', borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}>
                      + margem 1cm
                    </span>
                  )}
                  <span style={{ background: '#fff0fb', color: '#ff33cc', borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700 }}>6 folhas A4</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px', marginBottom: '14px' }}>
                {fatias.map((fatia, idx) => (
                  <div key={idx} className="cp-fatia" onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)}
                    style={{ position: 'relative', border: `2px solid ${previewAtivo === idx ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <NextImage src={fatia} width={300} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${idx + 1}`} unoptimized />
                    <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: previewAtivo === idx ? '#ff33cc' : 'rgba(0,0,0,0.55)', borderRadius: '6px', padding: '2px 7px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {idx + 1}/6
                    </div>
                  </div>
                ))}
              </div>

              {previewAtivo !== null && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #ff33cc33', marginBottom: '14px' }}>
                  <NextImage src={fatias[previewAtivo]} width={800} height={800} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${previewAtivo + 1}`} unoptimized />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '8px', margin: 0, borderTop: '1px solid #f3f4f6' }}>
                    Folha {previewAtivo + 1} de 6
                  </p>
                </div>
              )}

              <button onClick={handleBotaoDownload} disabled={botaoDesabilitado}
                style={{ width: '100%', border: 'none', borderRadius: '999px', padding: '14px', background: botaoDesabilitado ? '#f3f4f6' : '#ff33cc', color: botaoDesabilitado ? '#9ca3af' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: botaoDesabilitado ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background .2s' }}>
                <Download size={15} />
                {gerando ? 'Gerando PDF...' : !nome.trim() ? 'Dê um nome ao painel' : logado ? `Gerar PDF — ${orientacao === 'paisagem' ? 'Paisagem' : 'Retrato'}` : 'Entre para baixar o PDF'}
              </button>

              {!logado && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', textAlign: 'center', margin: '8px 0 0' }}>
                  É grátis — conta em menos de 1 minuto ✨
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── ABA COMUNIDADE ── */}
      {abaAtiva === 'comunidade' && (
        <div>
          {!logado && (
            <div style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '14px', padding: '16px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>Crie uma conta grátis para baixar</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Acesso gratuito a painéis da comunidade com conta Encantiva.</p>
              </div>
              <button onClick={() => setModalLogin(true)}
                style={{ background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                Criar conta
              </button>
            </div>
          )}

          {carregandoComunidade ? (
            <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af' }}>Carregando painéis...</div>
          ) : paineisComunidade.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', textAlign: 'center', padding: '60px 24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum painel na comunidade ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Seja a primeira a compartilhar pelo dashboard!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {paineisComunidade.map(painel => (
                <div key={painel.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', aspectRatio: '1', background: '#f9fafb' }}>
                    <NextImage src={painel.imagem_url} fill style={{ objectFit: 'cover' }} alt={painel.nome} unoptimized />
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: painel.usuario_id === 'encantiva' ? '#ff33cc' : 'rgba(0,0,0,0.55)', borderRadius: '999px', padding: '3px 9px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {painel.usuario_id === 'encantiva' ? 'Encantiva' : 'Comunidade'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 3px' }}>{painel.nome}</p>
                    {painel.descricao && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 10px' }}>{painel.descricao}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>{painel.downloads} downloads</span>
                      <button onClick={() => baixarDaComunidade(painel)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: logado ? '#ff33cc' : '#f3f4f6', border: 'none', borderRadius: '999px', padding: '6px 12px', color: logado ? '#fff' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                        {logado ? <Download size={11} /> : <Lock size={11} />}
                        {logado ? 'Baixar PDF' : 'Entrar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalLogin && <ModalLogin onFechar={() => setModalLogin(false)} onSucesso={aoFazerLogin} />}
    </div>
  )
}