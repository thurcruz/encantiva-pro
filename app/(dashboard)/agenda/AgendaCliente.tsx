'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
}

interface Pedido {
  id: string
  nome_cliente: string
  telefone_cliente: string | null
  valor_total: number
  status: string
  data_evento: string
  forma_pagamento: string | null
  observacoes: string | null
  cliente_id: string | null
  catalogo_temas: { nome: string } | null
  catalogo_kits: { nome: string } | null
}

interface Props {
  pedidos: Pedido[]
  usuarioId: string
  temas: { id: string; nome: string }[]
  kits: { id: string; nome: string; tema_id: string }[]
  clientes: Cliente[]
  limiteAtingido?: boolean
}

const DIAS        = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const STATUS: Record<string, { dot: string; color: string; bg: string; label: string }> = {
  pendente:   { dot: '#f59e0b', color: '#d97706', bg: '#fffbf0', label: 'Pendente'   },
  confirmado: { dot: '#10b981', color: '#059669', bg: '#f0fdf9', label: 'Confirmado' },
  concluido:  { dot: '#8b5cf6', color: '#7c3aed', bg: '#f5f3ff', label: 'Concluído'  },
  cancelado:  { dot: '#ef4444', color: '#dc2626', bg: '#fef2f2', label: 'Cancelado'  },
}

const IconChevLeft  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4L6 8l4 4"/></svg>
const IconChevRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4"/></svg>
const IconCalendar  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="1.5"/><path d="M1 5h11M4 1v2M9 1v2"/></svg>
const IconList      = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M4 3h7M4 6.5h7M4 10h7M1.5 3h.5M1.5 6.5h.5M1.5 10h.5"/></svg>
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconBell      = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 1.5a4 4 0 0 1 4 4v3l1 1.5H2L3 8.5v-3a4 4 0 0 1 4-4z"/><path d="M5.5 10.5a1.5 1.5 0 0 0 3 0"/></svg>
const IconX         = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3L3 11"/></svg>
const IconEmpty     = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.4" strokeLinecap="round"><rect x="6" y="6" width="28" height="28" rx="3"/><path d="M12 20h16M12 26h10M20 8v6"/></svg>
const IconCheck     = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>
const IconEdit      = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2l2 2-7 7H2v-2L9 2z"/></svg>
const IconTrash     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5h9M5 3.5V2h3v1.5M10 3.5L9.5 11h-6L3 3.5"/></svg>
const IconUser      = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="4" r="2.5"/><path d="M1.5 11.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/></svg>

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827',
  background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '10px',
  padding: '10px 12px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600,
  color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase',
  display: 'block', marginBottom: '5px',
}
const btnPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: '#ff33cc', color: '#fff', border: 'none',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '9px 18px', whiteSpace: 'nowrap',
}
const btnSecundario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: 'transparent', color: '#ff33cc', border: '1.5px solid #ff33cc',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
  borderRadius: '999px', cursor: 'pointer', padding: '6px 14px', whiteSpace: 'nowrap',
}

interface FormPedido {
  nome_cliente: string; telefone_cliente: string; data_evento: string
  valor_total: string; status: string; tema_id: string; kit_id: string
  forma_pagamento: string; observacoes: string; cliente_id: string
}

function formVazio(dataInicial: string): FormPedido {
  return { nome_cliente: '', telefone_cliente: '', data_evento: dataInicial, valor_total: '', status: 'pendente', tema_id: '', kit_id: '', forma_pagamento: '', observacoes: '', cliente_id: '' }
}
function pedidoParaForm(p: Pedido): FormPedido {
  return { nome_cliente: p.nome_cliente, telefone_cliente: p.telefone_cliente ?? '', data_evento: p.data_evento, valor_total: Number(p.valor_total).toFixed(2).replace('.', ','), status: p.status, tema_id: '', kit_id: '', forma_pagamento: p.forma_pagamento ?? '', observacoes: p.observacoes ?? '', cliente_id: p.cliente_id ?? '' }
}

