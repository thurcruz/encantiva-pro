'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  tipo: 'trial' | 'expirado'
  diasRestantes?: number
}

export default function BannerTrial({ tipo, diasRestantes = 0 }: Props) {
  const [fechado, setFechado] = useState(false)
  if (fechado) return null

  const isTrial = tipo === 'trial'
  const bg = isTrial ? '#ff33cc' : '#dc2626'

  return (
    <div style={{ background: bg, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', position: 'relative' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#fff', margin: 0, textAlign: 'center' }}>
        {isTrial ? (
          <>✨ Você está no <strong>modo de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}. </>
        ) : (
          <>🔒 Seu período de teste <strong>expirou</strong>. Você está no plano gratuito. </>
        )}
        <Link href="/planos" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>
          {isTrial ? 'Assinar agora →' : 'Ver planos →'}
        </Link>
      </p>

      {/* Botão fechar — só no expirado */}
      {!isTrial && (
        <button
          onClick={() => setFechado(true)}
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '999px', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
          aria-label="Fechar"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 1l8 8M9 1L1 9"/>
          </svg>
        </button>
      )}
    </div>
  )
}