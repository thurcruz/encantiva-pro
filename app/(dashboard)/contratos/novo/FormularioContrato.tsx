'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Ícones ───────────────────────────────────────────────
const IconPlus   = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconSearch = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5L12 12"/></svg>
const IconX      = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l9 9M11 2L2 11"/></svg>

interface ItemKit { id: number; descricao: string; quantidade: number; valor: number }
interface Cliente { id: string; nome: string; telefone: string | null; email: string | null; endereco: string | null }
interface Props { usuarioId: string }

const REGRAS_PADRAO = `1. O locatário é responsável pela guarda e conservação dos itens durante o período de locação.
2. Danos, perdas ou extravios serão cobrados separadamente pelo valor de reposição.
3. A devolução deve ocorrer no prazo e local combinados.
4. O não pagamento do sinal implica cancelamento automático da reserva.
5. Em caso de cancelamento com menos de 48h de antecedência, o sinal não será reembolsado.`

const input: React.CSSProperties = {
  width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
  borderRadius: '10px', padding: '10px 12px', color: '#111827',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase',
}
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec',
  borderRadius: '14px', padding: '20px', marginBottom: '12px',
}
const btnPrimario: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
  background: '#ff33cc', color: '#fff', border: 'none',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
  borderRadius: '999px', cursor: 'pointer', padding: '10px 18px',
}

