'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'

interface Perfil {
  nome_loja: string | null
  cpf_cnpj: string | null
  telefone: string | null
  endereco: string | null
  assinatura_loja: string | null
}

interface Props {
  usuarioId: string
  perfil: Perfil | null
}

export default function FormularioPerfil({ usuarioId, perfil }: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [nomeLoja, setNomeLoja] = useState(perfil?.nome_loja ?? '')
  const [cpfCnpj, setCpfCnpj] = useState(perfil?.cpf_cnpj ?? '')
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '')
  const [endereco, setEndereco] = useState(perfil?.endereco ?? '')
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(!!perfil?.assinatura_loja)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (perfil?.assinatura_loja && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = perfil.assinatura_loja
    }
  }, [])

  function getCoords(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setDesenhando(true)
    const { x, y } = getCoords(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoords(e, canvas)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#140033'
    ctx.lineTo(x, y)
    ctx.stroke()
    setTemAssinatura(true)
  }

  function limparAssinatura() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)

    let assinaturaBase64: string | null = perfil?.assinatura_loja ?? null
    if (canvasRef.current && temAssinatura) {
      assinaturaBase64 = canvasRef.current.toDataURL('image/png')
    } else if (!temAssinatura) {
      assinaturaBase64 = null
    }

    const { error } = await supabase.from('perfis').upsert({
      id: usuarioId,
      nome_loja: nomeLoja || null,
      cpf_cnpj: cpfCnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      assinatura_loja: assinaturaBase64,
      atualizado_em: new Date().toISOString(),
    })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#140033',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000055',
    marginBottom: '6px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Dados da loja */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          🏪 Dados da loja
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome da loja *</label>
            <input
              type="text" value={nomeLoja}
              onChange={e => setNomeLoja(e.target.value)}
              placeholder="Ex: Encantiva Festas"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>CPF / CNPJ</label>
              <input
                type="text" value={cpfCnpj}
                onChange={e => setCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                type="text" value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Endereço</label>
            <input
              type="text" value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
        </div>
      </div>

      {/* Assinatura */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
          ✍️ Sua assinatura
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
          Será usada automaticamente nos contratos gerados. Assine com o dedo no celular ou com o mouse.
        </p>

        <canvas
          ref={canvasRef}
          width={700}
          height={150}
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={() => setDesenhando(false)}
          onMouseLeave={() => setDesenhando(false)}
          onTouchStart={e => { e.preventDefault(); iniciarDesenho(e) }}
          onTouchMove={e => { e.preventDefault(); desenhar(e) }}
          onTouchEnd={() => setDesenhando(false)}
          style={{
            width: '100%',
            height: '150px',
            border: `2px dashed ${temAssinatura ? '#ff33cc55' : '#e5e5e5'}`,
            borderRadius: '12px',
            cursor: 'crosshair',
            display: 'block',
            touchAction: 'none',
            background: temAssinatura ? '#fff5fd' : '#fafafa',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000033', margin: 0 }}>
            {temAssinatura ? '✅ Assinatura registrada' : 'Área em branco — desenhe sua assinatura acima'}
          </p>
          {temAssinatura && (
            <button
              type="button"
              onClick={limparAssinatura}
              style={{
                background: 'none', border: 'none',
                color: '#ff33cc', fontFamily: 'Inter, sans-serif',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', padding: 0,
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ background: '#fff5f5', border: '1px solid #ff33cc33', borderRadius: '12px', padding: '14px 18px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '16px' }}>
          {erro}
        </div>
      )}

      {sucesso && (
        <div style={{ background: '#e6fff2', border: '1px solid #00aa5533', borderRadius: '12px', padding: '14px 18px', color: '#00aa55', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
          ✅ Dados salvos com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={salvando}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%',
          background: salvando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
          border: 'none', borderRadius: '14px', padding: '16px',
          color: salvando ? '#00000033' : '#fff',
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
          cursor: salvando ? 'not-allowed' : 'pointer',
        }}
      >
        <Save size={16} />
        {salvando ? 'Salvando...' : 'Salvar configurações'}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}