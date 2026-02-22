'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { Categoria, TipoPeca, Formato } from '@/types/database'

interface Props {
  categorias: Categoria[]
  tipos: TipoPeca[]
  formatos: Formato[]
  categoriaSelecionada?: string
  tipoSelecionado?: string
  formatoSelecionado?: string
  buscaInicial?: string
}

export default function FiltrosMateriais({
  categorias, tipos, formatos,
  categoriaSelecionada, tipoSelecionado, formatoSelecionado, buscaInicial
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [busca, setBusca] = useState(buscaInicial ?? '')

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set(chave, valor)
    else params.delete(chave)
    router.push(`${pathname}?${params.toString()}`)
  }

  function limpar() {
    setBusca('')
    router.push(pathname)
  }

// Debounce da busca
useEffect(() => {
  const timer = setTimeout(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (busca) params.set('busca', busca)
    else params.delete('busca')
    router.push(`${pathname}?${params.toString()}`)
  }, 400)
  return () => clearTimeout(timer)
}, [busca])

  const temFiltro = categoriaSelecionada || tipoSelecionado || formatoSelecionado || busca

  const selectStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#140033',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000055',
    marginBottom: '6px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #eeeeee',
      borderRadius: '16px',
      padding: '20px 24px',
    }}>

      {/* Campo de busca */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', color: '#00000033',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar materiais..."
            style={{
              width: '100%',
              background: '#f9f9f9',
              border: '1px solid #e5e5e5',
              borderRadius: '10px',
              padding: '12px 14px 12px 40px',
              color: '#140033',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#00000044', padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Categoria</label>
          <select value={categoriaSelecionada ?? ''} onChange={e => atualizar('categoria', e.target.value)} style={selectStyle}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Tipo de peça</label>
          <select value={tipoSelecionado ?? ''} onChange={e => atualizar('tipo', e.target.value)} style={selectStyle}>
            <option value="">Todos os tipos</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Formato</label>
          <select value={formatoSelecionado ?? ''} onChange={e => atualizar('formato', e.target.value)} style={selectStyle}>
            <option value="">Todos os formatos</option>
            {formatos.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>

        {temFiltro && (
          <button onClick={limpar} style={{
            background: 'transparent',
            border: '1px solid #ff33cc44',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#ff33cc',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}