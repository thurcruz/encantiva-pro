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
    if (valor) {
      params.set(chave, valor)
    } else {
      params.delete(chave)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function limpar() {
    router.push(pathname)
  }

  const temFiltro = temaSelecionado || tipoSelecionado || formatoSelecionado

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Tema */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
          <select
            value={temaSelecionado ?? ''}
            onChange={e => atualizar('tema', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Todos os temas</option>
            {temas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* Tipo de peça */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de peça</label>
          <select
            value={tipoSelecionado ?? ''}
            onChange={e => atualizar('tipo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Todos os tipos</option>
            {tipos.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* Formato */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Formato</label>
          <select
            value={formatoSelecionado ?? ''}
            onChange={e => atualizar('formato', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Todos os formatos</option>
            {formatos.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>

        {/* Limpar filtros */}
        {temFiltro && (
          <button
            onClick={limpar}
            className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}