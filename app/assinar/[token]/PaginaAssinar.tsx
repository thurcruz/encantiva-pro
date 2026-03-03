'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ContratoPublico {
  id: string
  usuario_id: string
  cliente_id: string | null
  cliente_nome: string | null
  evento_data: string
  evento_local: string | null
  evento_horario: string | null
  itens: { id: number; descricao: string; quantidade: number; valor: number }[]
  valor_total: number
  forma_pagamento: string | null
  valor_sinal: number
  regras: string | null
  status: string
  assinatura_dados: string | null
}

interface Props {
  contrato: ContratoPublico
}

export default function PaginaAssinar({ contrato }: Props) {
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [etapa, setEtapa] = useState<'dados' | 'contrato' | 'assinatura'>('dados')
  const [assinado, setAssinado] = useState(false)
  const [desenhando, setDesenhando] = useState(false)
  const [temAssinatura, setTemAssinatura] = useState(false)

  const [nome, setNome] = useState(contrato.cliente_nome ?? '')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [enderecoCliente, setEnderecoCliente] = useState('')

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

  async function assinarContrato() {
    if (!temAssinatura) return
    const canvas = canvasRef.current
    if (!canvas) return
    const assinaturaBase64 = canvas.toDataURL('image/png')

    let clienteId = contrato.cliente_id ?? null

    if (nome) {
      if (clienteId) {
        await supabase.from('clientes').update({
          telefone: telefone || undefined,
          email: emailCliente || undefined,
          endereco: enderecoCliente || undefined,
          atualizado_em: new Date().toISOString(),
        }).eq('id', clienteId)
      } else {
        const { data: novoCliente } = await supabase
          .from('clientes')
          .insert({
            usuario_id: contrato.usuario_id,
            nome,
            telefone: telefone || null,
            email: emailCliente || null,
            endereco: enderecoCliente || null,
          })
          .select()
          .single()

        if (novoCliente) clienteId = novoCliente.id
      }
    }

    const { error } = await supabase.from('contratos').update({
      status: 'assinado',
      assinado_em: new Date().toISOString(),
      assinatura_dados: assinaturaBase64,
      cliente_id: clienteId,
      cliente_nome: nome,
      cliente_cpf: cpf,
      cliente_telefone: telefone,
      cliente_email: emailCliente,
      cliente_endereco: enderecoCliente,
    }).eq('id', contrato.id)

    if (!error) setAssinado(true)
  }

  const dataEvento = new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')

  const inputStyle = {
    width: '100%',
    background: '#f9f9f9',
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

  // Tela de sucesso
  if (assinado) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e6fff2', border: '1px solid #00aa5533', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px' }}>
            ✅
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#140033', margin: '0 0 12px 0' }}>
            Contrato assinado!
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000066', margin: 0, lineHeight: 1.6 }}>
            Sua assinatura foi registrada com sucesso. O contratante receberá a confirmação.
          </p>
        </div>
      </div>
    )
  }

  // Já assinado
  if (contrato.status === 'assinado') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#140033', margin: '0 0 12px 0' }}>
            Contrato já assinado
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000066', margin: 0 }}>
            Este contrato já foi assinado anteriormente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9' }}>

      {/* Header */}
      <div style={{ background: '#140033', padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.svg" width="28" height="21" alt="Encantiva" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px', color: '#fff' }}>
            Encantiva
          </span>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['dados', 'contrato', 'assinatura'] as const).map((e, idx) => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: etapa === e ? '28px' : '10px',
                height: etapa === e ? '28px' : '10px',
                borderRadius: '50%',
                background: etapa === e ? '#ff33cc' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>
                {etapa === e && (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#fff' }}>
                    {idx + 1}
                  </span>
                )}
              </div>
              {idx < 2 && <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Etapa 1 — Dados */}
        {etapa === 'dados' && (
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 8px 0' }}>
              Seus dados
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 28px 0' }}>
              Preencha seus dados para assinar o contrato
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CPF</label>
                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="seu@email.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Endereço</label>
                <input type="text" value={enderecoCliente} onChange={e => setEnderecoCliente(e.target.value)} placeholder="Rua, número, bairro..." style={inputStyle} />
              </div>
            </div>

            <button
              onClick={() => { if (nome.trim()) setEtapa('contrato') }}
              disabled={!nome.trim()}
              style={{
                width: '100%', marginTop: '28px',
                background: nome.trim() ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#e5e5e5',
                border: 'none', borderRadius: '14px', padding: '16px',
                color: nome.trim() ? '#fff' : '#00000033',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: nome.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Continuar para o contrato →
            </button>
          </div>
        )}

        {/* Etapa 2 — Contrato */}
        {etapa === 'contrato' && (
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 8px 0' }}>
              Revise o contrato
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Leia atentamente antes de assinar
            </p>

            {/* Evento */}
            <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#00000044', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>Evento</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={labelStyle}>Data</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 600 }}>{dataEvento}</span>
                </div>
                {contrato.evento_horario && (
                  <div>
                    <span style={labelStyle}>Horário</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 600 }}>{contrato.evento_horario}</span>
                  </div>
                )}
                {contrato.evento_local && (
                  <div>
                    <span style={labelStyle}>Local</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 600 }}>{contrato.evento_local}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#00000044', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>Itens</p>
              {contrato.itens.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{item.descricao} × {item.quantidade}</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 600 }}>
                    R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #f0f0f0' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>Total</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#140033' }}>
                  R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Regras */}
            {contrato.regras && (
              <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#00000044', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>Regras</p>
                <pre style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000088', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {contrato.regras}
                </pre>
              </div>
            )}

            <button onClick={() => setEtapa('assinatura')} style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
              border: 'none', borderRadius: '14px', padding: '16px',
              color: '#fff', fontFamily: 'Inter, sans-serif',
              fontWeight: 700, fontSize: '15px', cursor: 'pointer',
            }}>
              Li e concordo — Assinar →
            </button>

            <button onClick={() => setEtapa('dados')} style={{
              width: '100%', marginTop: '10px',
              background: 'none', border: 'none',
              color: '#00000044', fontFamily: 'Inter, sans-serif',
              fontSize: '14px', cursor: 'pointer', padding: '8px',
            }}>
              ← Voltar
            </button>
          </div>
        )}

        {/* Etapa 3 — Assinatura */}
        {etapa === 'assinatura' && (
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 8px 0' }}>
              Assine abaixo
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Use o dedo ou mouse para assinar
            </p>

            <canvas
              ref={canvasRef}
              width={700}
              height={200}
              onMouseDown={iniciarDesenho}
              onMouseMove={desenhar}
              onMouseUp={() => setDesenhando(false)}
              onMouseLeave={() => setDesenhando(false)}
              onTouchStart={e => { e.preventDefault(); iniciarDesenho(e) }}
              onTouchMove={e => { e.preventDefault(); desenhar(e) }}
              onTouchEnd={() => setDesenhando(false)}
              style={{
                width: '100%', height: '200px',
                border: `2px dashed ${temAssinatura ? '#ff33cc55' : '#e5e5e5'}`,
                borderRadius: '16px', cursor: 'crosshair', display: 'block',
                touchAction: 'none',
                background: temAssinatura ? '#fff5fd' : '#fafafa',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000033', margin: 0 }}>
                {temAssinatura ? '✅ Assinatura registrada' : 'Área em branco'}
              </p>
              {temAssinatura && (
                <button onClick={limparAssinatura} type="button" style={{
                  background: 'none', border: 'none', color: '#ff33cc',
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer', padding: 0,
                }}>
                  Limpar
                </button>
              )}
            </div>

            <button
              onClick={assinarContrato}
              disabled={!temAssinatura}
              style={{
                width: '100%',
                background: temAssinatura ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#e5e5e5',
                border: 'none', borderRadius: '14px', padding: '16px',
                color: temAssinatura ? '#fff' : '#00000033',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: temAssinatura ? 'pointer' : 'not-allowed',
                boxShadow: temAssinatura ? '0 8px 32px rgba(255,51,204,0.3)' : 'none',
              }}
            >
              Assinar contrato ✍️
            </button>

            <button onClick={() => setEtapa('contrato')} style={{
              width: '100%', marginTop: '10px',
              background: 'none', border: 'none',
              color: '#00000044', fontFamily: 'Inter, sans-serif',
              fontSize: '14px', cursor: 'pointer', padding: '8px',
            }}>
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}