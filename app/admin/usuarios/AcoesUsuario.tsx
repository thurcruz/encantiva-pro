'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Check, X, ExternalLink } from 'lucide-react'
import type { Assinatura } from './types'

interface Props {
  usuarioId: string
  email: string
  assinatura: Assinatura | null
}

const PLANOS = ['free', 'trial', 'iniciante', 'avancado', 'elite']
const STATUS_OPTIONS = ['active', 'trial', 'inactive', 'cancelled', 'overdue']

export default function AcoesUsuario({ usuarioId, email, assinatura }: Props) {
  const supabase = createClient()
  const [aberto, setAberto] = useState(false)

  const [plano, setPlano] = useState(assinatura?.plano ?? 'free')
  const [status, setStatus] = useState(assinatura?.status ?? 'inactive')
  const [expiraEm, setExpiraEm] = useState(
    assinatura?.expira_em ? assinatura.expira_em.slice(0, 10) : ''
  )
  const [trialExpira, setTrialExpira] = useState(
    assinatura?.trial_expira_em ? assinatura.trial_expira_em.slice(0, 10) : ''
  )
  const [isBeta, setIsBeta] = useState(assinatura?.is_beta ?? false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function salvar() {
    setSalvando(true); setErro(null); setSucesso(false)
    try {
      const payload = {
        plano,
        status,
        expira_em: expiraEm || null,
        trial_expira_em: trialExpira || null,
        is_beta: isBeta,
      }
      if (assinatura?.id) {
        const { error } = await supabase.from('assinaturas').update(payload).eq('id', assinatura.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('assinaturas').insert({ usuario_id: usuarioId, ...payload })
        if (error) throw error
      }
      setSucesso(true)
      setTimeout(() => { setAberto(false); setSucesso(false) }, 1200)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
    borderRadius: '10px', padding: '10px 14px', color: '#fff',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#ffffff44', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.8px',
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '8px', color: '#ffffff66', cursor: 'pointer', transition: 'all .15s' }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = '#ff33cc22'; b.style.borderColor = '#ff33cc44'; b.style.color = '#ff33cc'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = '#ffffff0d'; b.style.borderColor = '#ffffff18'; b.style.color = '#ffffff66'
        }}
      >
        <Edit2 size={13} />
      </button>

      {aberto && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setAberto(false)}
        >
          <div style={{ background: '#1a0044', border: '1px solid #ffffff18', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff', margin: 0 }}>
                  Editar assinatura
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff55', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email}
                </p>
              </div>
              <button
                onClick={() => setAberto(false)}
                style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #ffffff18', background: '#ffffff0d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff66', flexShrink: 0, marginLeft: '12px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Plano + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Plano</label>
                  <select value={plano} onChange={e => setPlano(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {PLANOS.map(p => <option key={p} value={p} style={{ background: '#1a0044' }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#1a0044' }}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Expira em</label>
                  <input type="date" value={expiraEm} onChange={e => setExpiraEm(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Trial expira em</label>
                  <input type="date" value={trialExpira} onChange={e => setTrialExpira(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Beta toggle */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff08', borderRadius: '10px', padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => setIsBeta(!isBeta)}
              >
                <div style={{ width: 20, height: 20, borderRadius: '6px', border: `2px solid ${isBeta ? '#cc66ff' : '#ffffff33'}`, background: isBeta ? '#cc66ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                  {isBeta && <Check size={11} style={{ color: '#fff' }} />}
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>Usuário Beta</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff44', margin: 0 }}>Acesso especial à plataforma</p>
                </div>
              </div>

              {/* IDs Asaas (somente leitura) */}
              {(assinatura?.asaas_customer_id || assinatura?.asaas_subscription_id) && (
                <div style={{ background: '#ffffff05', border: '1px solid #ffffff0d', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#ffffff33', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Asaas</p>
                  {assinatura.asaas_customer_id && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ffffff55', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Customer: {assinatura.asaas_customer_id}
                      </p>
                      <a href={`https://app.asaas.com/customers/${assinatura.asaas_customer_id}`} target="_blank" rel="noreferrer" style={{ color: '#ff33cc', flexShrink: 0 }}>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  {assinatura.asaas_subscription_id && (
                    <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ffffff44', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Sub: {assinatura.asaas_subscription_id}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback */}
              {erro && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff4444', margin: 0, background: '#ff444411', borderRadius: '8px', padding: '10px 12px' }}>
                  {erro}
                </p>
              )}
              {sucesso && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00ff88', margin: 0, background: '#00ff8811', borderRadius: '8px', padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                  ✓ Salvo com sucesso!
                </p>
              )}

              <button
                onClick={salvar}
                disabled={salvando}
                style={{ background: salvando ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={15} />
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}