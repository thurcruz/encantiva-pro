'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  planoId: string
  destaque: boolean
}

export default function BotaoAssinarClient({ planoId, destaque }: Props) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  async function handleAssinar() {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId }),
      })
      const json = await res.json()
      if (json.erro) throw new Error(json.erro)
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
      } else {
        router.push(`/planos/sucesso?plano=${planoId}`)
      }
    } catch (e) {
      setErro(String(e))
      setCarregando(false)
    }
  }

  return (
    <div>
      {erro && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#cc0000',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}>
          {erro}
        </p>
      )}
      <button
        onClick={handleAssinar}
        disabled={carregando}
        style={{
          width: '100%',
          background: destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#140033',
          border: 'none',
          borderRadius: 12,
          padding: '14px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 14,
          cursor: carregando ? 'not-allowed' : 'pointer',
          opacity: carregando ? 0.7 : 1,
          transition: 'opacity .2s',
          boxShadow: destaque ? '0 8px 24px rgba(255,51,204,0.3)' : 'none',
        }}
      >
        {carregando ? 'Aguarde...' : 'Assinar agora'}
      </button>
    </div>
  )
}