function ModalPedido({ onClose, pedidoEditando, dataInicial, usuarioId, temas, kits, clientes, onSalvo, onDeletado }: {
  onClose: () => void; pedidoEditando: Pedido | null; dataInicial: string; usuarioId: string
  temas: { id: string; nome: string }[]; kits: { id: string; nome: string; tema_id: string }[]
  clientes: Cliente[]; onSalvo: (pedido: Pedido, isEdicao: boolean) => void; onDeletado: (id: string) => void
}) {
  const isEdicao = !!pedidoEditando
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormPedido>(isEdicao ? pedidoParaForm(pedidoEditando!) : formVazio(dataInicial))
  const [erro, setErro] = useState(''); const [salvo, setSalvo] = useState(false)
  const [confirmarDelete, setConfirmarDelete] = useState(false); const [deletando, setDeletando] = useState(false)
  const [buscaCliente, setBuscaCliente] = useState(isEdicao && pedidoEditando!.cliente_id ? clientes.find(c => c.id === pedidoEditando!.cliente_id)?.nome ?? pedidoEditando!.nome_cliente : isEdicao ? pedidoEditando!.nome_cliente : '')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const supabase = createClient()
  const clientesFiltrados = buscaCliente.length >= 1 ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 5) : []
  const kitsFiltrados = form.tema_id ? kits.filter(k => k.tema_id === form.tema_id) : kits

  function selecionarCliente(c: Cliente) {
    setBuscaCliente(c.nome); setForm(f => ({ ...f, nome_cliente: c.nome, telefone_cliente: c.telefone ?? f.telefone_cliente, cliente_id: c.id })); setMostrarSugestoes(false)
  }
  function limparCliente() { setBuscaCliente(''); setForm(f => ({ ...f, nome_cliente: '', cliente_id: '' })) }

  async function handleSalvar() {
    const nomeFinal = form.cliente_id ? form.nome_cliente : buscaCliente.trim()
    if (!nomeFinal) return setErro('Informe o nome do cliente')
    if (!form.data_evento) return setErro('Informe a data do evento')
    if (!form.valor_total || isNaN(Number(form.valor_total.replace(',', '.')))) return setErro('Informe um valor válido')
    setErro('')
    startTransition(async () => {
      try {
        const payload = { usuario_id: usuarioId, nome_cliente: nomeFinal, telefone_cliente: form.telefone_cliente || null, data_evento: form.data_evento, valor_total: Number(form.valor_total.replace(',', '.')), status: form.status, tema_id: form.tema_id || null, catalogo_kit_id: form.kit_id || null, forma_pagamento: form.forma_pagamento || null, observacoes: form.observacoes || null, cliente_id: form.cliente_id || null, origem: 'manual' }
        if (isEdicao) {
          const { data, error } = await supabase.from('pedidos').update({ ...payload, atualizado_em: new Date().toISOString() }).eq('id', pedidoEditando!.id).eq('usuario_id', usuarioId).select('*, catalogo_temas(nome), catalogo_kits(nome)').single()
          if (error) { setErro('Erro ao atualizar: ' + error.message); return }
          setSalvo(true); setTimeout(() => { onSalvo(data as Pedido, true); onClose() }, 700)
        } else {
          const { data, error } = await supabase.from('pedidos').insert(payload).select('*, catalogo_temas(nome), catalogo_kits(nome)').single()
          if (error) { setErro('Erro ao salvar: ' + error.message); return }
          setSalvo(true); setTimeout(() => { onSalvo(data as Pedido, false); onClose() }, 700)
        }
      } catch { setErro('Erro de conexão. Verifique sua internet.') }
    })
  }

  async function handleDeletar() {
    setDeletando(true)
    const { error } = await supabase.from('pedidos').delete().eq('id', pedidoEditando!.id).eq('usuario_id', usuarioId)
    if (error) { setErro('Erro ao apagar: ' + error.message); setDeletando(false); return }
    onDeletado(pedidoEditando!.id); onClose()
  }

  if (confirmarDelete) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><IconTrash /></div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#111827', textAlign: 'center', margin: '0 0 8px' }}>Apagar pedido?</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>O pedido de <strong>{pedidoEditando!.nome_cliente}</strong> será removido permanentemente.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setConfirmarDelete(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleDeletar} disabled={deletando} style={{ flex: 1, padding: '12px', background: '#dc2626', border: 'none', borderRadius: '999px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: deletando ? 'not-allowed' : 'pointer', opacity: deletando ? 0.7 : 1 }}>{deletando ? 'Apagando...' : 'Apagar'}</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 36px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>{isEdicao ? 'Editar pedido' : 'Novo pedido'}</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>{isEdicao ? pedidoEditando!.nome_cliente : 'Preencha os dados do evento'}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isEdicao && <button onClick={() => setConfirmarDelete(true)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}><IconTrash /></button>}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}><IconX /></button>
          </div>
        </div>
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><IconUser /> Cliente *</span></label>
            <div style={{ display: 'flex', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
              <input style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1 }} placeholder="Buscar cadastrado ou digitar nome..." value={buscaCliente}
                onChange={e => { setBuscaCliente(e.target.value); setForm(f => ({ ...f, nome_cliente: e.target.value, cliente_id: '' })); setMostrarSugestoes(true) }}
                onFocus={() => setMostrarSugestoes(true)} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)} />
              {(form.cliente_id || buscaCliente) && <button onClick={limparCliente} style={{ padding: '0 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}><IconX /></button>}
            </div>
            {form.cliente_id && <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /><span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#059669', fontWeight: 600 }}>Cliente vinculado ao cadastro</span></div>}
            {mostrarSugestoes && clientesFiltrados.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, overflow: 'hidden', marginTop: '4px' }}>
                {clientesFiltrados.map(c => (
                  <button key={c.id} onMouseDown={() => selecionarCliente(c)} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff0fb', border: '1px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '11px', color: '#ff33cc' }}>{c.nome.charAt(0).toUpperCase()}</span></div>
                    <div><p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{c.nome}</p>{c.telefone && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{c.telefone}</p>}</div>
                  </button>
                ))}
              </div>
            )}
            {mostrarSugestoes && buscaCliente.length >= 2 && clientesFiltrados.length === 0 && !form.cliente_id && (
              <div style={{ marginTop: '6px', background: '#fafafa', border: '1px dashed #e8e8ec', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>Nenhum cliente com este nome</span>
                <button onMouseDown={async () => { const { data, error } = await supabase.from('clientes').insert({ usuario_id: usuarioId, nome: buscaCliente.trim(), telefone: form.telefone_cliente || null }).select('id, nome, telefone, email').single(); if (!error && data) selecionarCliente(data as Cliente) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '6px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                  + Criar &ldquo;{buscaCliente.trim()}&rdquo;
                </button>
              </div>
            )}
          </div>
          <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} placeholder="(00) 00000-0000" value={form.telefone_cliente} onChange={e => setForm(f => ({ ...f, telefone_cliente: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>Data do evento *</label><input type="date" style={inputStyle} value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} /></div>
            <div><label style={labelStyle}>Status</label><select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="pendente">Pendente</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>Valor total *</label><input style={inputStyle} placeholder="0,00" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} /></div>
            <div><label style={labelStyle}>Pagamento</label><select style={inputStyle} value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}><option value="">Selecione</option><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão de crédito">Cartão de crédito</option><option value="Cartão de débito">Cartão de débito</option><option value="Transferência">Transferência</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Tema / Ocasião</label>
              {temas.length > 0 ? (
                <select style={inputStyle} value={form.tema_id} onChange={e => setForm(f => ({ ...f, tema_id: e.target.value, kit_id: '' }))}>
                  <option value="">Selecione o tema</option>
                  {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              ) : (
                <input style={{ ...inputStyle, color: '#9ca3af' }} value="Nenhum tema cadastrado" disabled />
              )}
            </div>
            <div>
              <label style={labelStyle}>Kit ({kitsFiltrados.length})</label>
              {kits.length > 0 ? (
                <select style={inputStyle} value={form.kit_id} onChange={e => setForm(f => ({ ...f, kit_id: e.target.value }))}>
                  <option value="">Selecione o kit</option>
                  {kitsFiltrados.map(k => <option key={k.id} value={k.id}>{k.nome}</option>)}
                </select>
              ) : (
                <input style={{ ...inputStyle, color: '#9ca3af' }} value="Nenhum kit cadastrado" disabled />
              )}
            </div>
          </div>
          <div><label style={labelStyle}>Observações</label><textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '68px' }} placeholder="Detalhes extras sobre o evento..." value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px', margin: 0 }}>{erro}</p>}
          <button onClick={handleSalvar} disabled={isPending || salvo} style={{ ...btnPrimario, width: '100%', padding: '14px', borderRadius: '999px', fontSize: '14px', background: salvo ? '#059669' : '#ff33cc', opacity: isPending ? 0.75 : 1, cursor: isPending || salvo ? 'default' : 'pointer', transition: 'background .2s, opacity .2s' }}>
            {salvo ? <><IconCheck /> {isEdicao ? 'Atualizado!' : 'Pedido criado!'}</> : isPending ? 'Salvando...' : isEdicao ? <><IconEdit /> Salvar alterações</> : <><IconPlus /> Criar pedido</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgendaCliente({ pedidos: pedidosIniciais, usuarioId, temas, kits, clientes, limiteAtingido = false }: Props) {
  const agora = new Date()
  const [pedidos, setPedidos] = useState(pedidosIniciais)
  const [mes, setMes] = useState(agora.getMonth())
  const [ano, setAno] = useState(agora.getFullYear())
  const [filtro, setFiltro] = useState('todos')
  const [vis, setVis] = useState<'calendario' | 'lista'>('calendario')
  const [diaSel, setDiaSel] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [dataModal, setDataModal] = useState(agora.toISOString().split('T')[0])
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)

  function mesAnterior() { if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1) }
  function proximoMes() { if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1) }
  function abrirModalNovo(data?: string) {
    if (limiteAtingido) return
    setPedidoEditando(null); setDataModal(data ?? agora.toISOString().split('T')[0]); setModalAberto(true)
  }
  function abrirModalEditar(pedido: Pedido) { setPedidoEditando(pedido); setModalAberto(true) }
  function fecharModal() { setModalAberto(false); setPedidoEditando(null) }

  const pedidosFiltrados = pedidos.filter(p => filtro === 'todos' || p.status === filtro)
  const alertas = pedidos.filter(p => {
    if (p.status === 'cancelado' || p.status === 'concluido') return false
    const dias = Math.ceil((new Date(p.data_evento + 'T00:00:00').getTime() - agora.getTime()) / 86400000)
    return dias >= 0 && dias <= 7
  })
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const hoje = agora.toISOString().split('T')[0]

  function pedidosNoDia(dia: number) {
    const s = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return pedidosFiltrados.filter(p => p.data_evento === s)
  }
  const pedidosDiaSel = diaSel ? pedidosFiltrados.filter(p => p.data_evento === diaSel) : []
  const porMes: Record<string, Pedido[]> = {}
  pedidosFiltrados.forEach(p => { const key = p.data_evento.slice(0, 7); if (!porMes[key]) porMes[key] = []; porMes[key].push(p) })

  function handleSalvo(pedido: Pedido, isEdicao: boolean) {
    if (isEdicao) setPedidos(pp => pp.map(p => p.id === pedido.id ? pedido : p))
    else setPedidos(pp => [...pp, pedido])
  }
  function handleDeletado(id: string) { setPedidos(pp => pp.filter(p => p.id !== id)); if (diaSel && pedidosDiaSel.length <= 1) setDiaSel(null) }

  const toggleBtnStyle = (ativo: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '999px', border: 'none',
    background: ativo ? '#fff' : 'transparent', color: ativo ? '#111827' : '#9ca3af',
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
    boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: '5px',
  })

  return (
    <div>
      {/* Banner limite */}
      {limiteAtingido && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 600 }}>
            🔒 Você atingiu o limite de eventos manuais deste mês.
          </p>
          <a href="/planos" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff', background: '#ff33cc', borderRadius: '999px', padding: '6px 14px', textDecoration: 'none', flexShrink: 0 }}>
            Fazer upgrade →
          </a>
        </div>
      )}

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ color: '#d97706' }}><IconBell /></span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#92400e', margin: 0 }}>{alertas.length} evento{alertas.length > 1 ? 's' : ''} nos próximos 7 dias</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {alertas.map(p => {
              const dias = Math.ceil((new Date(p.data_evento + 'T00:00:00').getTime() - agora.getTime()) / 86400000)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '10px', padding: '9px 12px', gap: '8px', border: '1px solid #fef3c7' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome_cliente}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{p.catalogo_temas?.nome ?? '—'}</p>
                  </div>
                  <span style={{ background: dias === 0 ? '#fef2f2' : '#fffbf0', color: dias === 0 ? '#dc2626' : '#d97706', borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flexShrink: 1 }}>
          {(['todos', 'pendente', 'confirmado', 'concluido', 'cancelado'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '999px', border: `1.5px solid ${filtro === f ? '#ff33cc' : '#e8e8ec'}`, background: filtro === f ? '#ff33cc' : '#fff', color: filtro === f ? '#fff' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}>
              {f !== 'todos' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: filtro === f ? '#fff' : STATUS[f]?.dot, display: 'inline-block' }} />}
              {f === 'todos' ? 'Todos' : STATUS[f]?.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '3px', background: '#f3f4f6', borderRadius: '999px', padding: '3px' }}>
            <button style={toggleBtnStyle(vis === 'calendario')} onClick={() => setVis('calendario')}><IconCalendar /> Calendário</button>
            <button style={toggleBtnStyle(vis === 'lista')} onClick={() => setVis('lista')}><IconList /> Lista</button>
          </div>
          {limiteAtingido ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#f3f4f6', borderRadius: '999px', padding: '9px 18px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'not-allowed' }}>
              🔒 Limite atingido
            </div>
          ) : (
            <button onClick={() => abrirModalNovo()} style={btnPrimario}><IconPlus /> Novo pedido</button>
          )}
        </div>
      </div>

      {/* Calendário */}
      {vis === 'calendario' && (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <button onClick={mesAnterior} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}><IconChevLeft /></button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{MESES_FULL[mes]} {ano}</p>
              {filtro !== 'todos' && (
                <span style={{ background: '#fff0fb', color: '#ff33cc', borderRadius: '999px', padding: '2px 10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700 }}>
                  Mostrando: {STATUS[filtro]?.label}
                </span>
              )}
            </div>
            <button onClick={proximoMes} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}><IconChevRight /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
            {DIAS.map(d => <p key={d} style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textAlign: 'center', margin: 0, padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</p>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px', gap: '2px' }}>
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
              const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const pp = pedidosNoDia(dia); const isHoje = dataStr === hoje; const isSel = diaSel === dataStr
              return (
                <button key={dia} onClick={() => setDiaSel(isSel ? null : dataStr)} style={{ aspectRatio: '1', borderRadius: '999px', border: 'none', background: isSel ? '#ff33cc' : isHoje ? '#fff0fb' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '2px', outline: isHoje && !isSel ? '2px solid #ffccee' : 'none', outlineOffset: '1px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: isHoje ? 800 : 500, color: isSel ? '#fff' : isHoje ? '#ff33cc' : '#374151', margin: 0, lineHeight: 1 }}>{dia}</p>
                  {pp.length > 0 && <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>{pp.slice(0, 3).map((p, i) => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#ffffff99' : STATUS[p.status]?.dot ?? '#ff33cc', display: 'inline-block' }} />)}</div>}
                </button>
              )
            })}
          </div>
          {diaSel && (
            <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>
                  {new Date(diaSel + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {!limiteAtingido && <button onClick={() => abrirModalNovo(diaSel)} style={btnSecundario}><IconPlus /> Adicionar</button>}
              </div>
              {pedidosDiaSel.length > 0
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{pedidosDiaSel.map(p => <PedidoCard key={p.id} pedido={p} clientes={clientes} onEditar={abrirModalEditar} onVinculado={(id, cId) => setPedidos(pp => pp.map(x => x.id === id ? {...x, cliente_id: cId} : x))} />)}</div>
                : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: 0, textAlign: 'center', padding: '16px 0' }}>Nenhum evento neste dia</p>
              }
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {vis === 'lista' && (
        <div>
          {Object.keys(porMes).length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><IconEmpty /></div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum pedido encontrado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>Tente mudar o filtro ou crie um novo pedido</p>
              {!limiteAtingido && <button onClick={() => abrirModalNovo()} style={btnPrimario}><IconPlus /> Criar pedido</button>}
            </div>
          ) : Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0])).map(([key, pp]) => {
            const [y, m] = key.split('-').map(Number)
            return (
              <div key={key} style={{ marginBottom: '20px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>{MESES_SHORT[m - 1]} {y}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pp.map(p => <PedidoCard key={p.id} pedido={p} clientes={clientes} onEditar={abrirModalEditar} onVinculado={(id, cId) => setPedidos(pp2 => pp2.map(x => x.id === id ? {...x, cliente_id: cId} : x))} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalAberto && <ModalPedido onClose={fecharModal} pedidoEditando={pedidoEditando} dataInicial={dataModal} usuarioId={usuarioId} temas={temas} kits={kits} clientes={clientes} onSalvo={handleSalvo} onDeletado={handleDeletado} />}
    </div>
  )
}

const IconLink = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6.5a2.5 2.5 0 0 0 3.5 0l1.2-1.2a2.5 2.5 0 0 0-3.5-3.5L5.5 3"/><path d="M7 5.5a2.5 2.5 0 0 0-3.5 0L2.3 6.7a2.5 2.5 0 0 0 3.5 3.5L7 9"/></svg>

function PedidoCard({ pedido, clientes, onEditar, onVinculado }: {
  pedido: Pedido; clientes: Cliente[]; onEditar: (p: Pedido) => void; onVinculado: (pedidoId: string, clienteId: string) => void
}) {
  const supabase = createClient()
  const s = STATUS[pedido.status] ?? STATUS.pendente
  const agora = new Date()
  const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
  const dias = Math.ceil((dataEvento.getTime() - agora.getTime()) / 86400000)
  const urgente = dias >= 0 && dias <= 7 && pedido.status !== 'cancelado' && pedido.status !== 'concluido'
  const [mostrarVincular, setMostrarVincular] = useState(false)
  const [clienteSel, setClienteSel] = useState('')
  const [vinculando, setVinculando] = useState(false)
  const [vinculado, setVinculado] = useState(false)

  async function vincular(e: React.MouseEvent) {
    e.stopPropagation(); if (!clienteSel) return; setVinculando(true)
    const { error } = await supabase.from('pedidos').update({ cliente_id: clienteSel }).eq('id', pedido.id)
    if (!error) { setVinculado(true); onVinculado(pedido.id, clienteSel); setTimeout(() => setMostrarVincular(false), 800) }
    setVinculando(false)
  }

  return (
    <div style={{ background: urgente ? '#fffbf0' : '#fff', border: `1px solid ${urgente ? '#fde68a' : '#e8e8ec'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color .15s' }}>
      <div onClick={() => onEditar(pedido)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: '#ff33cc', margin: 0, lineHeight: 1 }}>{dataEvento.getDate()}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>{MESES_SHORT[dataEvento.getMonth()]}</p>
        </div>
        <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.nome_cliente}</p>
            {(pedido.cliente_id || vinculado) && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} title="Cliente vinculado" />}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[pedido.catalogo_temas?.nome, pedido.catalogo_kits?.nome].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <span style={{ background: s.bg, color: s.color, borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />{s.label}
        </span>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px', letterSpacing: '-0.2px' }}>R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}</p>
          {pedido.status !== 'cancelado' && pedido.status !== 'concluido' && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: urgente ? '#d97706' : '#d1d5db', margin: 0 }}>{dias < 0 ? `${Math.abs(dias)}d atras` : dias === 0 ? 'Hoje' : dias === 1 ? 'Amanha' : `${dias}d`}</p>}
        </div>
        {!pedido.cliente_id && !vinculado && clientes.length > 0 && (
          <button onClick={e => { e.stopPropagation(); setMostrarVincular(v => !v) }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: mostrarVincular ? '#fff0fb' : '#f9f9f9', border: `1px solid ${mostrarVincular ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '999px', padding: '5px 10px', color: mostrarVincular ? '#ff33cc' : '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
            <IconLink /> Vincular
          </button>
        )}
        {(pedido.cliente_id || vinculado) && <div style={{ color: '#d1d5db', flexShrink: 0 }}><IconEdit /></div>}
      </div>
      {mostrarVincular && !pedido.cliente_id && !vinculado && (
        <div onClick={e => e.stopPropagation()} style={{ borderTop: '1px solid #f3f4f6', padding: '10px 14px', background: '#fafafa', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={clienteSel} onChange={e => setClienteSel(e.target.value)} style={{ flex: 1, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '8px', padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#111827', outline: 'none' }}>
            <option value="">Selecionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button onClick={vincular} disabled={!clienteSel || vinculando} style={{ background: clienteSel ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', padding: '8px 14px', color: clienteSel ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: clienteSel ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
            {vinculando ? '...' : 'Confirmar'}
          </button>
        </div>
      )}
    </div>
  )
}