'use client'

import { useState } from 'react'

export default function BannerBeta() {
  const [fechado, setFechado] = useState(false)
  if (fechado) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)',
      border: '1px solid #ffd6f5',
      borderRadius: '14px',
      padding: '14px 16px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <div style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1 }}>🚀</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 3px' }}>
          Encantiva Pro está em desenvolvimento
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
          Estamos trabalhando com muito carinho para melhorar a plataforma. Podem aparecer pequenos erros ou funcionalidades incompletas — agradecemos a compreensão! Qualquer problema, é só chamar pelo suporte e a gente resolve rapidinho. 💜
        </p>
      </div>
      <button
        onClick={() => setFechado(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '2px', flexShrink: 0, lineHeight: 1 }}
        aria-label="Fechar aviso"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 2l10 10M12 2L2 12"/>
        </svg>
      </button>
    </div>
  )
}