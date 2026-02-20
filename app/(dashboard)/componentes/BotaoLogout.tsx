'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export default function BotaoLogout() {
  const [hover, setHover] = useState(false)

  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          color: hover ? '#ff33cc' : '#ffffff66',
          background: hover ? '#ff33cc11' : 'transparent',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          border: 'none',
          width: '100%',
          transition: 'all 0.15s',
        }}
      >
        <LogOut size={16} />
        Sair
      </button>
    </form>
  )
}