'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import FormularioCliente from '../novo/FormularioCliente'

interface Contrato {
  id: string
  evento_data: string
  evento_local: string | null
  valor_total: number
  status: string
}

interface Props {
  cliente: {
    id: string
    nome: string
    telefone: string | null
    email: string | null
    endereco: string | null
    data_aniversario: string | null
    observacoes: string | null
    criado_em: string
  }
  contratos: Contrato[]
  usuarioId: string
}

export default function ClienteDetalhes({ cliente, contratos, usuarioId }: Props) {
  const [editando, setEditando] = useState(false)
  const [confirmDeletar, setConfirmDeletar] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function deletarCliente() {
    setDeletando(true)
    await supabase.from('listaClientes').delete().eq('id', cliente.id)
    router.push('/clientes')
    router.refresh()
  }

  const cardStyle = {
    background: '#fff', border: '1px solid #eeeeee',
    borderRadius: '16px', padding: '24px', marginBottom: '16px',
  }

  const labelStyle = {
    fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600,
    color: '#00000044', letterSpacing: '1px', textTransform: 'uppercase' as const,
    marginBottom: '4px', display: 'block',
  }

  const badgeStatus: Record<string, { label: string; cor: string; bg: string }> = {
    pendente: { label: 'Pendente', cor: '#cc8800', bg: '#fff8e6' },
    assinado: { label: 'Assinado', cor: '#00aa55', bg: '#e6fff2' },
    cancelado: { label: 'Cancelado', cor: '#cc0000', bg: '#fff0f0' },
  }

  if (editando) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#140033', margin: 0 }}>
            ✏️ Editando cliente
          </h2>
          <button onClick={() => setEditando(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={16} style={{ color: '#00000066' }} />
          </button>
        </div>
        <FormularioCliente usuarioId={usuarioId} clienteInicial={cliente} />
      </div>
    )
  }

  return (
    <div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setEditando(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#f5f0ff', border: '1px solid #9900ff22',
          borderRadius: '10px', padding: '10px 16px',
          color: '#9900ff', fontFamily: 'Inter, sans-serif',
          fontWeight: 600, fontSize: '13px', cursor: 'pointer',
        }}>
          <Pencil size={14} /> Editar
        </button>

        {confirmDeletar ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={deletarCliente} disabled={deletando} style={{ background: '#ff33cc', border: 'none', borderRadius: '10px', padding: '10px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              {deletando ? 'Deletando...' : 'Confirmar'}
            </button>
            <button onClick={() => setConfirmDeletar(false)} style={{ background: '#f9f9f9', border: '1px solid #eeeeee', borderRadius: '10px', padding: '10px 16px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDeletar(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fff5fd', border: '1px solid #ff33cc33',
            borderRadius: '10px', padding: '10px 16px',
            color: '#ff33cc', fontFamily: 'Inter, sans-serif',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}>
            <Trash2 size={14} /> Deletar
          </button>
        )}
      </div>

      {/* Dados */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          👤 Dados pessoais
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Telefone', valor: cliente.telefone },
            { label: 'E-mail', valor: cliente.email },
            { label: 'Endereço', valor: cliente.endereco },
            { label: 'Aniversário', valor: cliente.data_aniversario ? new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null },
          ].map(campo => campo.valor && (
            <div key={campo.label}>
              <span style={labelStyle}>{campo.label}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{campo.valor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Observações */}
      {cliente.observacoes && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 12px 0' }}>
            📝 Observações
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000088', lineHeight: 1.6, margin: 0 }}>
            {cliente.observacoes}
          </p>
        </div>
      )}

      {/* Histórico de contratos */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          📋 Histórico de contratos
        </h2>
        {contratos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contratos.map(contrato => {
              const badge = badgeStatus[contrato.status] ?? badgeStatus.pendente
              return (
                <div key={contrato.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f9f9f9', borderRadius: '12px', padding: '14px 16px', gap: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#140033' }}>
                        {new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{ background: badge.bg, color: badge.cor, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', padding: '2px 8px', borderRadius: '100px' }}>
                        {badge.label}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>
                      {contrato.evento_local && `📍 ${contrato.evento_local} · `}
                      💰 R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <Link href={`/contratos/${contrato.id}`} style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
                    color: '#9900ff', textDecoration: 'none', whiteSpace: 'nowrap',
                  }}>
                    Ver →
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', fontStyle: 'italic', margin: 0 }}>
            Nenhum contrato encontrado para este cliente.
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #140033, #1a0044)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#ff33cc', margin: '0 0 4px 0' }}>
            {contratos.length}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66', margin: 0 }}>
            {contratos.length === 1 ? 'Contrato' : 'Contratos'}
          </p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #140033, #1a0044)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#ff33cc', margin: '0 0 4px 0' }}>
            R$ {contratos.reduce((acc, c) => acc + Number(c.valor_total), 0).toFixed(0).replace('.', ',')}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66', margin: 0 }}>
            Total gerado
          </p>
        </div>
      </div>
    </div>
  )
}