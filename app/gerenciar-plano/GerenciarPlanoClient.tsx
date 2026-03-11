'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  planoAtual: string
  status: string
  asaasSubscriptionId: string | null
}

const INFO_PLANO: Record<string, { nome: string; preco: string }> = {
  iniciante: { nome: 'Iniciante', preco: 'R$ 24,90/mês' },
  avancado:  { nome: 'Avançado',  preco: 'R$ 54,90/mês' },
  elite:     { nome: 'Elite',     preco: 'R$ 94,00/mês' },
}

export default function GerenciarPlanoClient({ planoAtual, status, asaasSubscriptionId }: Props) {
  const router = useRouter()
  const [cancelando, setCancelando] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const info = INFO_PLANO[planoAtual] ?? { nome: planoAtual, preco: '—' }
  const ativo = status === 'active'

  async function handleCancelar() {
    if (!confirmar) { setConfirmar(true); return }
    setCancelando(true)
    setErro(null)
    try {
      const res = await fetch('/api/asaas/cancelar-assinatura', { method: 'POST' })
      const json = await res.json()
      if (json.erro) throw new Error(json.erro)
      router.refresh()
    } catch (e) {
      setErro(String(e))
    } finally {
      setCancelando(false)
      setConfirmar(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Card do plano */}
      <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: 16, padding: 28, marginBottom: 16 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#ff33cc', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
          Seu plano atual
        </p>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 24, color: '#140033', margin: '0 0 4px 0' }}>
          {info.nome}
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#00000055', margin: '0 0 16px 0' }}>
          {info.preco}
        </p>

        {/* Status badge */}
        <span style={{
          display: 'inline-block',
          background: ativo ? '#e8f5e9' : '#fff0f0',
          color: ativo ? '#2e7d32' : '#cc0000',
          fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700,
          padding: '4px 12px', borderRadius: 20,
        }}>
          {ativo ? '✅ Ativo' : status === 'canceled' ? '❌ Cancelado' : status === 'overdue' ? '⚠️ Vencido' : status}
        </span>
      </div>

      {/* ID da assinatura (para suporte) */}
      {asaasSubscriptionId && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#00000033', margin: '0 0 24px 0', textAlign: 'center' }}>
          ID: {asaasSubscriptionId}
        </p>
      )}

      {/* Ações */}
      {ativo && (
        <div>
          {erro && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: 10, padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#cc0000', marginBottom: 12 }}>
              {erro}
            </div>
          )}
          {confirmar && (
            <div style={{ background: '#fff8e6', border: '1px solid #ffdd99', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#7a5000', margin: '0 0 4px 0', fontWeight: 700 }}>
                ⚠️ Tem certeza?
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7a5000', margin: 0 }}>
                Você perderá acesso ao fim do período pago. Esta ação não pode ser desfeita.
              </p>
            </div>
          )}
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            style={{
              width: '100%',
              background: confirmar ? '#cc0000' : 'transparent',
              border: `1.5px solid ${confirmar ? '#cc0000' : '#e5e5e5'}`,
              borderRadius: 12, padding: '14px',
              color: confirmar ? '#fff' : '#cc0000',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
              cursor: cancelando ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
            }}
          >
            {cancelando ? 'Cancelando...' : confirmar ? 'Confirmar cancelamento' : 'Cancelar assinatura'}
          </button>
          {confirmar && (
            <button
              onClick={() => setConfirmar(false)}
              style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: 13, cursor: 'pointer', padding: '8px' }}
            >
              Voltar
            </button>
          )}
        </div>
      )}
    </div>
  )
}