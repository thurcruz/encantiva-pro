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
  const [assinaturaLoja, setAssinaturaLoja] = useState<string | null>(perfil?.assinatura_loja ?? null)
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(!!perfil?.assinatura_loja)

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Carrega assinatura existente no canvas
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

  function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setDesenhando(true)
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
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
    setAssinaturaLoja(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)

    // Captura assinatura do canvas se houver
    let assinaturaBase64 = assinaturaLoja
    if (temAssinatura && canvasRef.current) {
      assinaturaBase64 = canvasRef.current.toDataURL('image/png')
    }

    const { error } = await supabase
      .from('perfis')
      .upsert({
        id: usuarioId,
        nome_loja: nomeLoja || null,
        cpf_cnpj: cpfCnpj || null,
        telefone: telefone || null,
        endereco: endereco || null,
        assinatura_loja: assinaturaBase64 || null,
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
              type="text"
              value={nomeLoja}
              onChange={e => setNomeLoja(e.target.value)}
              placeholder="Ex: Encantiva Festas"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
          <div>
            <label style={labelStyle}>CPF / CNPJ</label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={e => setCpfCnpj(e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input
              type="text"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
          <div>
            <label style={labelStyle}>Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade - UF"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#ff33cc66'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            />
          </div>
        </div>
      </div>

      {/* Assinatura da loja */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
          ✍️ Sua assinatura
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
          Será usada automaticamente nos contratos gerados
        </p>

        <canvas
          ref={canvasRef}
          width={700}
          height={150}
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={() => setDesenhando(false)}
          onMouseLeave={() => setDesenhando(false)}
          onTouchStart={iniciarDesenho}
          onTouchMove={desenhar}
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

        {temAssinatura && (
          <button
            type="button"
            onClick={limparAssinatura}
            style={{
              background: 'none', border: 'none',
              color: '#ff33cc', fontFamily: 'Inter, sans-serif',
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', marginTop: '8px', padding: 0,
            }}
          >
            Limpar assinatura
          </button>
        )}
      </div>

      {erro && (
        <div style={{
          background: '#fff5f5', border: '1px solid #ff33cc33',
          borderRadius: '12px', padding: '14px 18px',
          color: '#ff33cc', fontFamily: 'Inter, sans-serif',
          fontSize: '14px', marginBottom: '16px',
        }}>
          {erro}
        </div>
      )}

      {sucesso && (
        <div style={{
          background: '#e6fff2', border: '1px solid #00aa5533',
          borderRadius: '12px', padding: '14px 18px',
          color: '#00aa55', fontFamily: 'Inter, sans-serif',
          fontWeight: 600, fontSize: '14px', marginBottom: '16px',
        }}>
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
    </form>
  )
}