'use client'

import { useState } from 'react'

interface Props {
  planoId: string
  destaque: boolean
}

function formatarCpfCnpj(valor: string) {
  const numeros = valor.replace(/\D/g, '')
  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    return numeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
}

export default function BotaoAssinarClient({ planoId, destaque }: Props) {
  const [modalAberto, setModalAberto] = useState(false)
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarCpfCnpj(e.target.value)
    if (formatado.replace(/\D/g, '').length <= 14) {
      setCpfCnpj(formatado)
    }
  }

  async function handleAssinar() {
    const numeros = cpfCnpj.replace(/\D/g, '')
    if (numeros.length !== 11 && numeros.length !== 14) {
      setErro('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }

    setCarregando(true)
    setErro(null)

    try {
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId, cpfCnpj: numeros }),
      })
      const json = await res.json()
      if (json.erro) throw new Error(json.erro)
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
      }
    } catch (e) {
      setErro(String(e))
      setCarregando(false)
    }
  }

  return (
    <>
      {/* Botão principal */}
      <button
        onClick={() => setModalAberto(true)}
        style={{
          width: '100%',
          background: destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#140033',
          border: 'none', borderRadius: 12, padding: '14px',
          color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', transition: 'opacity .2s',
          boxShadow: destaque ? '0 8px 24px rgba(255,51,204,0.3)' : 'none',
        }}
      >
        Assinar agora
      </button>

      {/* Modal */}
      {modalAberto && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32,
            width: '100%', maxWidth: 400,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 20, color: '#140033', margin: '0 0 6px 0' }}>
                Quase lá! 🎉
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#00000066', margin: 0 }}>
                Precisamos do seu CPF ou CNPJ para emitir a cobrança.
              </p>
            </div>

            {/* Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#140033', display: 'block', marginBottom: 6 }}>
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={handleChange}
                placeholder="000.000.000-00"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: `1.5px solid ${erro ? '#cc0000' : '#e5e5e5'}`,
                  borderRadius: 10, padding: '12px 14px',
                  fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#140033',
                  outline: 'none',
                }}
              />
              {erro && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0000', margin: '6px 0 0 0' }}>
                  {erro}
                </p>
              )}
            </div>

            {/* Botões */}
            <button
              onClick={handleAssinar}
              disabled={carregando}
              style={{
                width: '100%', marginBottom: 10,
                background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: 12, padding: '14px',
                color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
                cursor: carregando ? 'not-allowed' : 'pointer',
                opacity: carregando ? 0.7 : 1,
              }}
            >
              {carregando ? 'Aguarde...' : 'Continuar para pagamento'}
            </button>

            <button
              onClick={() => { setModalAberto(false); setErro(null) }}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055',
                cursor: 'pointer', padding: '8px',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}