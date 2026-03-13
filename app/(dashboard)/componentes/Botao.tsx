import Link from 'next/link'
import React from 'react'

type Variante = 'primario' | 'secundario' | 'ghost' | 'perigo'

interface BotaoProps {
  variante?: Variante
  children: React.ReactNode
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  icone?: React.ReactNode
  iconeDireita?: React.ReactNode
  target?: string
  rel?: string
  style?: React.CSSProperties
}

const ESTILOS: Record<Variante, React.CSSProperties> = {
  primario: {
    background: '#ff33cc',
    color: '#fff',
    border: '1.5px solid transparent',
  },
  secundario: {
    background: 'transparent',
    color: '#ff33cc',
    border: '1.5px solid #ff33cc',
  },
  ghost: {
    background: '#fff0fb',
    color: '#ff33cc',
    border: '1.5px solid transparent',
  },
  perigo: {
    background: 'transparent',
    color: '#dc2626',
    border: '1.5px solid #dc2626',
  },
}

const TAMANHOS: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '12px', borderRadius: '999px' },
  md: { padding: '10px 20px', fontSize: '13px', borderRadius: '999px' },
  lg: { padding: '14px 28px', fontSize: '15px', borderRadius: '999px' },
}

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  letterSpacing: '-0.1px',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'opacity .15s, transform .15s, box-shadow .15s',
  userSelect: 'none' as const,
}

export default function Botao({
  variante = 'primario',
  children,
  href,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  size = 'md',
  icone,
  iconeDireita,
  target,
  rel,
  style,
}: BotaoProps) {
  const estiloFinal: React.CSSProperties = {
    ...BASE,
    ...ESTILOS[variante],
    ...TAMANHOS[size],
    ...(fullWidth ? { width: '100%' } : {}),
    ...(disabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
    ...style,
  }

  const conteudo = (
    <>
      {icone && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icone}</span>}
      {children}
      {iconeDireita && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{iconeDireita}</span>}
    </>
  )

  if (href) {
    return (
      <Link href={href} style={estiloFinal} target={target} rel={rel}>
        {conteudo}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={estiloFinal}>
      {conteudo}
    </button>
  )
}

// ── Estilos globais de hover via CSS (adicione ao globals.css) ──────────────
// Copie o bloco abaixo para o seu globals.css:
//
// [data-botao]:not(:disabled):hover {
//   opacity: 0.88;
//   transform: translateY(-1px);
// }
// [data-botao][data-variante="primario"]:not(:disabled):hover {
//   box-shadow: 0 6px 20px rgba(255, 51, 204, 0.35);
// }
// [data-botao][data-variante="secundario"]:not(:disabled):hover {
//   background: #fff0fb !important;
// }