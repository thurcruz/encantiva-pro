'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

interface ItemKit {
  id: number
  descricao: string
  quantidade: number
  valor: number
}

interface Props {
  usuarioId: string
}

const REGRAS_PADRAO = `1. O locatário é responsável pela guarda e conservação dos itens durante o período de locação.
2. Danos, perdas ou extravios serão cobrados separadamente pelo valor de reposição.
3. A devolução deve ocorrer no prazo e local combinados.
4. O não pagamento do sinal implica cancelamento automático da reserva.
5. Em caso de cancelamento com menos de 48h de antecedência, o sinal não será reembolsado.`

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

  const valorTotal = itens.reduce((acc, i) => acc + (i.quantidade * i.valor), 0)

  function adicionarItem() {
    setItens(prev => [...prev, { id: Date.now(), descricao: '', quantidade: 1, valor: 0 }])
  }

  function removerItem(id: number) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  function atualizarItem(id: number, campo: keyof ItemKit, valor: string) {
    setItens(prev => prev.map(i =>
      i.id === id ? { ...i, [campo]: campo === 'descricao' ? valor : parseFloat(valor) || 0 } : i
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eventoData) return setErro('Informe a data do evento.')
    if (itens.every(i => !i.descricao)) return setErro('Adicione pelo menos um item.')
    setSalvando(true)
    setErro(null)

    const { data, error } = await supabase.from('contratos').insert({
      usuario_id: usuarioId,
      cliente_nome: '',
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

  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#140033',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000055',
    marginBottom: '6px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <form onSubmit={handleSubmit}>

      <div style={{ background: '#f5f0ff', border: '1px solid #9900ff22', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9900ff' }}>
        💡 Preencha os dados do kit e evento. O cliente irá preencher os próprios dados pessoais ao assinar.
      </div>

      {/* Evento */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          📅 Dados do evento
        </h2>
        <div className="form-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Data do evento *</label>
            <input type="date" value={eventoData} onChange={e => setEventoData(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Horário</label>
            <input type="text" value={eventoHorario} onChange={e => setEventoHorario(e.target.value)} placeholder="Ex: 14h às 20h" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Local</label>
            <input type="text" value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} placeholder="Endereço do evento" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          🎪 Itens locados
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div className="itens-header-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 36px', gap: '10px' }}>
            <label style={labelStyle}>Descrição</label>
            <label style={labelStyle}>Qtd</label>
            <label style={labelStyle}>Valor unit. (R$)</label>
            <div />
          </div>

          {itens.map(item => (
            <div key={item.id}>
              {/* Desktop */}
              <div className="item-desktop" style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 36px', gap: '10px', alignItems: 'center' }}>
                <input type="text" value={item.descricao} onChange={e => atualizarItem(item.id, 'descricao', e.target.value)} placeholder="Ex: Painel temático 2x2m" style={inputStyle} />
                <input type="number" value={item.quantidade || ''} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} min="1" style={inputStyle} />
                <input type="number" value={item.valor || ''} onChange={e => atualizarItem(item.id, 'valor', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                <button type="button" onClick={() => removerItem(item.id)} disabled={itens.length === 1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: itens.length === 1 ? '#f9f9f9' : '#fff5fd', border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`, borderRadius: '8px', color: itens.length === 1 ? '#00000022' : '#ff33cc', cursor: itens.length === 1 ? 'not-allowed' : 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Mobile */}
              <div className="item-mobile" style={{ display: 'none', flexDirection: 'column', gap: '10px', background: '#f9f9f9', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Item</label>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => removerItem(item.id)} style={{ background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '6px', padding: '4px 10px', color: '#ff33cc', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Remover
                    </button>
                  )}
                </div>
                <input type="text" value={item.descricao} onChange={e => atualizarItem(item.id, 'descricao', e.target.value)} placeholder="Ex: Painel temático 2x2m" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Quantidade</label>
                    <input type="number" value={item.quantidade || ''} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} min="1" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Valor unit. (R$)</label>
                    <input type="number" value={item.valor || ''} onChange={e => atualizarItem(item.id, 'valor', e.target.value)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                  </div>
                </div>
                {item.valor > 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9900ff', fontWeight: 600, margin: 0 }}>
                    Total: R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={adicionarItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #9900ff55', borderRadius: '10px', padding: '10px 16px', color: '#9900ff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Adicionar item
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066' }}>Total</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033' }}>
            R$ {valorTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Pagamento */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 20px 0' }}>
          💰 Pagamento
        </h2>
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Forma de pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecionar</option>
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de crédito">Cartão de crédito</option>
              <option value="Cartão de débito">Cartão de débito</option>
              <option value="Transferência">Transferência</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Valor do sinal (R$)</label>
            <input type="number" value={valorSinal || ''} onChange={e => setValorSinal(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Regras */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>
          📜 Regras e responsabilidades
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 16px 0' }}>
          Edite as regras conforme necessário
        </p>
        <textarea value={regras} onChange={e => setRegras(e.target.value)} rows={8} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {erro && (
        <div style={{ background: '#fff5f5', border: '1px solid #ff33cc33', borderRadius: '12px', padding: '14px 18px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '14px', marginBottom: '20px' }}>
          {erro}
        </div>
      )}

      <button type="submit" disabled={salvando} style={{ width: '100%', background: salvando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '18px', color: salvando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', cursor: salvando ? 'not-allowed' : 'pointer' }}>
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