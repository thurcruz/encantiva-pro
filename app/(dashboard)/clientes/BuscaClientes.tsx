'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function BuscaClientes({ buscaInicial }: { buscaInicial: string }) {
  const [busca, setBusca] = useState(buscaInicial)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

 useEffect(() => {
  const timer = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (busca) params.set('busca', busca)
    else params.delete('busca')
    router.push(`${pathname}?${params.toString()}`)
  }, 400)
  return () => clearTimeout(timer)
}, [busca, pathname, router, searchParams])

  return (
    <div style={{ position: 'relative' }}>
      <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00000033' }} />
      <input
        type="text"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar cliente pelo nome..."
        style={{
          width: '100%',
          background: '#fff',
          border: '1px solid #e5e5e5',
          borderRadius: '12px',
          padding: '12px 40px',
          color: '#140033',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {busca && (
        <button onClick={() => setBusca('')} style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#00000033',
          display: 'flex', alignItems: 'center',
        }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}