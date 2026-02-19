'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  titulo: string
}

export default function BotaoDeletar({ id, titulo }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDeletar() {
    setDeletando(true)
    await supabase.from('materiais').update({ ativo: false }).eq('id', id)
    router.refresh()
    setConfirmando(false)
    setDeletando(false)
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Confirmar?</span>
        <button onClick={handleDeletar} disabled={deletando} className="text-xs text-red-600 hover:underline font-medium">
          {deletando ? 'Deletando...' : 'Sim'}
        </button>
        <button onClick={() => setConfirmando(false)} className="text-xs text-gray-400 hover:underline">
          Não
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirmando(true)} className="p-1.5 hover:bg-red-50 rounded-lg transition" title={`Deletar ${titulo}`}>
      <Trash2 size={15} className="text-gray-500 hover:text-red-500" />
    </button>
  )
}