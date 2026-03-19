'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Pedido {
  id: string
  data_evento: string
  valor_total: number
  status: string
  forma_pagamento: string | null
  catalogo_temas: { nome: string } | null
  catalogo_kits: { nome: string } | null
}

interface PedidoOrfao {
  id: string
  nome_cliente: string
  data_evento: string
  valor_total: number
  status: string
}

interface Contrato {
  id: string
  evento_data: string
  evento_local: string | null
  valor_total: number
  status: string
  itens: { nome: string }[] | null
}

interface ContratoOrfao {
  id: string
  cliente_nome: string
  evento_data: string
  valor_total: number
  status: string
}

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  endereco: string | null
  data_aniversario: string | null
  observacoes: string | null
  criado_em: string
}

interface Props {
  cliente: Cliente
  pedidos: Pedido[]
  contratos: Contrato[]
  pedidosOrfaos: PedidoOrfao[]
  contratosOrfaos: ContratoOrfao[]
  usuarioId: string
}

const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const STATUS_PEDIDO: Record<string, { label: string; cor: string; bg: string; dot: string }> = {
  pendente:   { label: 'Pendente',   cor: '#d97706', bg: '#fffbf0', dot: '#f59e0b' },
  confirmado: { label: 'Confirmado', cor: '#059669', bg: '#f0fdf9', dot: '#10b981' },
  concluido:  { label: 'Concluído',  cor: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  cancelado:  { label: 'Cancelado',  cor: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
}

const STATUS_CONTRATO: Record<string, { label: string; cor: string; bg: string }> = {
  pendente:  { label: 'Pendente',  cor: '#cc8800', bg: '#fff8e6' },
  assinado:  { label: 'Assinado',  cor: '#00aa55', bg: '#e6fff2' },
  cancelado: { label: 'Cancelado', cor: '#cc0000', bg: '#fff0f0' },
}

// ── Ícones ──────────────────────────────────────────────
const IconEdit    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l2 2-7 7H3v-2L10 2z"/></svg>
const IconTrash   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M11 4l-.5 7.5h-7L3 4"/></svg>
const IconX       = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3L3 11"/></svg>
const IconPhone   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2.5s0-1 1-1h1.5l1 2.5-1 1s.5 2 3 3l1-1 2.5 1v1.5c0 1-1 1-1 1C4.5 11 2 5.5 2 2.5z"/></svg>
const IconMail    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="2.5" width="11" height="8" rx="1.5"/><path d="M1 4l5.5 3.5L12 4"/></svg>
const IconPin     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M6.5 1a3 3 0 0 1 3 3c0 2-3 7-3 7S3.5 6 3.5 4a3 3 0 0 1 3-3z"/><circle cx="6.5" cy="4" r="1"/></svg>
const IconCake    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="6" width="11" height="6" rx="1"/><path d="M4 6V4M6.5 6V4M9 6V4M4 4c0-1 .5-1.5 0-2.5M6.5 4c0-1 .5-1.5 0-2.5M9 4c0-1 .5-1.5 0-2.5"/></svg>
const IconNote    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="1" width="9" height="11" rx="1.5"/><path d="M4 4h5M4 6.5h5M4 9h3"/></svg>
const IconChevron = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 4-4 4"/></svg>
const IconLink    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 7.5a3 3 0 0 0 4.2 0l1.5-1.5a3 3 0 0 0-4.2-4.2L6 2.8"/><path d="M7.5 5.5a3 3 0 0 0-4.2 0L1.8 7a3 3 0 0 0 4.2 4.2L7 10.2"/></svg>
const IconCheck   = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#fafafa',
  border: '1px solid #e8e8ec', borderRadius: '10px', padding: '10px 12px',
  color: '#111827', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.5px', textTransform: 'uppercase',
}
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px',
  padding: '20px', marginBottom: '16px',
}

