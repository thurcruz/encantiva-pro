'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Download, ImageIcon, Check, Sparkles, BookOpen, Calendar, DollarSign, Users, ArrowRight } from 'lucide-react'
import ModalLogin from './ModalLogin'
import OrientacaoToggle from '../(dashboard)/componentes/OrientacaoToggle'
export interface Props {
  usuarioLogado: boolean
  usuarioId: string | null
}

type Orientacao = 'paisagem' | 'retrato'

const FUNCIONALIDADES = [
  { icon: BookOpen, label: 'Catálogo Digital', desc: 'Monte e compartilhe seu catálogo de produtos', cor: '#ff33cc' },
  { icon: Calendar, label: 'Agenda de Pedidos', desc: 'Organize suas entregas e encomendas', cor: '#9900ff' },
  { icon: DollarSign, label: 'Controle Financeiro', desc: 'Acompanhe receitas e despesas', cor: '#ff33cc' },
  { icon: Users, label: 'Comunidade', desc: 'Painéis prontos feitos por outras artesãs', cor: '#9900ff' },
]

export default function CortadorPublico({ usuarioLogado, usuarioId }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [imagem, setImagem] = useState<HTMLImageElement | null>(null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [gerando, setGerando] = useState(false)
  const [previewAtivo, setPreviewAtivo] = useState<number | null>(null)
  const [fatias, setFatias] = useState<string[]>([])
  const [modalLogin, setModalLogin] = useState(false)
  const [logado, setLogado] = useState(usuarioLogado)
  const [uid, setUid] = useState<string | null>(usuarioId)
  const [pdfBaixado, setPdfBaixado] = useState(false)
  const [orientacao, setOrientacao] = useState<Orientacao>('paisagem')

  // Paisagem = 2 colunas × 3 linhas | Retrato = 3 colunas × 2 linhas
  const COLS = orientacao === 'paisagem' ? 2 : 3
  const ROWS = orientacao === 'paisagem' ? 3 : 2

  const cortarImagem = useCallback(async (img: HTMLImageElement) => {
    if (img.decode) {
      try { await img.decode() } catch (_) {}
    }
    const novasFatias: string[] = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const canvas = document.createElement('canvas')
        const larguraFatia = img.naturalWidth / COLS
        const alturaFatia = img.naturalHeight / ROWS
        canvas.width = larguraFatia
        canvas.height = alturaFatia
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, col * larguraFatia, row * alturaFatia, larguraFatia, alturaFatia, 0, 0, larguraFatia, alturaFatia)
        novasFatias.push(canvas.toDataURL('image/jpeg', 0.95))
      }
    }
    setFatias(novasFatias)
  }, [COLS, ROWS])

  useEffect(() => {
    if (!imagem) return
    cortarImagem(imagem)
  }, [imagem, orientacao, cortarImagem])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagemFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        setImagem(img)
        setFatias([])
        setPreviewAtivo(null)
        setPdfBaixado(false)
      }
      img.onerror = () => alert('Erro ao carregar imagem. Tente outro arquivo.')
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  async function comprimirFatia(fatia: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Paisagem: fatia larga | Retrato: fatia alta
        const largura = orientacao === 'paisagem' ? 1240 : 827
        const altura  = orientacao === 'paisagem' ? 825  : 1169
        canvas.width = largura
        canvas.height = altura
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas não suportado')); return }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.onerror = () => reject(new Error('Erro ao processar fatia'))
      img.src = fatia
    })
  }

  async function aoFazerLogin() {
    setModalLogin(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setLogado(true)
      setUid(user.id)
      await gerarPDF(user.id)
    }
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
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ fatias: fatiasPequenas, nome, orientacao }),
        }
      )

      if (!response.ok) throw new Error(`Erro ${response.status}: ${await response.text()}`)
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      const base64Limpo = result.pdf.replace(/[^A-Za-z0-9+/=]/g, '')
      const pdfBytes = Uint8Array.from(atob(base64Limpo), c => c.charCodeAt(0))
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

      let imagemUrl = null
      if (imagemFile) {
        const { data: imgData } = await supabase.storage.from('paineis').upload(`${userId}/${Date.now()}_original.jpg`, imagemFile, { upsert: true })
        if (imgData) {
          const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(imgData.path)
          imagemUrl = urlData.publicUrl
        }
      }

      const pdfPath = `${userId}/${Date.now()}_${nome}.pdf`
      const { data: pdfData } = await supabase.storage.from('paineis').upload(pdfPath, pdfBlob, { upsert: true })
      let pdfUrl = null
      if (pdfData) {
        const { data: urlData } = supabase.storage.from('paineis').getPublicUrl(pdfData.path)
        pdfUrl = urlData.publicUrl
      }

      await supabase.from('paineis').insert({
        usuario_id: userId, nome,
        tipo: orientacao === 'paisagem' ? '6-paisagem' : '6-retrato',
        imagem_url: imagemUrl, pdf_url: pdfUrl, publicado_comunidade: false,
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `painel_${nome}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setPdfBaixado(true)

    } catch (err) {
      alert(`Erro ao gerar PDF: ${err}`)
    }
    setGerando(false)
  }

  const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '20px' }
  const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }
  const inputStyle: React.CSSProperties = { width: '100%', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '12px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
  const botaoDesabilitado = gerando || !nome.trim() || !imagem

  return (
    <div>
      {/* Banner Comunidade */}
      <div className="banner-comunidade" style={{ background: 'linear-gradient(135deg, #140033, #2d0066)', borderRadius: '20px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 8px 32px rgba(20,0,51,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>🖼️</div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#fff', margin: '0 0 3px 0' }}>Painéis prontos na comunidade</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Centenas de painéis feitos por artesãs — entre para baixar grátis</p>
          </div>
        </div>
        <a href="/login" className="banner-comunidade-btn" style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(255,51,204,0.4)', flexShrink: 0 }}>
          Ver painéis <ArrowRight size={13} />
        </a>
      </div>

      {/* Banner pós-download */}
      {pdfBaixado && (
        <div style={{ background: 'linear-gradient(135deg, #f0fff4, #e8f5e9)', border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '24px', marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#140033', margin: 0 }}>✅ PDF baixado com sucesso!</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>Isso é só o começo — veja tudo que a Encantiva oferece</p>
            </div>
          </div>
          <div className="pos-download-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {FUNCIONALIDADES.map((f, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e5e5e5' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${f.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={15} style={{ color: f.cor }} />
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#140033', margin: 0 }}>{f.label}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000055', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '14px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,51,204,0.3)' }}>
            Explorar tudo grátis <ArrowRight size={15} />
          </a>
        </div>
      )}

      {/* Como funciona */}
      <div style={{ background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid #ff33cc22', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '36px', flexShrink: 0 }}>🎨</div>
        <div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#140033', margin: '0 0 4px 0' }}>Como funciona</h2>
          {['1. Escolha a orientação (paisagem ou retrato)', '2. Faça upload da imagem (mínimo 3000×3000px)', '3. Dê um nome ao painel', '4. Veja o preview e baixe — conta grátis em 1 minuto!'].map((item, i) => (
            <p key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9900ff', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={12} style={{ flexShrink: 0 }} /> {item}
            </p>
          ))}
        </div>
      </div>

      {/* Toggle de orientação */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 2px 0' }}>📐 Orientação das folhas</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>
            {orientacao === 'paisagem' ? 'Paisagem — 2 colunas × 3 linhas — folha deitada' : 'Retrato — 3 colunas × 2 linhas — folha em pé'}
          </p>
        </div>
        <OrientacaoToggle value={orientacao} onChange={setOrientacao} />
      </div>

      {/* Upload */}
      <div className="upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid #ff33cc22' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Exemplo</p>
          <div style={{ position: 'relative', width: orientacao === 'paisagem' ? '120px' : '80px', height: orientacao === 'paisagem' ? '80px' : '120px' }}>
            <svg viewBox="0 0 120 80" width={orientacao === 'paisagem' ? '120' : '80'} height={orientacao === 'paisagem' ? '80' : '120'}
              style={{ transform: orientacao === 'retrato' ? 'rotate(90deg)' : 'none' }}>
              <defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff33cc" /><stop offset="100%" stopColor="#9900ff" /></linearGradient></defs>
              <rect width="120" height="80" fill="url(#grad2)" rx="4" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px dashed rgba(255,255,255,0.5)', borderRadius: '2px' }} />)}
            </div>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9900ff', fontWeight: 600, margin: 0, textAlign: 'center' }}>Grade {COLS}×{ROWS} — 6 folhas A4</p>
        </div>

        <div onClick={() => inputRef.current?.click()} style={{ ...cardStyle, marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', minHeight: '200px', border: `2px dashed ${imagem ? '#ff33cc55' : '#e5e5e5'}`, background: imagem ? '#fff5fd' : '#fafafa', transition: 'all 0.2s' }}>
          {imagem ? (
            <>
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden' }}>
                <NextImage src={imagem.src} fill style={{ objectFit: 'cover' }} alt="Imagem selecionada" unoptimized />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: '1px' }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ border: '1px solid rgba(255,255,255,0.6)' }} />)}
                </div>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 600, margin: 0 }}>✅ Clique para trocar</p>
            </>
          ) : (
            <>
              <ImageIcon size={32} style={{ color: '#00000022' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000044', margin: 0, textAlign: 'center' }}>Clique para fazer upload</p>
            </>
          )}
        </div>
      </div>

      {/* Dica */}
      <div style={{ background: '#f5f0ff', border: '1px solid #9900ff22', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>💡</span>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9900ff', margin: 0 }}>
          Use imagens <strong>PNG ou JPEG</strong> de no mínimo <strong>3000×3000px</strong> para melhor qualidade.
        </p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />

      {/* Nome */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>⚙️ Configurar painel</h2>
        <div>
          <label style={labelStyle}>Nome do painel</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Painel Unicórnio" style={inputStyle} />
        </div>
      </div>

      {/* Preview + Download */}
      {fatias.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>🔍 Preview — Grade {COLS}×{ROWS}</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>Clique em uma fatia para ampliar</p>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px', marginBottom: '16px' }}>
            {fatias.map((fatia, idx) => (
              <div key={idx} onClick={() => setPreviewAtivo(previewAtivo === idx ? null : idx)} style={{ position: 'relative', cursor: 'pointer', border: `2px solid ${previewAtivo === idx ? '#ff33cc' : 'transparent'}`, borderRadius: '8px', overflow: 'hidden' }}>
                <NextImage src={fatia} width={300} height={300} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${idx + 1}`} unoptimized />
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                  {idx + 1}/6
                </div>
              </div>
            ))}
          </div>

          {previewAtivo !== null && (
            <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #ff33cc33' }}>
              <NextImage src={fatias[previewAtivo]} width={800} height={800} style={{ width: '100%', height: 'auto', display: 'block' }} alt={`Fatia ${previewAtivo + 1} ampliada`} unoptimized />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', textAlign: 'center', padding: '8px', margin: 0 }}>Folha {previewAtivo + 1} de 6</p>
            </div>
          )}

          <button onClick={handleBotaoDownload} disabled={botaoDesabilitado} style={{
            width: '100%',
            background: botaoDesabilitado ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
            border: 'none', borderRadius: '14px', padding: '16px',
            color: botaoDesabilitado ? '#00000033' : '#fff',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
            cursor: botaoDesabilitado ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: botaoDesabilitado ? 'none' : '0 8px 32px rgba(255,51,204,0.3)',
            transition: 'all 0.2s',
          }}>
            <Download size={16} />
            {gerando ? 'Gerando PDF...' : !nome.trim() ? 'Dê um nome ao painel' : logado ? `Gerar PDF — ${orientacao === 'paisagem' ? '🖼️ Paisagem' : '📄 Retrato'}` : '🔓 Entre para baixar o PDF'}
          </button>

          {!logado && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', textAlign: 'center', margin: '10px 0 0 0' }}>
              É grátis — cria conta em menos de 1 minuto ✨
            </p>
          )}
        </div>
      )}

      {modalLogin && <ModalLogin onFechar={() => setModalLogin(false)} onSucesso={aoFazerLogin} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 480px) {
          .banner-comunidade { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .banner-comunidade-btn { width: 100% !important; justify-content: center !important; }
          .pos-download-grid { grid-template-columns: 1fr !important; }
          .upload-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}