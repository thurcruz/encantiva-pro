'use client'

import { useState } from 'react'
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

export default function BotaoPerfil(props: Props) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Perfil e configurações"
        style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
          border: 'none', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '15px', color: '#fff',
          boxShadow: '0 4px 14px rgba(255,51,204,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,51,204,0.5)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(255,51,204,0.4)'
        }}
      >
        {props.inicial}
      </button>

      <DrawerPerfil
        aberto={aberto}
        onFechar={() => setAberto(false)}
        {...props}
      />
    </>
  )
}