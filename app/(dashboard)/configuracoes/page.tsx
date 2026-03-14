'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Ícones ───────────────────────────────────────────────
const IconSave   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h5.5L12 4.5V11a1 1 0 0 1-1 1z"/><path d="M8 12v-4H5v4M5 2v3h3"/></svg>
const IconEraser = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10h8M8.5 1.5l2 2-6 6H2.5v-2l6-6z"/></svg>
const IconCheck  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>

interface Perfil {
  nome_loja: string | null; cpf_cnpj: string | null
  telefone: string | null; endereco: string | null; assinatura_loja: string | null
}
interface Props { usuarioId: string; perfil: Perfil | null }

const input: React.CSSProperties = {
  width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
  borderRadius: '10px', padding: '10px 12px', color: '#111827',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase',
}

export default function FormularioPerfil({ usuarioId, perfil }: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [nomeLoja, setNomeLoja]   = useState(perfil?.nome_loja ?? '')
  const [cpfCnpj, setCpfCnpj]     = useState(perfil?.cpf_cnpj ?? '')
  const [telefone, setTelefone]   = useState(perfil?.telefone ?? '')
  const [endereco, setEndereco]   = useState(perfil?.endereco ?? '')
  const [assinaturaLoja, setAssinaturaLoja] = useState<string | null>(perfil?.assinatura_loja ?? null)
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(!!perfil?.assinatura_loja)
  const [salvando, setSalvando]   = useState(false)
  const [sucesso, setSucesso]     = useState(false)
  const [erro, setErro]           = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Linha guia
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, canvas.height - 28)
    ctx.lineTo(canvas.width - 20, canvas.height - 28)
    ctx.stroke()
    ctx.setLineDash([])
    // Carrega assinatura existente
    if (perfil?.assinatura_loja) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = perfil.assinatura_loja
    }
  }, [])

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function iniciarDesenho(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setDesenhando(true)
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!desenhando) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setTemAssinatura(true)
  }

  function finalizarDesenho() { setDesenhando(false) }

  function limparAssinatura() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, canvas.height - 28)
    ctx.lineTo(canvas.width - 20, canvas.height - 28)
    ctx.stroke()
    ctx.setLineDash([])
    setTemAssinatura(false)
    setAssinaturaLoja(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true); setErro(null); setSucesso(false)

    let assinaturaBase64 = assinaturaLoja
    if (temAssinatura && canvasRef.current) {
      assinaturaBase64 = canvasRef.current.toDataURL('image/png')
    }

    const { error } = await supabase.from('perfis').upsert({
      id: usuarioId,
      nome_loja: nomeLoja || null,
      cpf_cnpj: cpfCnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      assinatura_loja: assinaturaBase64 || null,
      atualizado_em: new Date().toISOString(),
    })

    if (error) { setErro('Erro ao salvar. Tente novamente.') }
    else { setSucesso(true); setTimeout(() => setSucesso(false), 3000) }
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Dados da loja ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '18px 20px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 14px' }}>
          Dados da loja
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={lbl}>Nome da loja *</label>
            <input type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} placeholder="Ex: Encantiva Festas" style={input}
              onFocus={e => (e.target.style.borderColor = '#ff33cc')}
              onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>CPF / CNPJ</label>
              <input type="text" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" style={input}
                onFocus={e => (e.target.style.borderColor = '#ff33cc')}
                onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
            </div>
            <div>
              <label style={lbl}>Telefone</label>
              <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={input}
                onFocus={e => (e.target.style.borderColor = '#ff33cc')}
                onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
            </div>
          </div>
          <div>
            <label style={lbl}>Endereço</label>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" style={input}
              onFocus={e => (e.target.style.borderColor = '#ff33cc')}
              onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
          </div>
        </div>
      </div>

      {/* ── Assinatura ── */}
      <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>
            Sua assinatura
          </p>
          {temAssinatura && (
            <button type="button" onClick={limparAssinatura} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              <IconEraser /> Limpar
            </button>
          )}
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 12px' }}>
          Usada automaticamente nos contratos gerados
        </p>
        <div style={{ border: `1.5px solid ${temAssinatura ? '#ffd6f5' : '#e8e8ec'}`, borderRadius: '10px', overflow: 'hidden', background: '#fff', touchAction: 'none', cursor: 'crosshair', transition: 'border-color .2s' }}>
          <canvas
            ref={canvasRef}
            width={700}
            height={150}
            style={{ width: '100%', height: '130px', display: 'block' }}
            onMouseDown={iniciarDesenho}
            onMouseMove={desenhar}
            onMouseUp={finalizarDesenho}
            onMouseLeave={finalizarDesenho}
            onTouchStart={iniciarDesenho}
            onTouchMove={desenhar}
            onTouchEnd={finalizarDesenho}
          />
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db', margin: '6px 0 0', textAlign: 'center' }}>
          Desenhe com o mouse ou dedo
        </p>
      </div>

      {/* Feedback */}
      {erro && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '10px 14px', color: '#dc2626', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
          {erro}
        </div>
      )}
      {sucesso && (
        <div style={{ background: '#f0fdf9', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', color: '#059669', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconCheck /> Dados salvos com sucesso!
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={salvando}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          width: '100%', background: salvando ? '#f3f4f6' : '#ff33cc', border: 'none',
          borderRadius: '999px', padding: '13px',
          color: salvando ? '#9ca3af' : '#fff',
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
          cursor: salvando ? 'not-allowed' : 'pointer', transition: 'background .2s',
        }}
      >
        <IconSave /> {salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  )
}