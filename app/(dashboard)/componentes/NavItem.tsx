'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Props {
  href: string
  icon: React.ReactNode
  label: string
}

export default function NavItem({ href, icon, label }: Props) {
  const [hover, setHover] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          color: hover ? '#fff' : '#ffffffcc',
          background: hover ? '#ffffff0d' : 'transparent',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {icon}
        {label}
      </div>
    </Link>
  )
}