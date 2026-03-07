'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import PopupUpgrade from '../../components/PopupUpgrade'

// ─────────────────────────────────────────────
// Hook useBloqueio
// Use em qualquer client component para abrir o popup
//
// Exemplo:
//   const { abrirUpgrade, Popup } = useBloqueio()
//   ...
//   <button onClick={() => abrirUpgrade('Painéis', 'Disponível no plano Avançado.')}>
//     Criar painel
//   </button>
//   {Popup}
// ─────────────────────────────────────────────
export function useBloqueio() {
  const [popup, setPopup] = useState<{ recurso: string; descricao?: string } | null>(null)

  function abrirUpgrade(recurso: string, descricao?: string) {
    setPopup({ recurso, descricao })
  }

  const Popup = popup ? (
    <PopupUpgrade
      aberto={true}
      onFechar={() => setPopup(null)}
      recurso={popup.recurso}
      descricao={popup.descricao}
    />
  ) : null

  return { abrirUpgrade, Popup }
}

// ─────────────────────────────────────────────
// Componente FeatureBloqueada
// Envolve qualquer conteúdo e bloqueia com overlay ou botão
//
// Exemplo overlay (desfoca o conteúdo):
//   <FeatureBloqueada bloqueada={!limites.paineis} recurso="Criador de Painéis">
//     <MeuComponente />
//   </FeatureBloqueada>
//
// Exemplo botão (substitui por botão de upgrade):
//   <FeatureBloqueada bloqueada={true} recurso="Painéis" estilo="botao">
//     <button>Criar painel</button>
//   </FeatureBloqueada>
// ─────────────────────────────────────────────
interface FeatureBloqueadaProps {
  bloqueada: boolean
  recurso: string
  descricao?: string
  children: React.ReactNode
  estilo?: 'overlay' | 'botao'
}

export function FeatureBloqueada({
  bloqueada,
  recurso,
  descricao,
  children,
  estilo = 'overlay',
}: FeatureBloqueadaProps) {
  const [popupAberto, setPopupAberto] = useState(false)

  if (!bloqueada) return <>{children}</>

  if (estilo === 'botao') {
    return (
      <>
        <button
          onClick={() => setPopupAberto(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 18px', color: '#ffffff55', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          <Lock size={14} />
          {recurso}
          <span style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: '#fff', marginLeft: '4px' }}>
            UPGRADE
          </span>
        </button>
        <PopupUpgrade aberto={popupAberto} onFechar={() => setPopupAberto(false)} recurso={recurso} descricao={descricao} />
      </>
    )
  }

  return (
    <>
      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
          {children}
        </div>
        <div
          onClick={() => setPopupAberto(true)}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', background: 'rgba(6,0,15,0.6)', backdropFilter: 'blur(2px)' }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} style={{ color: '#fff' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 4px 0' }}>{recurso}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff66', margin: 0 }}>Clique para fazer upgrade</p>
          </div>
        </div>
      </div>
      <PopupUpgrade aberto={popupAberto} onFechar={() => setPopupAberto(false)} recurso={recurso} descricao={descricao} />
    </>
  )
}