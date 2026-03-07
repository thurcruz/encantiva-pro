'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import DrawerPerfil from './DrawerPerfil'

interface Perfil {
  nome_loja: string | null
  cpf_cnpj: string | null
  telefone: string | null
  endereco: string | null
}

interface Props {
  usuarioId: string
  email: string
  inicial: string
  perfil: Perfil | null
  status: string | null
  expiraEm: string | null
  trialExpiraEm: string | null
  assinaturaAtiva: boolean
  temSubscriptionId: boolean
  isAdmin: boolean
  nomePlano: string
  isTrial: boolean
}

export default function BotaoConfig(props: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Configurações e perfil"
        style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: '#fff',
          border: '1.5px solid #e0e0e0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        className="btn-config"
      >
        <Settings size={16} style={{ color: '#b0b0b0' }} />
      </button>

      <DrawerPerfil
        aberto={aberto}
        onFechar={() => setAberto(false)}
        {...props}
      />

      <style>{`
        .btn-config:hover { border-color: #ff33cc88 !important; }
        .btn-config:hover svg { color: #ff33cc !important; }
      `}</style>
    </>
  )
}