// ── Formulário inline de edição ──────────────────────────
function FormularioCliente({ cliente, usuarioId, onSalvo, onCancelar }: {
  cliente: Cliente
  usuarioId: string
  onSalvo: (c: Cliente) => void
  onCancelar: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    nome: cliente.nome,
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
    endereco: cliente.endereco ?? '',
    data_aniversario: cliente.data_aniversario ?? '',
    observacoes: cliente.observacoes ?? '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    if (!form.nome.trim()) return setErro('Nome é obrigatório')
    setSalvando(true); setErro('')
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...form, nome: form.nome.trim(), atualizado_em: new Date().toISOString() })
        .eq('id', cliente.id).eq('usuario_id', usuarioId)
        .select().single()
      if (error) { setErro('Erro ao salvar: ' + error.message); return }
      onSalvo(data as Cliente)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle}>Nome completo *</label>
        <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Telefone</label>
          <input style={inputStyle} placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>E-mail</label>
          <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Endereço</label>
        <input style={inputStyle} value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Data de aniversário</label>
        <input type="date" style={inputStyle} value={form.data_aniversario} onChange={e => setForm(f => ({ ...f, data_aniversario: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Observações</label>
        <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
      </div>
      {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{erro}</p>}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancelar} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
        <button onClick={salvar} disabled={salvando} style={{ flex: 2, padding: '12px', background: salvando ? '#f0f0f0' : '#ff33cc', border: 'none', borderRadius: '999px', color: salvando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer' }}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

// ── Seção de vínculos órfãos ─────────────────────────────
function SecaoVinculos({ clienteId, clienteNome, pedidosOrfaos, contratosOrfaos, onVinculou }: {
  clienteId: string
  clienteNome: string
  pedidosOrfaos: PedidoOrfao[]
  contratosOrfaos: ContratoOrfao[]
  onVinculou: (tipo: 'pedido' | 'contrato', id: string) => void
}) {
  const supabase = createClient()
  const [vinculando, setVinculando] = useState<string | null>(null)
  const [vinculados, setVinculados] = useState<string[]>([])

  const total = pedidosOrfaos.length + contratosOrfaos.length
  if (total === 0) return null

  async function vincularPedido(id: string) {
    setVinculando(id)
    const { error } = await supabase
      .from('pedidos')
      .update({ cliente_id: clienteId })
      .eq('id', id)
    if (!error) {
      setVinculados(v => [...v, id])
      onVinculou('pedido', id)
    }
    setVinculando(null)
  }

  async function vincularContrato(id: string) {
    setVinculando(id)
    const { error } = await supabase
      .from('contratos')
      .update({ cliente_id: clienteId })
      .eq('id', id)
    if (!error) {
      setVinculados(v => [...v, id])
      onVinculou('contrato', id)
    }
    setVinculando(null)
  }

  return (
    <div style={{ background: '#fffbf0', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>!</span>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#92400e', margin: 0 }}>
          {total} registro{total !== 1 ? 's' : ''} com o nome &ldquo;{clienteNome}&rdquo; sem vínculo
        </p>
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#b45309', margin: '0 0 12px', lineHeight: 1.5 }}>
        Esses pedidos e contratos foram criados antes da vinculação por ID. Clique em &ldquo;Vincular&rdquo; para associá-los a este cliente.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pedidosOrfaos.filter(p => !vinculados.includes(p.id)).map(p => {
          const data = new Date(p.data_evento + 'T00:00:00')
          const jaVinculado = vinculados.includes(p.id)
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #fef3c7', borderRadius: '10px', padding: '10px 12px', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: '0 0 2px' }}>
                  Pedido · {data.getDate()} {MESES_SHORT[data.getMonth()]} {data.getFullYear()}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                  R$ {Number(p.valor_total).toFixed(2).replace('.', ',')} · {p.status}
                </p>
              </div>
              <button
                onClick={() => vincularPedido(p.id)}
                disabled={vinculando === p.id || jaVinculado}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: jaVinculado ? '#f0fdf4' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '6px 12px', color: jaVinculado ? '#059669' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: vinculando === p.id ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: vinculando === p.id ? 0.7 : 1 }}
              >
                {vinculando === p.id ? '...' : jaVinculado ? <><IconCheck /> Vinculado</> : <><IconLink /> Vincular</>}
              </button>
            </div>
          )
        })}

        {contratosOrfaos.filter(c => !vinculados.includes(c.id)).map(c => {
          const data = new Date(c.evento_data + 'T00:00:00')
          const jaVinculado = vinculados.includes(c.id)
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #fef3c7', borderRadius: '10px', padding: '10px 12px', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: '0 0 2px' }}>
                  Contrato · {data.getDate()} {MESES_SHORT[data.getMonth()]} {data.getFullYear()}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                  R$ {Number(c.valor_total).toFixed(2).replace('.', ',')} · {c.status}
                </p>
              </div>
              <button
                onClick={() => vincularContrato(c.id)}
                disabled={vinculando === c.id || jaVinculado}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: jaVinculado ? '#f0fdf4' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '6px 12px', color: jaVinculado ? '#059669' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: vinculando === c.id ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: vinculando === c.id ? 0.7 : 1 }}
              >
                {vinculando === c.id ? '...' : jaVinculado ? <><IconCheck /> Vinculado</> : <><IconLink /> Vincular</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────
export default function ClienteDetalhes({ cliente: clienteInicial, pedidos: pedidosIniciais, contratos: contratosIniciais, pedidosOrfaos: pedidosOrfaosIniciais, contratosOrfaos: contratosOrfaosIniciais, usuarioId }: Props) {
  const [cliente, setCliente] = useState(clienteInicial)
  const [pedidos, setPedidos] = useState(pedidosIniciais)
  const [contratos, setContratos] = useState(contratosIniciais)
  const [pedidosOrfaos, setPedidosOrfaos] = useState(pedidosOrfaosIniciais)
  const [contratosOrfaos, setContratosOrfaos] = useState(contratosOrfaosIniciais)
  const [editando, setEditando] = useState(false)
  const [confirmarDelete, setConfirmarDelete] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'contratos'>('pedidos')
  const router = useRouter()
  const supabase = createClient()

  const aniversarioHoje = cliente.data_aniversario
    ? new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) ===
      new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : false

  const totalGeral = [...pedidos, ...contratos].reduce((acc, p) => acc + Number(p.valor_total), 0)

  function handleVinculou(tipo: 'pedido' | 'contrato', id: string) {
    if (tipo === 'pedido') {
      const orfao = pedidosOrfaos.find(p => p.id === id)
      if (orfao) {
        // Move para a lista de pedidos vinculados (versão simplificada)
        setPedidos(pp => [...pp, {
          id: orfao.id,
          data_evento: orfao.data_evento,
          valor_total: orfao.valor_total,
          status: orfao.status,
          forma_pagamento: null,
          catalogo_temas: null,
          catalogo_kits: null,
        }])
        setPedidosOrfaos(pp => pp.filter(p => p.id !== id))
      }
    } else {
      const orfao = contratosOrfaos.find(c => c.id === id)
      if (orfao) {
        setContratos(cc => [...cc, {
          id: orfao.id,
          evento_data: orfao.evento_data,
          evento_local: null,
          valor_total: orfao.valor_total,
          status: orfao.status,
          itens: null,
        }])
        setContratosOrfaos(cc => cc.filter(c => c.id !== id))
      }
    }
  }

  async function deletarCliente() {
    setDeletando(true)
    await supabase.from('clientes').delete().eq('id', cliente.id).eq('usuario_id', usuarioId)
    router.push('/clientes')
    router.refresh()
  }

  if (confirmarDelete) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}>
            <IconTrash />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>Apagar cliente?</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
            <strong>{cliente.nome}</strong> e todos os seus dados serão removidos permanentemente.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setConfirmarDelete(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={deletarCliente} disabled={deletando} style={{ flex: 1, padding: '12px', background: '#dc2626', border: 'none', borderRadius: '999px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: deletando ? 'not-allowed' : 'pointer', opacity: deletando ? 0.7 : 1 }}>
              {deletando ? 'Apagando...' : 'Apagar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* ── Avatar + ações ── */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff0fb', border: '2px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#ff33cc' }}>
            {cliente.nome.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#111827', margin: 0 }}>{cliente.nome}</p>
            {aniversarioHoje && (
              <span style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '999px', padding: '2px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc' }}>
                Aniversário hoje
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '3px 0 0' }}>
            Cliente desde {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={() => setEditando(!editando)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: editando ? '#fff0fb' : '#fafafa', border: `1px solid ${editando ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '999px', padding: '8px 14px', color: editando ? '#ff33cc' : '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            {editando ? <IconX /> : <IconEdit />} {editando ? 'Cancelar' : 'Editar'}
          </button>
          <button onClick={() => setConfirmarDelete(true)} style={{ width: 34, height: 34, borderRadius: '999px', border: '1px solid #fecaca', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}>
            <IconTrash />
          </button>
        </div>
      </div>

      {/* ── Formulário de edição inline ── */}
      {editando && (
        <div style={cardStyle}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Editar dados</p>
          <FormularioCliente
            cliente={cliente}
            usuarioId={usuarioId}
            onSalvo={c => { setCliente(c); setEditando(false) }}
            onCancelar={() => setEditando(false)}
          />
        </div>
      )}

      {/* ── Dados do cliente ── */}
      {!editando && (
        <div style={cardStyle}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', color: '#9ca3af', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dados pessoais</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cliente.telefone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}><IconPhone /></span>
                <a href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', textDecoration: 'none', fontWeight: 500 }}>
                  {cliente.telefone}
                </a>
              </div>
            )}
            {cliente.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}><IconMail /></span>
                <a href={`mailto:${cliente.email}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', textDecoration: 'none', fontWeight: 500 }}>
                  {cliente.email}
                </a>
              </div>
            )}
            {cliente.endereco && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}><IconPin /></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 500 }}>{cliente.endereco}</span>
              </div>
            )}
            {cliente.data_aniversario && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}><IconCake /></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </span>
              </div>
            )}
            {cliente.observacoes && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', flexShrink: 0, marginTop: '1px' }}><IconNote /></span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{cliente.observacoes}</span>
              </div>
            )}
            {!cliente.telefone && !cliente.email && !cliente.endereco && !cliente.data_aniversario && !cliente.observacoes && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', margin: 0 }}>Nenhum dado preenchido ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Registros órfãos para vincular ── */}
      <SecaoVinculos
        clienteId={cliente.id}
        clienteNome={cliente.nome}
        pedidosOrfaos={pedidosOrfaos}
        contratosOrfaos={contratosOrfaos}
        onVinculou={handleVinculou}
      />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { label: 'Pedidos', valor: pedidos.length.toString() },
          { label: 'Contratos', valor: contratos.length.toString() },
          { label: 'Total gerado', valor: `R$ ${totalGeral.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` },
        ].map(s => (
          <div key={s.label} style={{ background: '#140033', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#ff33cc', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{s.valor}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Abas histórico ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
          {(['pedidos', 'contratos'] as const).map(aba => (
            <button key={aba} onClick={() => setAbaAtiva(aba)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: abaAtiva === aba ? '#fff' : 'transparent', color: abaAtiva === aba ? '#111827' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', boxShadow: abaAtiva === aba ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}>
              {aba === 'pedidos' ? `Pedidos (${pedidos.length})` : `Contratos (${contratos.length})`}
            </button>
          ))}
        </div>

        {/* Pedidos vinculados */}
        {abaAtiva === 'pedidos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pedidos.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', textAlign: 'center', padding: '24px 0', margin: 0 }}>Nenhum pedido vinculado</p>
            ) : pedidos.map(p => {
              const s = STATUS_PEDIDO[p.status] ?? STATUS_PEDIDO.pendente
              const data = new Date(p.data_evento + 'T00:00:00')
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '12px 14px' }}>
                  <div style={{ width: 34, textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 900, color: '#ff33cc', margin: 0, lineHeight: 1 }}>{data.getDate()}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>{MESES_SHORT[data.getMonth()]}</p>
                  </div>
                  <div style={{ width: 1, height: 24, background: '#e5e7eb', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[p.catalogo_temas?.nome, p.catalogo_kits?.nome].filter(Boolean).join(' · ') || 'Pedido'}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{p.forma_pagamento ?? '—'}</p>
                  </div>
                  <span style={{ background: s.bg, color: s.cor, borderRadius: '999px', padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                    {s.label}
                  </span>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0, flexShrink: 0 }}>
                    R$ {Number(p.valor_total).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Contratos vinculados */}
        {abaAtiva === 'contratos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contratos.length === 0 ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#d1d5db', textAlign: 'center', padding: '24px 0', margin: 0 }}>Nenhum contrato vinculado</p>
            ) : contratos.map(c => {
              const badge = STATUS_CONTRATO[c.status] ?? STATUS_CONTRATO.pendente
              const data = new Date(c.evento_data + 'T00:00:00')
              return (
                <a key={c.id} href={`/contratos/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '12px 14px', textDecoration: 'none' }}>
                  <div style={{ width: 34, textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 900, color: '#ff33cc', margin: 0, lineHeight: 1 }}>{data.getDate()}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>{MESES_SHORT[data.getMonth()]}</p>
                  </div>
                  <div style={{ width: 1, height: 24, background: '#e5e7eb', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.evento_local ?? 'Contrato'}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                      {Array.isArray(c.itens) && c.itens.length > 0 ? c.itens.map((i: { nome: string }) => i.nome).join(', ') : '—'}
                    </p>
                  </div>
                  <span style={{ background: badge.bg, color: badge.cor, borderRadius: '999px', padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                    {badge.label}
                  </span>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0, flexShrink: 0 }}>
                    R$ {Number(c.valor_total).toFixed(2).replace('.', ',')}
                  </p>
                  <span style={{ color: '#d1d5db', flexShrink: 0 }}><IconChevron /></span>
                </a>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}