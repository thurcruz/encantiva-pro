'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Categoria, TipoPeca, Formato } from '@/types/database'

// ── Ícones ─────────────────────────────────────────────
const IconSearch = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4"/><path d="M10 10l3 3"/></svg>
const IconX     = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>

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
  categoriaSelecionada, tipoSelecionado, formatoSelecionado, buscaInicial,
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

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (busca) params.set('busca', busca)
      else params.delete('busca')
      router.push(`${pathname}?${params.toString()}`)
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca])

  const temFiltro = categoriaSelecionada || tipoSelecionado || formatoSelecionado || busca

  const inputBase: React.CSSProperties = {
    background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '10px',
    padding: '9px 12px', color: '#111827',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
    width: '100%', cursor: 'pointer', boxSizing: 'border-box',
  }

  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '10px',
    fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
    letterSpacing: '0.8px', textTransform: 'uppercase',
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px 18px' }}>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
          <IconSearch />
        </span>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar materiais..."
          style={{ ...inputBase, paddingLeft: '36px', paddingRight: busca ? '36px' : '12px', cursor: 'text', borderRadius: '999px' }}
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#f3f4f6', border: 'none', borderRadius: '999px', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Filtros em linha */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px' }}>
          <label style={lbl}>Categoria</label>
          <select value={categoriaSelecionada ?? ''} onChange={e => atualizar('categoria', e.target.value)} style={inputBase}>
            <option value="">Todas</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={lbl}>Tipo de peça</label>
          <select value={tipoSelecionado ?? ''} onChange={e => atualizar('tipo', e.target.value)} style={inputBase}>
            <option value="">Todos</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label style={lbl}>Formato</label>
          <select value={formatoSelecionado ?? ''} onChange={e => atualizar('formato', e.target.value)} style={inputBase}>
            <option value="">Todos</option>
            {formatos.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        {temFiltro && (
          <button
            onClick={limpar}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'transparent', border: '1.5px solid #ffd6f5', borderRadius: '999px', padding: '8px 14px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <IconX /> Limpar
          </button>
        )}
      </div>
    </div>
  )
}