export default function FormularioContrato({ usuarioId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [eventoData, setEventoData] = useState('')
  const [eventoLocal, setEventoLocal] = useState('')
  const [eventoHorario, setEventoHorario] = useState('')
  const [itens, setItens] = useState<ItemKit[]>([{ id: 1, descricao: '', quantidade: 1, valor: 0 }])
  const [formaPagamento, setFormaPagamento] = useState('')
  const [valorSinal, setValorSinal] = useState(0)
  const [regras, setRegras] = useState(REGRAS_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // ── Cliente — busca mista (cadastrado ou nome livre) ──
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  const valorTotal = itens.reduce((acc, i) => acc + i.quantidade * i.valor, 0)

  const clientesFiltrados = useMemo(() =>
    buscaCliente.trim().length >= 1
      ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6)
      : []
  , [buscaCliente, clientes])

  // ✅ CORRIGIDO: tabela clientes (não listaClientes)
  useEffect(() => {
    supabase
      .from('clientes')
      .select('id, nome, telefone, email, endereco')
      .eq('usuario_id', usuarioId)
      .order('nome')
      .then(({ data }) => { if (data) setClientes(data) })
  }, [usuarioId]) // eslint-disable-line

  function selecionarCliente(c: Cliente) {
    setClienteSelecionado(c)
    setBuscaCliente(c.nome)
    setMostrarSugestoes(false)
  }

  function limparCliente() {
    setClienteSelecionado(null)
    setBuscaCliente('')
  }

  function adicionarItem() {
    setItens(p => [...p, { id: Date.now(), descricao: '', quantidade: 1, valor: 0 }])
  }
  function removerItem(id: number) { setItens(p => p.filter(i => i.id !== id)) }
  function atualizarItem(id: number, campo: keyof ItemKit, valor: string) {
    setItens(p => p.map(i => i.id === id ? { ...i, [campo]: campo === 'descricao' ? valor : parseFloat(valor) || 0 } : i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoData) return setErro('Informe a data do evento.')
    if (itens.every(i => !i.descricao)) return setErro('Adicione pelo menos um item.')
    setSalvando(true); setErro(null)

    // Nome final: cliente cadastrado ou texto livre digitado
    const nomeClienteFinal = clienteSelecionado?.nome ?? buscaCliente.trim() ?? null

    const { data, error } = await supabase.from('contratos').insert({
      usuario_id: usuarioId,
      cliente_id: clienteSelecionado?.id ?? null,
      cliente_nome: nomeClienteFinal,
      evento_data: eventoData,
      evento_local: eventoLocal || null,
      evento_horario: eventoHorario || null,
      itens,
      valor_total: valorTotal,
      forma_pagamento: formaPagamento || null,
      valor_sinal: valorSinal,
      regras,
      status: 'pendente',
    }).select().single()

    if (error) { setErro(`Erro: ${error.message}`); setSalvando(false); return }
    router.push(`/contratos/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Cliente — campo misto ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 4px' }}>
          Cliente
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 14px' }}>
          Selecione um cliente cadastrado ou digite o nome livremente
        </p>

        <div style={{ position: 'relative' }}>
          {/* Campo de busca/digitação */}
          <div style={{ display: 'flex', border: `1px solid ${clienteSelecionado ? '#10b981' : '#e8e8ec'}`, borderRadius: '10px', overflow: 'hidden', background: '#fafafa', transition: 'border-color .15s' }}>
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#9ca3af', flexShrink: 0 }}>
              <IconSearch />
            </span>
            <input
              type="text"
              value={buscaCliente}
              onChange={e => {
                setBuscaCliente(e.target.value)
                if (clienteSelecionado) setClienteSelecionado(null)
                setMostrarSugestoes(true)
              }}
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
              placeholder="Buscar cadastrado ou digitar nome..."
              style={{ ...input, border: 'none', background: 'transparent', flex: 1 }}
            />
            {buscaCliente && (
              <button type="button" onClick={limparCliente} style={{ padding: '0 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>
                <IconX />
              </button>
            )}
          </div>

          {/* Badge de cliente vinculado */}
          {clienteSelecionado && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '12px', color: '#fff' }}>
                  {clienteSelecionado.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clienteSelecionado.nome}
                </p>
                {clienteSelecionado.telefone && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', margin: 0 }}>
                    {clienteSelecionado.telefone}
                  </p>
                )}
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#059669', background: '#dcfce7', borderRadius: '999px', padding: '2px 8px', flexShrink: 0 }}>
                Vinculado
              </span>
            </div>
          )}

          {/* Dropdown de sugestões */}
          {mostrarSugestoes && clientesFiltrados.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden', marginTop: '4px' }}>
              {clientesFiltrados.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => selecionarCliente(c)}
                  style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff0fb', border: '1px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '12px', color: '#ff33cc', flexShrink: 0 }}>
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{c.nome}</p>
                    {c.telefone && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{c.telefone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Evento ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 14px' }}>Dados do evento</p>
        <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={lbl}>Data *</label>
            <input type="date" value={eventoData} onChange={e => setEventoData(e.target.value)} required style={input} />
          </div>
          <div>
            <label style={lbl}>Horário</label>
            <input type="text" value={eventoHorario} onChange={e => setEventoHorario(e.target.value)} placeholder="Ex: 14h às 20h" style={input} />
          </div>
          <div>
            <label style={lbl}>Local</label>
            <input type="text" value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} placeholder="Endereço do evento" style={input} />
          </div>
        </div>
      </div>

      {/* ── Itens ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 14px' }}>Itens locados</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <div className="itens-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 36px', gap: '8px' }}>
            <span style={lbl}>Descrição</span>
            <span style={lbl}>Qtd</span>
            <span style={lbl}>Valor unit. (R$)</span>
            <div />
          </div>
          {itens.map(item => (
            <div key={item.id}>
              <div className="item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 36px', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={item.descricao} onChange={e => atualizarItem(item.id, 'descricao', e.target.value)} placeholder="Ex: Painel temático 2×2m" style={input} />
                <input type="number" value={item.quantidade || ''} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} min="1" style={input} />
                <input type="number" value={item.valor || ''} onChange={e => atualizarItem(item.id, 'valor', e.target.value)} placeholder="0,00" min="0" step="0.01" style={input} />
                <button type="button" onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ width: 36, height: 36, borderRadius: '999px', border: `1px solid ${itens.length === 1 ? '#e8e8ec' : '#fecdd3'}`, background: itens.length === 1 ? '#f9fafb' : '#fff5f5', color: itens.length === 1 ? '#d1d5db' : '#ef4444', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconTrash />
                </button>
              </div>
              {/* Mobile */}
              <div className="item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '8px', background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...lbl, margin: 0 }}>Item</span>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => removerItem(item.id)} style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: '999px', padding: '4px 10px', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IconTrash /> Remover
                    </button>
                  )}
                </div>
                <input type="text" value={item.descricao} onChange={e => atualizarItem(item.id, 'descricao', e.target.value)} placeholder="Ex: Painel temático" style={input} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><span style={lbl}>Quantidade</span><input type="number" value={item.quantidade || ''} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} min="1" style={input} /></div>
                  <div><span style={lbl}>Valor unit.</span><input type="number" value={item.valor || ''} onChange={e => atualizarItem(item.id, 'valor', e.target.value)} placeholder="0,00" min="0" step="0.01" style={input} /></div>
                </div>
                {item.valor > 0 && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 700, margin: 0 }}>Subtotal: R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}</p>}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={adicionarItem} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed #ffd6f5', borderRadius: '999px', padding: '8px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
          <IconPlus /> Adicionar item
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Total</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#111827', letterSpacing: '-0.3px' }}>
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* ── Pagamento ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 14px' }}>Pagamento</p>
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={lbl}>Forma de pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
              <option value="">Selecionar</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de crédito">Cartão de crédito</option>
              <option value="Cartão de débito">Cartão de débito</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Valor do sinal (R$)</label>
            <input type="number" value={valorSinal || ''} onChange={e => setValorSinal(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={input} />
          </div>
        </div>
      </div>

      {/* ── Regras ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 4px' }}>Regras e responsabilidades</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 12px' }}>Edite conforme necessário</p>
        <textarea value={regras} onChange={e => setRegras(e.target.value)} rows={8} style={{ ...input, resize: 'vertical', lineHeight: '1.6' }} />
      </div>

      {erro && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', fontFamily: 'Inter, sans-serif', fontSize: '12px', marginBottom: '12px' }}>
          {erro}
        </div>
      )}

      <button type="submit" disabled={salvando} style={{ ...btnPrimario, width: '100%', padding: '14px', borderRadius: '999px', fontSize: '14px', opacity: salvando ? 0.7 : 1, cursor: salvando ? 'not-allowed' : 'pointer' }}>
        {salvando ? 'Gerando contrato...' : 'Gerar contrato'}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .itens-header-desktop { display: none !important; }
          .item-desktop { display: none !important; }
          .item-mobile { display: flex !important; }
          .form-grid-3 { grid-template-columns: 1fr !important; }
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  )
}