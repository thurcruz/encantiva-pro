'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, Crown } from 'lucide-react'

const PLANOS = [
  {
    id: 'iniciante',
    nome: 'Iniciante',
    preco: 24.90,
    descricao: 'Ideal para começar',
    abacatepayPlanId: process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_INICIANTE ?? '',
    destaque: false,
    beneficios: [
      'Acesso à plataforma',
      'Catálogo de temas e kits',
      'Calculadora de preços',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    preco: 54.90,
    descricao: 'O mais popular ✨',
    abacatepayPlanId: process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_AVANCADO ?? '',
    destaque: true,
    beneficios: [
      'Tudo do Iniciante',
      'Geração de contratos ilimitada',
      'Criador de painéis',
      'Suporte prioritário',
    ],
  },
  {
    id: 'elite',
    nome: 'Elite',
    preco: 94.00,
    descricao: 'Para quem quer o máximo',
    abacatepayPlanId: process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_ELITE ?? '',
    destaque: false,
    beneficios: [
      'Tudo do Avançado',
      'Acesso antecipado a novidades',
      'Suporte VIP',
      'Recursos exclusivos',
    ],
  },
]

interface Props {
  planoAtual: string | null
  statusAtual: string | null
  logado: boolean
}

export default function PaginaPlanos({ planoAtual, statusAtual, logado }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [carregando, setCarregando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const planoAtualNormalizado = planoAtual?.toLowerCase().trim() ?? null

  async function assinar(plano: typeof PLANOS[0]) {
    if (!logado) { router.push('/login'); return }

    setCarregando(plano.id)
    setErro(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_loja')
      .eq('id', user.id)
      .single()

    const res = await fetch('/api/abacatepay/criar-assinatura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plano.abacatepayPlanId,
        userId: user.id,
        email: user.email,
        nome: perfil?.nome_loja ?? user.email,
      }),
    })

    const json = await res.json()

    if (!res.ok || !json.checkoutUrl) {
      setErro(json.error ?? 'Erro ao criar assinatura. Tente novamente.')
      setCarregando(null)
      return
    }

    router.push(json.checkoutUrl)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0018 0%, #140033 50%, #0a0018 100%)', padding: '60px 24px' }}>

      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '42px', color: '#fff', margin: '0 0 16px 0', letterSpacing: '-1.5px' }}>
          Escolha seu plano
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#ffffff66', margin: 0 }}>
          Tudo que você precisa para organizar e vender festas com elegância
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1100px', margin: '0 auto 40px' }}>
        {PLANOS.map(plano => {
          const isAtual = planoAtualNormalizado === plano.id
          const isCancelando = isAtual && statusAtual === 'cancelando'

          return (
            <div key={plano.id} style={{
              flex: '1 1 300px', maxWidth: '340px',
              background: isAtual
                ? 'linear-gradient(160deg, rgba(0,200,100,0.1), rgba(0,100,255,0.1))'
                : plano.destaque
                  ? 'linear-gradient(160deg, rgba(255,51,204,0.12), rgba(153,0,255,0.12))'
                  : 'rgba(255,255,255,0.04)',
              border: isAtual
                ? '2px solid rgba(0,220,120,0.5)'
                : plano.destaque
                  ? '1.5px solid rgba(255,51,204,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px', padding: '36px', position: 'relative',
              boxShadow: isAtual
                ? '0 24px 80px rgba(0,200,100,0.12)'
                : plano.destaque
                  ? '0 24px 80px rgba(255,51,204,0.15)'
                  : 'none',
            }}>

              {/* Badge plano atual */}
              {isAtual && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: isCancelando
                    ? 'linear-gradient(135deg, #cc5500, #ff9900)'
                    : 'linear-gradient(135deg, #00cc88, #0066ff)',
                  borderRadius: '20px', padding: '6px 18px',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <Crown size={11} />
                  {isCancelando ? 'CANCELANDO' : 'SEU PLANO ATUAL'}
                </div>
              )}

              {/* Badge mais popular (só se não for o atual) */}
              {plano.destaque && !isAtual && (
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                  borderRadius: '20px', padding: '6px 18px',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap',
                }}>
                  ✨ MAIS POPULAR
                </div>
              )}

              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: isAtual ? '#00cc88' : '#ffffff55', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                {plano.nome}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '42px', color: '#fff', letterSpacing: '-2px' }}>
                  R$ {plano.preco.toFixed(2).replace('.', ',')}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55' }}>/mês</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: isAtual ? '#00cc8899' : plano.destaque ? '#ff33cc' : '#ffffff44', margin: '0 0 24px 0' }}>
                {isAtual ? (isCancelando ? 'Acesso até o fim do período pago' : 'Você está neste plano') : plano.descricao}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {plano.beneficios.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      background: isAtual
                        ? 'linear-gradient(135deg, #00cc88, #0066ff)'
                        : plano.destaque
                          ? 'linear-gradient(135deg, #ff33cc, #9900ff)'
                          : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} style={{ color: '#fff' }} />
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc', margin: 0 }}>{b}</p>
                  </div>
                ))}
              </div>

              {isAtual ? (
                <button
                  disabled
                  style={{
                    width: '100%',
                    background: isCancelando ? 'rgba(204,85,0,0.2)' : 'rgba(0,200,100,0.15)',
                    border: isCancelando ? '1px solid rgba(204,85,0,0.4)' : '1px solid rgba(0,200,100,0.4)',
                    borderRadius: '14px', padding: '16px', color: isCancelando ? '#ff9900' : '#00cc88',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                    cursor: 'not-allowed',
                  }}
                >
                  {isCancelando ? '⚠️ Cancelando...' : '✓ Plano ativo'}
                </button>
              ) : (
                <button
                  onClick={() => assinar(plano)}
                  disabled={carregando !== null}
                  style={{
                    width: '100%',
                    background: plano.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : 'rgba(255,255,255,0.08)',
                    border: plano.destaque ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '14px', padding: '16px', color: '#fff',
                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                    cursor: carregando !== null ? 'not-allowed' : 'pointer',
                    opacity: carregando !== null && carregando !== plano.id ? 0.5 : 1,
                  }}
                >
                  {carregando === plano.id ? 'Redirecionando...' : `Assinar ${plano.nome}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {erro && (
        <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto 32px', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)', borderRadius: '12px', padding: '14px 20px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ff6666' }}>
          {erro}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff33', margin: 0 }}>
          🔒 Pagamento seguro via AbacatePay · Cancele quando quiser
        </p>
      </div>
    </div>
  )
}