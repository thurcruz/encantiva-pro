'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopiarLinkAfiliado({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const msgWpp = encodeURIComponent(`Conheca a Encantiva Pro! ${link}`)

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button
        onClick={copiar}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: copiado ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.12)', border: `1px solid ${copiado ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.2)'}`, borderRadius: '10px', padding: '10px 18px', color: copiado ? '#00ff88' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        {copiado ? <Check size={15} /> : <Copy size={15} />}
        {copiado ? 'Copiado!' : 'Copiar link'}
      </button>

      <a
        href={`https://wa.me/?text=${msgWpp}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25d366', border: 'none', borderRadius: '10px', padding: '10px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
      >
        Compartilhar no WhatsApp
      </a>
    </div>
  )
}
