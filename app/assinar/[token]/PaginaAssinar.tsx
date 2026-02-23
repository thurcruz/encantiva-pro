'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  contrato: {
    id: string
    cliente_nome: string | null
    cliente_cpf: string | null
    cliente_telefone: string | null
    cliente_email: string | null
    cliente_endereco: string | null
    evento_data: string
    evento_local: string | null
    evento_horario: string | null
    itens: { id: number; descricao: string; quantidade: number; valor: number }[]
    valor_total: number
    forma_pagamento: string | null
    valor_sinal: number
    regras: string | null
    status: string
    assinado_em: string | null
    perfil_loja?: {
      nome_loja: string | null
      cpf_cnpj: string | null
      telefone: string | null
      endereco: string | null
    }
  }
}

type Etapa = 'dados' | 'contrato' | 'assinatura'

export default function PaginaAssinar({ contrato }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(false)
  const [assinando, setAssinando] = useState(false)
  const [assinado, setAssinado] = useState(contrato.status === 'assinado')
  const [etapa, setEtapa] = useState<Etapa>('dados')

  // Dados do cliente
  const [nome, setNome] = useState(contrato.cliente_nome ?? '')
  const [cpf, setCpf] = useState(contrato.cliente_cpf ?? '')
  const [telefone, setTelefone] = useState(contrato.cliente_telefone ?? '')
  const [email, setEmail] = useState(contrato.cliente_email ?? '')
  const [endereco, setEndereco] = useState(contrato.cliente_endereco ?? '')
  const [erroDados, setErroDados] = useState('')

  const supabase = createClient()

  function avancarParaContrato() {
    if (!nome.trim()) return setErroDados('Por favor, informe seu nome completo.')
    setErroDados('')
    setEtapa('contrato')
  }

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
  }

  async function assinar() {
    const canvas = canvasRef.current
    if (!canvas || !temAssinatura) return
    setAssinando(true)

    const assinaturaBase64 = canvas.toDataURL('image/png')

    await supabase
      .from('contratos')
      .update({
        status: 'assinado',
        assinado_em: new Date().toISOString(),
        assinatura_dados: assinaturaBase64,
        cliente_nome: nome,
        cliente_cpf: cpf || null,
        cliente_telefone: telefone || null,
        cliente_email: email || null,
        cliente_endereco: endereco || null,
      })
      .eq('id', contrato.id)

    setAssinado(true)
    setAssinando(false)
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
    marginBottom: '16px',
  }

  // Tela de sucesso
  if (assinado) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f9f9f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: '#e6fff2', border: '2px solid #00aa5533',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 24px',
          }}>✅</div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', margin: '0 0 8px 0' }}>
            Contrato assinado!
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000066' }}>
            Obrigado, {nome}! Seu contrato foi assinado com sucesso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #140033, #1a0044)', padding: '28px 40px', textAlign: 'center' }}>
        <svg viewBox="0 0 144 108" width="36" height="27" style={{ marginBottom: '10px' }}>
          <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
          <circle fill="#9900ff" cx="108" cy="36" r="36"/>
        </svg>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#fff', margin: '0 0 4px 0' }}>
          Contrato de Locação
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66', margin: 0 }}>
          {etapa === 'dados' ? 'Preencha seus dados' : etapa === 'contrato' ? 'Leia o contrato com atenção' : 'Assine digitalmente'}
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {(['dados', 'contrato', 'assinatura'] as Etapa[]).map((e, i) => (
            <div key={e} style={{
              width: etapa === e ? '24px' : '8px',
              height: '8px',
              borderRadius: '100px',
              background: etapa === e ? '#ff33cc' : '#ffffff33',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ETAPA 1 — Dados do cliente */}
        {etapa === 'dados' && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
                👤 Seus dados pessoais
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Nome completo *</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>CPF</label>
                    <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefone</label>
                    <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Endereço</label>
                  <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro..." style={inputStyle} />
                </div>
              </div>
            </div>

            {erroDados && (
              <div style={{ background: '#fff5f5', border: '1px solid #ff33cc33', borderRadius: '12px', padding: '12px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '16px' }}>
                {erroDados}
              </div>
            )}

            <button
              onClick={avancarParaContrato}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: '14px', padding: '16px',
                color: '#fff', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              }}
            >
              Continuar para o contrato →
            </button>
          </div>
        )}

        {/* ETAPA 2 — Contrato */}
        {etapa === 'contrato' && (
          <div>
            {/* Evento */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
                📅 Evento
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={labelStyle}>Data</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>
                    {new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {contrato.evento_horario && (
                  <div>
                    <span style={labelStyle}>Horário</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{contrato.evento_horario}</span>
                  </div>
                )}
                {contrato.evento_local && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={labelStyle}>Local</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{contrato.evento_local}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div style={cardStyle}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
                🎪 Itens locados
              </h2>
              {contrato.itens.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>
                    {item.quantidade}x {item.descricao}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 600 }}>
                    R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>Total</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#9900ff' }}>
                  R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
                </span>
              </div>
              {Number(contrato.valor_sinal) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055' }}>Sinal</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055' }}>
                    R$ {Number(contrato.valor_sinal).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>

            {/* Regras */}
            {contrato.regras && (
              <div style={cardStyle}>
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
                  📜 Regras e responsabilidades
                </h2>
                <pre style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000088', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {contrato.regras}
                </pre>
              </div>
            )}

            <button
              onClick={() => setEtapa('assinatura')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: '14px', padding: '16px',
                color: '#fff', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              }}
            >
              Li e concordo — Assinar →
            </button>
          </div>
        )}

        {/* ETAPA 3 — Assinatura */}
        {etapa === 'assinatura' && (
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
              ✍️ Assinatura digital
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
              Desenhe sua assinatura no campo abaixo
            </p>

            <canvas
              ref={canvasRef}
              width={700}
              height={160}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={() => setDesenhando(false)}
              onMouseLeave={() => setDesenhando(false)}
              onTouchStart={iniciarDesenho}
              onTouchMove={desenhar}
              onTouchEnd={() => setDesenhando(false)}
              style={{
                width: '100%', height: '160px',
                border: '2px dashed #e5e5e5', borderRadius: '12px',
                cursor: 'crosshair', display: 'block',
                touchAction: 'none', background: '#fafafa',
              }}
            />

            {temAssinatura && (
              <button onClick={limparAssinatura} style={{
                background: 'none', border: 'none', color: '#ff33cc',
                fontFamily: 'Inter, sans-serif', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', marginTop: '8px', padding: 0,
              }}>
                Limpar assinatura
              </button>
            )}

            <button
              onClick={assinar}
              disabled={!temAssinatura || assinando}
              style={{
                width: '100%',
                background: temAssinatura ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f0f0f0',
                border: 'none', borderRadius: '12px', padding: '16px',
                color: temAssinatura ? '#fff' : '#00000033',
                fontFamily: 'Inter, sans-serif', fontWeight: 700,
                fontSize: '16px', cursor: temAssinatura ? 'pointer' : 'not-allowed',
                marginTop: '16px',
              }}
            >
              {assinando ? 'Assinando...' : 'Assinar contrato'}
            </button>

            <button onClick={() => setEtapa('contrato')} style={{
              width: '100%', background: 'none', border: 'none',
              color: '#00000044', fontFamily: 'Inter, sans-serif',
              fontSize: '13px', cursor: 'pointer', marginTop: '8px', padding: '8px',
            }}>
              ← Voltar para o contrato
            </button>
          </div>
        )}
      </div>
    </div>
  )
}