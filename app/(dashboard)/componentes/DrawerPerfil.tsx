'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, Save, Crown, CheckCircle, Clock, AlertTriangle, XCircle,
  LogOut, User, Phone, MapPin, FileText, ChevronRight
} from 'lucide-react'

interface Perfil {
  nome_loja: string | null
  cpf_cnpj: string | null
  telefone: string | null
  endereco: string | null
}

interface Props {
  aberto: boolean
  onFechar: () => void
  usuarioId: string
  email: string
  inicial: string
  perfil: Perfil | null
  status: string | null
  expiraEm: string | null
  trialExpiraEm: string | null
  assinaturaAtiva: boolean
  temSubscriptionId: boolean
  isAdmin: boolean
  nomePlano: string
}

export default function DrawerPerfil({
  aberto, onFechar, usuarioId, email, inicial, perfil,
  status, expiraEm, trialExpiraEm, assinaturaAtiva, temSubscriptionId, isAdmin, nomePlano,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [aba, setAba] = useState<'perfil' | 'plano'>('perfil')
  const [nomeLoja, setNomeLoja] = useState(perfil?.nome_loja ?? '')
  const [cpfCnpj, setCpfCnpj] = useState(perfil?.cpf_cnpj ?? '')
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '')
  const [endereco, setEndereco] = useState(perfil?.endereco ?? '')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [confirmarCancel, setConfirmarCancel] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [mensagemCancel, setMensagemCancel] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const agora = new Date()
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > agora : false
  const dataExpiracao = expiraEm ? new Date(expiraEm) : null
  const diasRestantes = dataExpiracao
    ? Math.max(0, Math.ceil((dataExpiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const badge = (() => {
    if (isAdmin) return { label: 'Admin', color: '#9900ff', bg: '#f5f0ff', icon: <Crown size={13} /> }
    if (trialAtivo) return { label: 'Trial ativo', color: '#cc8800', bg: '#fff8ec', icon: <Clock size={13} /> }
    if (status === 'ativo') return { label: 'Ativo', color: '#007744', bg: '#ecfff5', icon: <CheckCircle size={13} /> }
    if (status === 'cancelando') return { label: 'Cancela ao expirar', color: '#cc5500', bg: '#fff5ec', icon: <AlertTriangle size={13} /> }
    if (status === 'cancelado') return { label: 'Cancelado', color: '#cc0000', bg: '#fff0f0', icon: <XCircle size={13} /> }
    return { label: 'Inativo', color: '#888', bg: '#f5f5f5', icon: <XCircle size={13} /> }
  })()

  async function salvarPerfil() {
    setSalvando(true)
    await supabase.from('perfis').upsert({
      id: usuarioId,
      nome_loja: nomeLoja || null,
      cpf_cnpj: cpfCnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      atualizado_em: new Date().toISOString(),
    })
    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2500)
    router.refresh()
  }

  async function cancelarAssinatura() {
    setCancelando(true)
    const res = await fetch('/api/abacatepay/cancelar-assinatura', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setMensagemCancel({ tipo: 'sucesso', texto: 'Assinatura cancelada. Acesso continua até o fim do período pago.' })
      setConfirmarCancel(false)
      router.refresh()
    } else {
      setMensagemCancel({ tipo: 'erro', texto: json.error ?? 'Erro ao cancelar.' })
    }
    setCancelando(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fafafa', border: '1px solid #e5e5e5',
    borderRadius: '10px', padding: '10px 14px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '10px',
    fontWeight: 600, color: '#00000044', marginBottom: '5px',
    letterSpacing: '1px', textTransform: 'uppercase',
  }

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          onClick={onFechar}
          style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(20,0,51,0.5)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '400px',
        background: '#fff', zIndex: 99,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(20,0,51,0.2)',
        transform: aberto ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #140033, #2d0066)',
          padding: '24px 20px 20px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#fff',
                boxShadow: '0 4px 16px rgba(255,51,204,0.4)',
                flexShrink: 0,
              }}>
                {inicial}
              </div>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: 0 }}>
                  {nomeLoja || 'Minha loja'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {email}
                </p>
              </div>
            </div>
            <button onClick={onFechar} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <X size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
            </button>
          </div>

          {/* Badge plano */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '5px 12px',
          }}>
            {badge.icon && <span style={{ color: badge.color }}>{badge.icon}</span>}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex', background: '#f5f5f5',
          margin: '16px 16px 0', borderRadius: '12px', padding: '4px',
          flexShrink: 0,
        }}>
          {([['perfil', '👤 Meu Perfil'], ['plano', '👑 Meu Plano']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)} style={{
              flex: 1, padding: '9px',
              background: aba === key ? '#fff' : 'transparent',
              border: 'none', borderRadius: '9px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
              color: aba === key ? '#140033' : '#00000044',
              boxShadow: aba === key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo rolável */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* ABA PERFIL */}
          {aba === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nome da loja</label>
                <input type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} placeholder="Ex: Encantiva Festas" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CPF / CNPJ</label>
                <input type="text" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Endereço</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" style={inputStyle} />
              </div>

              {sucesso && (
                <div style={{ background: '#e6fff2', border: '1px solid #00aa5533', borderRadius: '10px', padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#007744', fontWeight: 600 }}>
                  ✅ Dados salvos com sucesso!
                </div>
              )}

              <button onClick={salvarPerfil} disabled={salvando} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: salvando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: '12px', padding: '14px',
                color: salvando ? '#00000033' : '#fff',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
                cursor: salvando ? 'not-allowed' : 'pointer',
                boxShadow: salvando ? 'none' : '0 4px 16px rgba(255,51,204,0.3)',
              }}>
                <Save size={15} />
                {salvando ? 'Salvando...' : 'Salvar dados'}
              </button>

              <Link href="/configuracoes" onClick={onFechar} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fafafa', border: '1px solid #eeeeee',
                borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} style={{ color: '#9900ff' }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#140033' }}>
                    Assinatura da loja
                  </span>
                </div>
                <ChevronRight size={16} style={{ color: '#00000033' }} />
              </Link>
            </div>
          )}

          {/* ABA PLANO */}
          {aba === 'plano' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Status */}
              <div style={{ background: '#fafafa', border: '1px solid #eeeeee', borderRadius: '14px', padding: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000044', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Status atual</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: badge.bg, color: badge.color, borderRadius: '20px', padding: '6px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                  {badge.icon} {badge.label}
                </div>
                {trialAtivo && trialExpiraEm && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066', margin: 0 }}>
                    Trial expira em <strong>{new Date(trialExpiraEm).toLocaleDateString('pt-BR')}</strong>
                  </p>
                )}
                {dataExpiracao && !trialAtivo && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066', margin: 0 }}>
                    {status === 'cancelando' ? 'Acesso até' : 'Renova em'}{' '}
                    <strong>{dataExpiracao.toLocaleDateString('pt-BR')}</strong>
                    {diasRestantes !== null && ` (${diasRestantes} dias)`}
                  </p>
                )}
              </div>

              {/* CTA upgrade */}
              {!assinaturaAtiva && !isAdmin && (
                <div style={{ background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid rgba(153,0,255,0.2)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 6px 0' }}>🎉 Assine e desbloqueie tudo</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066', margin: '0 0 14px 0' }}>Contratos, painéis, calculadora e muito mais.</p>
                  <Link href="/planos" onClick={onFechar} style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
                    Ver planos →
                  </Link>
                </div>
              )}

              {/* Trocar plano */}
              {assinaturaAtiva && !isAdmin && status !== 'cancelando' && (
                <Link href="/planos" onClick={onFechar} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#fafafa', border: '1px solid #eeeeee',
                  borderRadius: '12px', padding: '14px 16px', textDecoration: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Crown size={16} style={{ color: '#9900ff' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#140033' }}>Trocar plano</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#00000033' }} />
                </Link>
              )}

              {/* Cancelar */}
              {temSubscriptionId && status === 'ativo' && (
                <div style={{ background: '#fff5f5', border: '1px solid #ff333322', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 6px 0' }}>Cancelar assinatura</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066', margin: '0 0 12px 0' }}>Seu acesso continua até o fim do período pago.</p>
                  {!confirmarCancel ? (
                    <button onClick={() => setConfirmarCancel(true)} style={{ background: 'none', border: '1px solid #cc000033', borderRadius: '10px', padding: '10px 18px', color: '#cc0000', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      Cancelar assinatura
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#cc0000', margin: 0 }}>⚠️ Tem certeza?</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={cancelarAssinatura} disabled={cancelando} style={{ flex: 1, background: '#cc0000', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          {cancelando ? 'Cancelando...' : 'Confirmar'}
                        </button>
                        <button onClick={() => setConfirmarCancel(false)} style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '10px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                  {mensagemCancel && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: mensagemCancel.tipo === 'sucesso' ? '#007744' : '#cc0000', margin: '10px 0 0 0' }}>
                      {mensagemCancel.texto}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé — Logout */}
        <div style={{ padding: '12px 16px 20px', borderTop: '1px solid #eeeeee', flexShrink: 0 }}>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', background: '#fafafa', border: '1px solid #eeeeee',
            borderRadius: '12px', padding: '13px',
            color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <LogOut size={15} />
            Sair da conta
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}