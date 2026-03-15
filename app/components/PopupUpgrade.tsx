'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, Zap, Check } from 'lucide-react'

interface Props {
  aberto: boolean
  onFechar: () => void
  recurso?: string
  descricao?: string
  isFree?: boolean
}

const BENEFICIOS = [
  'Contratos ilimitados',
  'Criador de painéis',
  'Clientes ilimitados',
  'Suporte prioritário',
]

export default function PopupUpgrade({ aberto, onFechar, recurso, descricao, isFree }: Props) {
  useEffect(() => {
    if (!aberto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [aberto, onFechar])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aberto])

  if (!aberto) return null

  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(6,0,15,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#110022', border: '1px solid rgba(255,51,204,0.25)', borderRadius: '24px', padding: '40px', maxWidth: '460px', width: '100%', position: 'relative', boxShadow: '0 32px 80px rgba(153,0,255,0.3), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        <button onClick={onFechar} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff66' }}>
          <X size={16} />
        </button>

        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', border: '1px solid rgba(255,51,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Zap size={24} style={{ color: '#ff33cc' }} />
        </div>

        <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '26px', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          {recurso ? `${recurso} é premium` : 'Faça upgrade para continuar'}
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66', margin: '0 0 28px', lineHeight: 1.6 }}>
          {descricao ?? 'Essa funcionalidade está disponível nos planos pagos. Faça upgrade e tenha acesso completo.'}
        </p>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff33', letterSpacing: '1.5px', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>
            No plano Avançado você tem
          </p>
          {BENEFICIOS.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={11} style={{ color: '#fff' }} />
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffbb' }}>{b}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '36px', color: '#fff', letterSpacing: '-1px' }}>R$ 54,90</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff44' }}>/mês</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', marginLeft: '8px', fontWeight: 600 }}>7 dias grátis</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/planos" style={{ display: 'block', textAlign: 'center' as const, background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,51,204,0.3)' }}>
            Ver todos os planos →
          </Link>
          <button onClick={onFechar} style={{ background: 'transparent', border: 'none', padding: '10px', color: '#ffffff33', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer' }}>
            {isFree ? 'Continuar no plano grátis' : 'Continuar no trial'}
          </button>
        </div>
      </div>
    </div>
  )
}