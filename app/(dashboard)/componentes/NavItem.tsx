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
    <Link href={href} style={{ textDecoration: 'none' }} className="nav-item-link">
      <div className={`nav-item ${ativo ? 'nav-item-ativo' : ''}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: '10px',
        background: ativo ? '#ff33cc' : 'transparent',
        fontFamily: 'Inter, sans-serif',
        fontWeight: ativo ? 700 : 500,
        fontSize: '13.5px',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        color: ativo ? '#fff' : '#ffffffaa',
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', flexShrink: 0,
          color: ativo ? '#fff' : '#ffffff77',
          transition: 'color 0.15s',
        }}>
          {icon}
        </span>
        {label}
      </div>

      <style>{`
        .nav-item:hover:not(.nav-item-ativo) {
          background: rgba(255, 255, 255, 0.07) !important;
          color: #ffffffdd !important;
        }
        .nav-item:hover:not(.nav-item-ativo) span {
          color: #ffffffbb !important;
        }
      `}</style>
    </Link>
  )
}