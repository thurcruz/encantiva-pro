'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planoId: string
  destaque: boolean
}

const supabase = createClient()

const NOMES_PLANO: Record<string, string> = {
  iniciante: 'Iniciante',
  avancado:  'Avançado',
  elite:     'Elite',
}

const VALORES_PLANO: Record<string, number> = {
  iniciante: 19.90,
  avancado:  34.90,
  elite:     54.90,
}

function formatarCpfCnpj(valor: string) {
  const n = valor.replace(/\D/g, '')
  if (n.length <= 11) {
    return n
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return n
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export default function BotaoAssinarClient({ planoId, destaque }: Props) {
  const [modalAberto, setModalAberto]     = useState(false)
  const [cpfCnpj, setCpfCnpj]             = useState('')
  const [carregando, setCarregando]       = useState(false)
  const [erro, setErro]                   = useState<string | null>(null)
  const [modoUpgrade, setModoUpgrade]     = useState(false)
  const [planoAtual, setPlanoAtual]       = useState<string | null>(null)
  const [checkingPlano, setCheckingPlano] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fmt = formatarCpfCnpj(e.target.value)
    if (fmt.replace(/\D/g, '').length <= 14) setCpfCnpj(fmt)
  }

  async function abrirModal() {
    setErro(null)
    setCheckingPlano(true)
    setModalAberto(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('plano, status')
          .eq('usuario_id', user.id)
          .single()

        const ativa = assinatura?.status === 'active' || assinatura?.status === 'ativo'
        if (ativa && assinatura?.plano) {
          setModoUpgrade(true)
          setPlanoAtual(assinatura.plano)
        } else {
          setModoUpgrade(false)
          setPlanoAtual(null)
        }
      }
    } catch {
      // sem sessão — fluxo normal de CPF
    } finally {
      setCheckingPlano(false)
    }
  }

  async function handleUpgrade() {
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/asaas/atualizar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId }),
      })
      const json = await res.json()
      if (json.erro) throw new Error(json.erro)

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
      } else {
        window.location.href = '/planos'
      }
    } catch (e) {
      setErro(String(e))
      setCarregando(false)
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
      if (json.checkoutUrl) window.location.href = json.checkoutUrl
    } catch (e) {
      setErro(String(e))
      setCarregando(false)
    }
  }

  const valorAtual  = planoAtual ? (VALORES_PLANO[planoAtual] ?? 0) : 0
  const valorNovo   = VALORES_PLANO[planoId] ?? 0
  const isUpgrade   = valorNovo > valorAtual
  const isDowngrade = valorNovo < valorAtual

  const btnBase: React.CSSProperties = {
    width: '100%', border: 'none', borderRadius: 12, padding: '14px',
    color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
    cursor: carregando ? 'not-allowed' : 'pointer',
    opacity: carregando ? 0.7 : 1, marginBottom: 10,
  }

  const btnCancelar: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none',
    fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055',
    cursor: 'pointer', padding: '8px',
  }

  return (
    <>
      <button
        onClick={abrirModal}
        style={{
          width: '100%',
          background: destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#140033',
          border: 'none', borderRadius: 12, padding: '14px',
          color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
          boxShadow: destaque ? '0 8px 24px rgba(255,51,204,0.3)' : 'none',
        }}
      >
        Assinar agora
      </button>

      {modalAberto && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setModalAberto(false); setErro(null) } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(20,0,51,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 32px 80px rgba(153,0,255,0.2)' }}>

            {checkingPlano && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #e5e5e5', borderTopColor: '#9900ff', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055', margin: 0 }}>
                  Verificando sua conta...
                </p>
                <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {!checkingPlano && modoUpgrade && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: isUpgrade ? 'linear-gradient(135deg, rgba(153,0,255,0.08), rgba(255,51,204,0.08))' : '#fff8ec', border: `1.5px solid ${isUpgrade ? 'rgba(153,0,255,0.15)' : '#ffdd9933'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        {isUpgrade
                          ? <path d="M9 14V4M5 8l4-4 4 4" stroke="#9900ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          : <path d="M9 4v10M5 10l4 4 4-4" stroke="#cc7700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        }
                      </svg>
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 18, color: '#140033', margin: '0 0 3px 0' }}>
                        {isUpgrade ? 'Fazer upgrade' : 'Mudar de plano'}
                      </h2>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: 0 }}>
                        {NOMES_PLANO[planoAtual ?? ''] ?? planoAtual}
                        {' → '}
                        <strong style={{ color: '#9900ff' }}>{NOMES_PLANO[planoId]}</strong>
                      </p>
                    </div>
                  </div>

                  {isUpgrade && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,51,204,0.06), rgba(153,0,255,0.06))', border: '1px solid rgba(153,0,255,0.15)', borderRadius: 14, padding: '14px 16px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#9900ff', margin: '0 0 4px 0' }}>
                        Cobrança proporcional
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000066', margin: 0, lineHeight: 1.5 }}>
                        Você pagará apenas a <strong>diferença dos dias restantes</strong> do mês atual. A partir do próximo ciclo, o valor será R$ {valorNovo.toFixed(2).replace('.', ',')}/mês.
                      </p>
                    </div>
                  )}

                  {isDowngrade && (
                    <div style={{ background: '#fff8ec', border: '1px solid #ffdd9933', borderRadius: 14, padding: '14px 16px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#cc7700', margin: '0 0 4px 0' }}>
                        Atenção: downgrade de plano
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000066', margin: 0, lineHeight: 1.5 }}>
                        Você perderá acesso a alguns recursos. A mudança valerá a partir do próximo ciclo de cobrança.
                      </p>
                    </div>
                  )}
                </div>

                {erro && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0000', margin: '0 0 12px 0' }}>{erro}</p>
                )}

                <button onClick={handleUpgrade} disabled={carregando} style={{ ...btnBase, background: 'linear-gradient(135deg, #ff33cc, #9900ff)' }}>
                  {carregando ? 'Processando...' : isUpgrade ? 'Confirmar upgrade →' : 'Confirmar mudança →'}
                </button>
                <button onClick={() => { setModalAberto(false); setErro(null) }} style={btnCancelar}>
                  Cancelar
                </button>
              </>
            )}

            {!checkingPlano && !modoUpgrade && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 20, color: '#140033', margin: '0 0 6px 0' }}>
                    Quase lá!
                  </h2>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#00000066', margin: 0 }}>
                    Precisamos do seu CPF ou CNPJ para emitir a cobrança.
                  </p>
                </div>

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
                    onKeyDown={e => e.key === 'Enter' && handleAssinar()}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: `1.5px solid ${erro ? '#cc0000' : '#e5e5e5'}`,
                      borderRadius: 10, padding: '12px 14px',
                      fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#140033',
                      outline: 'none', background: '#fafafa',
                    }}
                  />
                  {erro && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0000', margin: '6px 0 0 0' }}>{erro}</p>
                  )}
                </div>

                <button onClick={handleAssinar} disabled={carregando} style={{ ...btnBase, background: 'linear-gradient(135deg, #ff33cc, #9900ff)' }}>
                  {carregando ? 'Aguarde...' : 'Continuar para pagamento'}
                </button>
                <button onClick={() => { setModalAberto(false); setErro(null) }} style={btnCancelar}>
                  Cancelar
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}
