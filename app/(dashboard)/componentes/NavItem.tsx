'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  href: string
  icon: React.ReactNode
  label: string
}

export default function NavItem({ href, icon, label }: Props) {
  const pathname = usePathname()
  const ativo = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '10px',
        color: ativo ? '#fff' : '#ffffff66',
        background: ativo ? 'linear-gradient(135deg, rgba(255,51,204,0.15), rgba(153,0,255,0.15))' : 'transparent',
        border: ativo ? '1px solid rgba(255,51,204,0.2)' : '1px solid transparent',
        fontFamily: 'Inter, sans-serif',
        fontWeight: ativo ? 700 : 500,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
        <span style={{ color: ativo ? '#ff33cc' : '#ffffff44', display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
        {label}
        {ativo && (
          <div style={{
            marginLeft: 'auto',
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
          }} />
        )}
      </div>
    </Link>
  )
}