'use client'

import { useState, useTransition } from 'react'

interface Pedido {
  id: string
  nome_cliente: string
  valor_total: number
  status: string
  data_evento: string
  forma_pagamento: string | null
  observacoes: string | null
  catalogo_temas: { nome: string } | null
  catalogo_kits: { nome: string } | null
}

interface Props {
  pedidos: Pedido[]
  usuarioId: string
  temas: { id: string; nome: string }[]
  kits: { id: string; nome: string; tema_id: string }[]
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const STATUS: Record<string, { dot: string; color: string; bg: string; label: string }> = {
  pendente:   { dot: '#f59e0b', color: '#d97706', bg: '#fffbf0', label: 'Pendente'   },
  confirmado: { dot: '#10b981', color: '#059669', bg: '#f0fdf9', label: 'Confirmado' },
  concluido:  { dot: '#8b5cf6', color: '#7c3aed', bg: '#f5f3ff', label: 'Concluído'  },
  cancelado:  { dot: '#ef4444', color: '#dc2626', bg: '#fef2f2', label: 'Cancelado'  },
}

// ── Ícones ────────────────────────────────────────────────
const IconChevLeft  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4L6 8l4 4"/></svg>
const IconChevRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4"/></svg>
const IconCalendar  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="2" width="11" height="10" rx="1.5"/><path d="M1 5h11M4 1v2M9 1v2"/></svg>
const IconList      = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M4 3h7M4 6.5h7M4 10h7M1.5 3h.5M1.5 6.5h.5M1.5 10h.5"/></svg>
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconBell      = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 1.5a4 4 0 0 1 4 4v3l1 1.5H2L3 8.5v-3a4 4 0 0 1 4-4z"/><path d="M5.5 10.5a1.5 1.5 0 0 0 3 0"/></svg>
const IconX         = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3L3 11"/></svg>
const IconEmpty     = () => <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.4" strokeLinecap="round"><rect x="6" y="6" width="28" height="28" rx="3"/><path d="M12 20h16M12 26h10M20 8v6"/></svg>
const IconCheck     = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5"/></svg>

// ── Estilos reutilizáveis ────────────────────────────────
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
  borderRadius: '999px', cursor: 'pointer', padding: '9px 18px',
  whiteSpace: 'nowrap',
}
const btnSecundario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: 'transparent', color: '#ff33cc',
  border: '1.5px solid #ff33cc',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
  borderRadius: '999px', cursor: 'pointer', padding: '6px 14px',
  whiteSpace: 'nowrap',
}

