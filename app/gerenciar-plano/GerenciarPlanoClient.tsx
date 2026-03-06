'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, XCircle, Crown } from 'lucide-react'

interface Props {
  status: string | null
  expiraEm: string | null
  trialExpiraEm: string | null
  assinaturaAtiva: boolean
  temSubscriptionId: boolean
  isAdmin: boolean
}

export default function GerenciarPlanoClient({
  status, expiraEm, trialExpiraEm, assinaturaAtiva, temSubscriptionId, isAdmin,
}: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const agora = new Date()
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > agora : false
  const dataExpiracao = expiraEm ? new Date(expiraEm) : null
  const diasRestantes = dataExpiracao
    ? Math.max(0, Math.ceil((dataExpiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
  }

  const badgeStatus = () => {
    if (isAdmin) return { label: 'Admin', color: '#9900ff', bg: '#f5f0ff', icon: <Crown size={14} /> }
    if (trialAtivo) return { label: 'Trial ativo', color: '#cc8800', bg: '#fff8ec', icon: <Clock size={14} /> }
    if (status === 'ativo') return { label: 'Ativo', color: '#007744', bg: '#ecfff5', icon: <CheckCircle size={14} /> }
    if (status === 'cancelando') return { label: 'Cancela ao expirar', color: '#cc5500', bg: '#fff5ec', icon: <AlertTriangle size={14} /> }
    if (status === 'inadimplente') return { label: 'Pagamento pendente', color: '#cc0000', bg: '#fff0f0', icon: <XCircle size={14} /> }
    if (status === 'cancelado') return { label: 'Cancelado', color: '#cc0000', bg: '#fff0f0', icon: <XCircle size={14} /> }
    return { label: 'Inativo', color: '#888', bg: '#f5f5f5', icon: <XCircle size={14} /> }
  }

  const badge = badgeStatus()

  async function cancelarAssinatura() {
    setCancelando(true)
    setMensagem(null)
    const res = await fetch('/api/abacatepay/cancelar-assinatura', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setMensagem({ tipo: 'sucesso', texto: 'Assinatura cancelada. Seu acesso continua até o fim do período pago.' })
      setConfirmar(false)
      router.refresh()
    } else {
      setMensagem({ tipo: 'erro', texto: json.error ?? 'Erro ao cancelar. Tente novamente.' })
    }
    setCancelando(false)
  }

  return (
    <div>
      {/* Status atual */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          Status da assinatura
        </h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: badge.bg, color: badge.color, borderRadius: '20px', padding: '6px 14px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', marginBottom: '20px' }}>
          {badge.icon}
          {badge.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {trialAtivo && trialExpiraEm && (
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000044', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Trial expira em</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>
                {new Date(trialExpiraEm).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {dataExpiracao && !trialAtivo && (
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000044', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                {status === 'cancelando' ? 'Acesso até' : 'Renova em'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>
                {dataExpiracao.toLocaleDateString('pt-BR')}
                {diasRestantes !== null && (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', marginLeft: '6px' }}>
                    ({diasRestantes} dias)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sem assinatura ativa → CTA */}
      {!assinaturaAtiva && !isAdmin && (
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1.5px solid rgba(153,0,255,0.2)' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
            🎉 Assine e desbloqueie tudo
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066', margin: '0 0 20px 0' }}>
            Contratos, painéis, calculadora e muito mais por um preço justo.
          </p>
          <Link href="/planos" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '14px 28px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            Ver planos →
          </Link>
        </div>
      )}

      {/* Trocar plano */}
      {assinaturaAtiva && !isAdmin && status !== 'cancelando' && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
            Trocar plano
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066', margin: '0 0 16px 0' }}>
            Quer mudar para outro plano?
          </p>
          <Link href="/planos" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '12px 24px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            Ver planos
          </Link>
        </div>
      )}

      {/* Cancelamento */}
      {temSubscriptionId && status === 'ativo' && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
            Cancelar assinatura
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066', margin: '0 0 16px 0' }}>
            Ao cancelar, seu acesso continua ativo até o fim do período já pago.
          </p>
          {!confirmar ? (
            <button onClick={() => setConfirmar(true)} style={{ background: '#fff5f5', border: '1px solid #ff333333', borderRadius: '12px', padding: '12px 24px', color: '#cc0000', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Cancelar assinatura
            </button>
          ) : (
            <div style={{ background: '#fff5f5', border: '1px solid #ff333333', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#cc0000', margin: '0 0 16px 0' }}>
                ⚠️ Tem certeza? Você perderá acesso ao fim do período pago.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={cancelarAssinatura} disabled={cancelando} style={{ background: '#cc0000', border: 'none', borderRadius: '10px', padding: '12px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: cancelando ? 'not-allowed' : 'pointer', opacity: cancelando ? 0.6 : 1 }}>
                  {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
                <button onClick={() => setConfirmar(false)} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px 20px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mensagem && (
        <div style={{ background: mensagem.tipo === 'sucesso' ? '#ecfff5' : '#fff5f5', border: `1px solid ${mensagem.tipo === 'sucesso' ? '#00aa5533' : '#ff333333'}`, borderRadius: '12px', padding: '14px 18px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: mensagem.tipo === 'sucesso' ? '#007744' : '#cc0000' }}>
          {mensagem.texto}
        </div>
      )}
    </div>
  )
}