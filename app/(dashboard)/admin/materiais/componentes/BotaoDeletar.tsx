'use client'

import { useState } from 'react'
import { Trash2, X, Check } from 'lucide-react'
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

  const { error } = await supabase
    .from('materiais')
    .update({ ativo: false })
    .eq('id', id)

  if (error) {
    alert(`Erro: ${error.message}`)
    setDeletando(false)
    setConfirmando(false)
    return
  }

  window.location.reload()
}

  if (confirmando) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#ff33cc11',
        border: '1px solid #ff33cc33',
        borderRadius: '8px',
        padding: '4px 8px',
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#ff33cc',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          Deletar?
        </span>
        <button
          onClick={handleDeletar}
          disabled={deletando}
          title="Confirmar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px',
            background: '#ff33cc',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: deletando ? 'not-allowed' : 'pointer',
            opacity: deletando ? 0.5 : 1,
          }}
        >
          {deletando ? (
            <span style={{ fontSize: '10px' }}>⏳</span>
          ) : (
            <Check size={12} />
          )}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          title="Cancelar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px',
            background: '#ffffff11',
            border: '1px solid #ffffff18',
            borderRadius: '6px',
            color: '#ffffff88',
            cursor: 'pointer',
          }}
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      title={`Deletar ${titulo}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px',
        background: '#ffffff0d',
        border: '1px solid #ffffff18',
        borderRadius: '8px',
        color: '#ffffff55',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#ff33cc22'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#ff33cc44'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#ff33cc'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#ffffff0d'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#ffffff18'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#ffffff55'
      }}
    >
      <Trash2 size={14} />
    </button>
  )
}