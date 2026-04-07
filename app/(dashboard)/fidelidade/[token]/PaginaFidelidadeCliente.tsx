'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Cartao {
  id: string
  usuario_id: string
  nome: string
  descricao: string | null
  total_selos: number
  premio: string
  cor: string | null
  foto_url: string | null
}

interface Participante {
  id: string
  nome: string
  telefone: string | null
  selos: number
  resgatado: boolean
  resgatado_em: string | null
}

interface Props {
  cartao: Cartao
}

export default function PaginaFidelidadeCliente({ cartao }: Props) {
  const supabase = createClient()
  const cor = cartao.cor ?? '#ff33cc'

  const [etapa, setEtapa] = useState<'inicio' | 'cadastro' | 'cartao'>('inicio')
  const [participante, setParticipante] = useState<Participante | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function buscarOuCadastrar() {
    if (!nome.trim()) return setErro('Informe seu nome')
    setCarregando(true); setErro('')

    // Tentar buscar por nome + cartao
    const { data: existente } = await supabase
      .from('fidelidade_clientes')
      .select('*')
      .eq('cartao_id', cartao.id)
      .ilike('nome', nome.trim())
      .maybeSingle()

    if (existente) {
      setParticipante(existente as Participante)
      setEtapa('cartao')
    } else {
      // Cadastrar novo
      const { data, error } = await supabase
        .from('fidelidade_clientes')
        .insert({
          cartao_id: cartao.id,
          usuario_id: cartao.usuario_id,
          nome: nome.trim(),
          telefone: telefone || null,
          selos: 0,
          resgatado: false,
        })
        .select()
        .single()

      if (error) {
        setErro('Erro ao cadastrar. Tente novamente.')
      } else {
        setParticipante(data as Participante)
        setEtapa('cartao')
      }
    }
    setCarregando(false)
  }

  const pct = participante ? Math.min(100, (participante.selos / cartao.total_selos) * 100) : 0
  const selosPreenchidos = participante?.selos ?? 0
  const concluido = selosPreenchidos >= cartao.total_selos

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#f9f9f9', border: '1px solid #e5e5e5',
    borderRadius: '12px', padding: '12px 16px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header colorido */}
      <div style={{ background: cor, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {cartao.foto_url && (
              <div style={{ width: 48, height: 48, borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', position: 'relative', flexShrink: 0 }}>
                <Image src={cartao.foto_url} fill style={{ objectFit: 'cover' }} alt={cartao.nome} unoptimized />
              </div>
            )}
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cartao Fidelidade</p>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{cartao.nome}</h1>
            </div>
          </div>
          {cartao.descricao && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{cartao.descricao}</p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px' }}>

        {/* ETAPA INICIO */}
        {etapa === 'inicio' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🎁</div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px' }}>Acesse seu cartao</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Acumule <strong style={{ color: '#140033' }}>{cartao.total_selos} selos</strong> e ganhe <strong style={{ color: cor }}>{cartao.premio}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEtapa('cadastro')}
                style={{ flex: 1, background: cor, border: 'none', borderRadius: '14px', padding: '16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Entrar no cartao
              </button>
            </div>
          </div>
        )}

        {/* ETAPA CADASTRO */}
        {etapa === 'cadastro' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#140033', margin: '0 0 6px' }}>Seus dados</h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Ja cadastrada? Digite o mesmo nome e veja seus selos!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome completo *</label>
                <input style={inputStyle} placeholder="Seu nome completo" value={nome} onChange={e => setNome(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>WhatsApp (opcional)</label>
                <input style={inputStyle} placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} type="tel" />
              </div>
              {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{erro}</p>}
              <button onClick={buscarOuCadastrar} disabled={carregando || !nome.trim()}
                style={{ background: carregando || !nome.trim() ? '#e5e5e5' : cor, border: 'none', borderRadius: '14px', padding: '16px', color: carregando || !nome.trim() ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: carregando || !nome.trim() ? 'not-allowed' : 'pointer' }}>
                {carregando ? 'Carregando...' : 'Ver meu cartao'}
              </button>
              <button onClick={() => setEtapa('inicio')}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer', padding: '4px' }}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ETAPA CARTAO */}
        {etapa === 'cartao' && participante && (
          <div>
            {/* Cartao visual com selos */}
            <div style={{ background: cor, borderRadius: '20px', padding: '24px', marginBottom: '16px', position: 'relative', overflow: 'hidden', boxShadow: `0 8px 32px ${cor}40` }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>Ola, {participante.nome.split(' ')[0]}!</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>{cartao.nome}</p>
                </div>
                {concluido && (
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '6px 14px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    🎉 Completo!
                  </div>
                )}
              </div>

              {/* Grid de selos */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {Array.from({ length: cartao.total_selos }).map((_, i) => {
                  const preenchido = i < selosPreenchidos
                  return (
                    <div key={i} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: preenchido ? '#fff' : 'rgba(255,255,255,0.15)',
                      border: `2px solid ${preenchido ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                    }}>
                      {preenchido && <span style={{ fontSize: '18px', color: cor }}>★</span>}
                    </div>
                  )
                })}
              </div>

              {/* Progresso */}
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', height: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: '999px', transition: 'width .5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{selosPreenchidos} de {cartao.total_selos} selos</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{cartao.total_selos - selosPreenchidos > 0 ? `Faltam ${cartao.total_selos - selosPreenchidos}` : 'Completo!'}</span>
              </div>
            </div>

            {/* Premio */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🎁</div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 3px' }}>Premio ao completar</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 800, color: '#111827', margin: 0 }}>{cartao.premio}</p>
                </div>
              </div>
              {participante.resgatado && (
                <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                  ✅ Premio resgatado em {participante.resgatado_em ? new Date(participante.resgatado_em).toLocaleDateString('pt-BR') : ''}
                </div>
              )}
            </div>

            <button onClick={() => { setEtapa('inicio'); setParticipante(null); setNome(''); setTelefone('') }}
              style={{ width: '100%', background: 'none', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '12px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        )}

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '24px' }}>
          Powered by <strong style={{ color: '#ff33cc' }}>Encantiva Pro</strong>
        </p>
      </div>
    </div>
  )
}