// ── Modal de novo pedido ──────────────────────────────────
function ModalNovoPedido({
  onClose, dataInicial, usuarioId, temas, kits, onSalvo,
}: {
  onClose: () => void
  dataInicial: string
  usuarioId: string
  temas: { id: string; nome: string }[]
  kits: { id: string; nome: string; tema_id: string }[]
  onSalvo: (pedido: Pedido) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    nome_cliente: '',
    data_evento: dataInicial,
    valor_total: '',
    status: 'pendente',
    tema_id: '',
    kit_id: '',
    forma_pagamento: '',
    observacoes: '',
  })
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  // ✅ Fix: mostra todos os kits se nenhum tema selecionado, filtra se tem tema
  const kitsFiltrados = form.tema_id
    ? kits.filter(k => k.tema_id === form.tema_id)
    : kits

  async function handleSalvar() {
    if (!form.nome_cliente.trim()) return setErro('Informe o nome do cliente')
    if (!form.data_evento) return setErro('Informe a data do evento')
    if (!form.valor_total || isNaN(Number(form.valor_total.replace(',', '.')))) return setErro('Informe um valor válido')
    setErro('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: usuarioId,
            nome_cliente: form.nome_cliente.trim(),
            data_evento: form.data_evento,
            valor_total: Number(form.valor_total.replace(',', '.')),
            status: form.status,
            tema_id: form.tema_id || null,
            kit_id: form.kit_id || null,
            forma_pagamento: form.forma_pagamento || null,
            observacoes: form.observacoes || null,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErro(data?.error ?? 'Erro ao salvar pedido. Tente novamente.')
          return
        }

        setSalvo(true)
        setTimeout(() => { onSalvo(data); onClose() }, 700)
      } catch {
        setErro('Erro de conexão. Verifique sua internet.')
      }
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 36px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px 24px 0 0', zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>Novo pedido</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Preencha os dados do evento</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <IconX />
          </button>
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome do cliente *</label>
            <input style={inputStyle} placeholder="Ex: Maria Silva" value={form.nome_cliente} onChange={e => setForm(f => ({ ...f, nome_cliente: e.target.value }))} />
          </div>

          {/* Data + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Data do evento *</label>
              <input type="date" style={inputStyle} value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Valor + Pagamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Valor total *</label>
              <input
                style={inputStyle}
                placeholder="0,00"
                value={form.valor_total}
                onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Pagamento</label>
              <select style={inputStyle} value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))}>
                <option value="">Selecione</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de crédito">Cartão de crédito</option>
                <option value="Cartão de débito">Cartão de débito</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>
          </div>

          {/* Tema + Kit — sempre visível se tiver kits */}
          {(temas.length > 0 || kits.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {temas.length > 0 && (
                <div>
                  <label style={labelStyle}>Tema</label>
                  <select
                    style={inputStyle}
                    value={form.tema_id}
                    onChange={e => setForm(f => ({ ...f, tema_id: e.target.value, kit_id: '' }))}
                  >
                    <option value="">Todos os temas</option>
                    {temas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              )}
              {kits.length > 0 && (
                <div>
                  <label style={labelStyle}>
                    Kit {form.tema_id ? `(${kitsFiltrados.length})` : `(${kits.length})`}
                  </label>
                  {/* ✅ Fix: nunca disabled, sempre mostra kits disponíveis */}
                  <select
                    style={inputStyle}
                    value={form.kit_id}
                    onChange={e => setForm(f => ({ ...f, kit_id: e.target.value }))}
                  >
                    <option value="">Selecione o kit</option>
                    {kitsFiltrados.map(k => <option key={k.id} value={k.id}>{k.nome}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '68px' }}
              placeholder="Detalhes extras sobre o evento..."
              value={form.observacoes}
              onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
            />
          </div>

          {/* Erro */}
          {erro && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 12px', margin: 0 }}>
              {erro}
            </p>
          )}

          {/* Botão salvar */}
          <button
            onClick={handleSalvar}
            disabled={isPending || salvo}
            style={{
              ...btnPrimario,
              width: '100%', padding: '14px',
              borderRadius: '999px', fontSize: '14px',
              background: salvo ? '#059669' : '#ff33cc',
              opacity: isPending ? 0.75 : 1,
              cursor: isPending || salvo ? 'default' : 'pointer',
              transition: 'background .2s, opacity .2s',
            }}
          >
            {salvo ? <><IconCheck /> Pedido criado!</> : isPending ? 'Salvando...' : <><IconPlus /> Criar pedido</>}
          </button>

        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────
export default function AgendaCliente({ pedidos: pedidosIniciais, usuarioId, temas, kits }: Props) {
  const agora = new Date()
  const [pedidos, setPedidos] = useState(pedidosIniciais)
  const [mes, setMes] = useState(agora.getMonth())
  const [ano, setAno] = useState(agora.getFullYear())
  const [filtro, setFiltro] = useState('todos')
  const [vis, setVis] = useState<'calendario' | 'lista'>('calendario')
  const [diaSel, setDiaSel] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [dataModal, setDataModal] = useState(agora.toISOString().split('T')[0])

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(a => a - 1) } else setMes(m => m - 1)
  }
  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(a => a + 1) } else setMes(m => m + 1)
  }
  function abrirModal(data?: string) {
    setDataModal(data ?? agora.toISOString().split('T')[0])
    setModalAberto(true)
  }

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
  pedidosFiltrados.forEach(p => {
    const key = p.data_evento.slice(0, 7)
    if (!porMes[key]) porMes[key] = []
    porMes[key].push(p)
  })

  const toggleBtnStyle = (ativo: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '999px', border: 'none',
    background: ativo ? '#fff' : 'transparent',
    color: ativo ? '#111827' : '#9ca3af',
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
    cursor: 'pointer',
    boxShadow: ativo ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    transition: 'all .15s',
    display: 'flex', alignItems: 'center', gap: '5px',
  })

  return (
    <div>

      {/* ── Alertas ── */}
      {alertas.length > 0 && (
        <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ color: '#d97706' }}><IconBell /></span>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#92400e', margin: 0 }}>
              {alertas.length} evento{alertas.length > 1 ? 's' : ''} nos próximos 7 dias
            </p>
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

      {/* ── Barra de controles ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', flexShrink: 1 }}>
          {(['todos', 'pendente', 'confirmado', 'concluido', 'cancelado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '999px',
                border: `1.5px solid ${filtro === f ? '#ff33cc' : '#e8e8ec'}`,
                background: filtro === f ? '#ff33cc' : '#fff',
                color: filtro === f ? '#fff' : '#6b7280',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all .15s',
              }}
            >
              {f !== 'todos' && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: filtro === f ? '#fff' : STATUS[f]?.dot, display: 'inline-block' }} />
              )}
              {f === 'todos' ? 'Todos' : STATUS[f]?.label}
            </button>
          ))}
        </div>

        {/* Toggle + botão novo */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '3px', background: '#f3f4f6', borderRadius: '999px', padding: '3px' }}>
            <button style={toggleBtnStyle(vis === 'calendario')} onClick={() => setVis('calendario')}>
              <IconCalendar /> Calendário
            </button>
            <button style={toggleBtnStyle(vis === 'lista')} onClick={() => setVis('lista')}>
              <IconList /> Lista
            </button>
          </div>
          <button onClick={() => abrirModal()} style={btnPrimario}>
            <IconPlus /> Novo pedido
          </button>
        </div>
      </div>

      {/* ── CALENDÁRIO ── */}
      {vis === 'calendario' && (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <button onClick={mesAnterior} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <IconChevLeft />
            </button>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>
              {MESES_FULL[mes]} {ano}
            </p>
            <button onClick={proximoMes} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <IconChevRight />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
            {DIAS.map(d => (
              <p key={d} style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textAlign: 'center', margin: 0, padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</p>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px', gap: '2px' }}>
            {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
              const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
              const pp = pedidosNoDia(dia)
              const isHoje = dataStr === hoje
              const isSel = diaSel === dataStr
              return (
                <button
                  key={dia}
                  onClick={() => setDiaSel(isSel ? null : dataStr)}
                  style={{
                    aspectRatio: '1', borderRadius: '999px', border: 'none',
                    background: isSel ? '#ff33cc' : isHoje ? '#fff0fb' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                    padding: '2px',
                    outline: isHoje && !isSel ? '2px solid #ffccee' : 'none',
                    outlineOffset: '1px',
                  }}
                >
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: isHoje ? 800 : 500, color: isSel ? '#fff' : isHoje ? '#ff33cc' : '#374151', margin: 0, lineHeight: 1 }}>{dia}</p>
                  {pp.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                      {pp.slice(0, 3).map((p, i) => (
                        <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#ffffff99' : STATUS[p.status]?.dot ?? '#ff33cc', display: 'inline-block' }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Detalhe dia selecionado */}
          {diaSel && (
            <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>
                  {new Date(diaSel + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <button onClick={() => abrirModal(diaSel)} style={btnSecundario}>
                  <IconPlus /> Adicionar
                </button>
              </div>
              {pedidosDiaSel.length > 0
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{pedidosDiaSel.map(p => <PedidoCard key={p.id} pedido={p} />)}</div>
                : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db', margin: 0, textAlign: 'center', padding: '16px 0' }}>Nenhum evento neste dia</p>
              }
            </div>
          )}
        </div>
      )}

      {/* ── LISTA ── */}
      {vis === 'lista' && (
        <div>
          {Object.keys(porMes).length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><IconEmpty /></div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>Nenhum pedido encontrado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>Tente mudar o filtro ou crie um novo pedido</p>
              <button onClick={() => abrirModal()} style={btnPrimario}>
                <IconPlus /> Criar pedido
              </button>
            </div>
          ) : (
            Object.entries(porMes)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([key, pp]) => {
                const [y, m] = key.split('-').map(Number)
                return (
                  <div key={key} style={{ marginBottom: '20px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>
                      {MESES_SHORT[m - 1]} {y}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {pp.map(p => <PedidoCard key={p.id} pedido={p} />)}
                    </div>
                  </div>
                )
              })
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modalAberto && (
        <ModalNovoPedido
          onClose={() => setModalAberto(false)}
          dataInicial={dataModal}
          usuarioId={usuarioId}
          temas={temas}
          kits={kits}
          onSalvo={novoPedido => setPedidos(pp => [...pp, novoPedido])}
        />
      )}
    </div>
  )
}

// ── Card de pedido ────────────────────────────────────────
function PedidoCard({ pedido }: { pedido: Pedido }) {
  const s = STATUS[pedido.status] ?? STATUS.pendente
  const agora = new Date()
  const dataEvento = new Date(pedido.data_evento + 'T00:00:00')
  const dias = Math.ceil((dataEvento.getTime() - agora.getTime()) / 86400000)
  const urgente = dias >= 0 && dias <= 7 && pedido.status !== 'cancelado' && pedido.status !== 'concluido'

  return (
    <div style={{ background: urgente ? '#fffbf0' : '#fff', border: `1px solid ${urgente ? '#fde68a' : '#e8e8ec'}`, borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: '#ff33cc', margin: 0, lineHeight: 1 }}>{dataEvento.getDate()}</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>{MESES_SHORT[dataEvento.getMonth()]}</p>
      </div>
      <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.nome_cliente}</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[pedido.catalogo_temas?.nome, pedido.catalogo_kits?.nome].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <span style={{ background: s.bg, color: s.color, borderRadius: '999px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
        {s.label}
      </span>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px', letterSpacing: '-0.2px' }}>
          R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
        </p>
        {pedido.status !== 'cancelado' && pedido.status !== 'concluido' && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: urgente ? '#d97706' : '#d1d5db', margin: 0 }}>
            {dias < 0 ? `${Math.abs(dias)}d atrás` : dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias}d`}
          </p>
        )}
      </div>
    </div>
  )
}