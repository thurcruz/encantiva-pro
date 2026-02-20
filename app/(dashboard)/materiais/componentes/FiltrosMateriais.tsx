'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Tema, TipoPeca, Formato } from '@/types/database'

interface Props {
  temas: Tema[]
  tipos: TipoPeca[]
  formatos: Formato[]
  temaSelecionado?: string
  tipoSelecionado?: string
  formatoSelecionado?: string
}

export default function FiltrosMateriais({
  temas, tipos, formatos,
  temaSelecionado, tipoSelecionado, formatoSelecionado
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set(chave, valor)
    else params.delete(chave)
    router.push(`${pathname}?${params.toString()}`)
  }

  function limpar() {
    router.push(pathname)
  }

  const temFiltro = temaSelecionado || tipoSelecionado || formatoSelecionado

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
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={labelStyle}>Tema</label>
          <select value={temaSelecionado ?? ''} onChange={e => atualizar('tema', e.target.value)} style={selectStyle}>
            <option value="">Todos os temas</option>
            {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
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