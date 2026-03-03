'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  usuarioId: string
  clienteInicial?: {
    id: string
    nome: string
    telefone: string | null
    email: string | null
    endereco: string | null
    data_aniversario: string | null
    observacoes: string | null
  }
}

export default function FormularioCliente({ usuarioId, clienteInicial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState(clienteInicial?.nome ?? '')
  const [telefone, setTelefone] = useState(clienteInicial?.telefone ?? '')
  const [email, setEmail] = useState(clienteInicial?.email ?? '')
  const [endereco, setEndereco] = useState(clienteInicial?.endereco ?? '')
  const [dataAniversario, setDataAniversario] = useState(clienteInicial?.data_aniversario ?? '')
  const [observacoes, setObservacoes] = useState(clienteInicial?.observacoes ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Nome é obrigatório.')
    setSalvando(true)
    setErro(null)

    if (clienteInicial) {
      const { error } = await supabase.from('clientes').update({
        nome, telefone: telefone || null, email: email || null,
        endereco: endereco || null,
        data_aniversario: dataAniversario || null,
        observacoes: observacoes || null,
        atualizado_em: new Date().toISOString(),
      }).eq('id', clienteInicial.id)

      if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
      router.push(`/clientes/${clienteInicial.id}`)
    } else {
      const { data, error } = await supabase.from('clientes').insert({
        usuario_id: usuarioId, nome,
        telefone: telefone || null, email: email || null,
        endereco: endereco || null,
        data_aniversario: dataAniversario || null,
        observacoes: observacoes || null,
      }).select().single()

      if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
      router.push(`/clientes/${data.id}`)
    }
    router.refresh()
  }

  const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '12px', padding: '12px 16px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#fff', border: '1px solid #eeeeee',
    borderRadius: '16px', padding: '24px', marginBottom: '20px',
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* Dados pessoais */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          👤 Dados pessoais
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente" style={inputStyle} />
          </div>
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Endereço</label>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Data de aniversário</label>
            <input type="date" value={dataAniversario} onChange={e => setDataAniversario(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
          📝 Observações internas
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
          Anotações privadas sobre o cliente
        </p>
        <textarea
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
          rows={4}
          placeholder="Ex: Prefere decoração minimalista, tem filha de 5 anos..."
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {erro && (
        <div style={{ background: '#fff5f5', border: '1px solid #ff33cc33', borderRadius: '12px', padding: '14px 18px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '20px' }}>
          {erro}
        </div>
      )}

      <button type="submit" disabled={salvando} style={{
        width: '100%',
        background: salvando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
        border: 'none', borderRadius: '14px', padding: '16px',
        color: salvando ? '#00000033' : '#fff',
        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
        cursor: salvando ? 'not-allowed' : 'pointer',
      }}>
        {salvando ? 'Salvando...' : clienteInicial ? 'Salvar alterações' : 'Cadastrar cliente'}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}