'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import NextImage from 'next/image'

const FORMAS_PAGAMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência']

interface Tema {
  id: string
  nome: string
  categoria: string
  foto_url: string | null
}

interface Kit {
  id: string
  nome: string
  descricao: string | null
  preco: number
  itens: string[]
}

interface Adicional {
  id: string
  nome: string
  preco: number
}

interface Props {
  usuarioId: string
  temas: Tema[]
  kits: Kit[]
  adicionais: Adicional[]
}

export default function FluxoPedido({ usuarioId, temas, kits, adicionais }: Props) {
  const supabase = createClient()

  const [etapa, setEtapa] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pedidoFeito, setPedidoFeito] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState<Tema | null>(null)
  const [kitSelecionado, setKitSelecionado] = useState<Kit | null>(null)
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<Adicional[]>([])
  const [form, setForm] = useState({
    nome_cliente: '',
    telefone_cliente: '',
    data_evento: '',
    forma_pagamento: '',
    observacoes: '',
  })

  const categoriasTemas = [...new Set(temas.map(t => t.categoria))].filter(Boolean)
  const temasFiltrados = temas.filter(t => t.categoria === categoriaSelecionada)
  const valorAdicionais = adicionaisSelecionados.reduce((acc, a) => acc + a.preco, 0)
  const valorTotal = (kitSelecionado?.preco ?? 0) + valorAdicionais

  function toggleAdicional(adicional: Adicional) {
    setAdicionaisSelecionados(prev =>
      prev.find(a => a.id === adicional.id)
        ? prev.filter(a => a.id !== adicional.id)
        : [...prev, adicional]
    )
  }

  async function enviarPedido() {
    if (!temaSelecionado || !kitSelecionado || !form.nome_cliente || !form.data_evento) return
    setEnviando(true)
    setErroEnvio(null)

    const { error } = await supabase.from('gestorPedidos').insert({
      usuario_id: usuarioId,
      tema_id: temaSelecionado.id,
      catalogo_kit_id: kitSelecionado.id,
      nome_cliente: form.nome_cliente,
      telefone_cliente: form.telefone_cliente || null,
      data_evento: form.data_evento,
      forma_pagamento: form.forma_pagamento || null,
      adicionais: adicionaisSelecionados.map(a => a.nome),
      valor_total: valorTotal,
      observacoes: form.observacoes || null,
      status: 'pendente',
    })

    if (error) {
      setErroEnvio(`Erro ao enviar pedido: ${error.message}`)
    } else {
      setPedidoFeito(true)
    }
    setEnviando(false)
  }

  const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '14px', padding: '14px 16px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  }

  if (pedidoFeito) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '48px 32px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 24px 64px rgba(153,0,255,0.1)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={32} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '26px', color: '#140033', margin: '0 0 12px 0' }}>
            Pedido enviado! 🎉
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000066', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Seu pedido foi recebido com sucesso. Em breve entraremos em contato para confirmar os detalhes.
          </p>
          <div style={{ background: '#f9f9f9', borderRadius: '14px', padding: '16px', textAlign: 'left' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 8px 0' }}>Resumo do pedido</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 4px 0' }}>
              {temaSelecionado?.nome} — {kitSelecionado?.nome}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 4px 0' }}>
              📅 {new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#9900ff', margin: 0 }}>
              R$ {valorTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#fff', margin: '0 0 4px 0' }}>
          ✨ Faça seu pedido
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Passo {etapa} de 4
        </p>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: '4px', background: '#e5e5e5' }}>
        <div style={{ height: '100%', width: `${(etapa / 4) * 100}%`, background: 'linear-gradient(90deg, #ff33cc, #9900ff)', transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px' }}>

        {/* ETAPA 1 — Categoria + Tema */}
        {etapa === 1 && (
          <div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 6px 0' }}>
              Qual é a ocasião?
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Escolha a categoria do seu evento
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {categoriasTemas.map(cat => (
                <button key={cat} onClick={() => { setCategoriaSelecionada(cat); setTemaSelecionado(null) }} style={{ padding: '16px', background: categoriaSelecionada === cat ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff', border: `2px solid ${categoriaSelecionada === cat ? 'transparent' : '#e5e5e5'}`, borderRadius: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: categoriaSelecionada === cat ? '#fff' : '#140033', textAlign: 'center' }}>
                  {cat}
                </button>
              ))}
            </div>

            {categoriaSelecionada && temasFiltrados.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '24px 0 12px 0' }}>
                  Escolha o tema
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {temasFiltrados.map(tema => (
                    <button key={tema.id} onClick={() => setTemaSelecionado(tema)} style={{ background: temaSelecionado?.id === tema.id ? '#fff5fd' : '#fff', border: `2px solid ${temaSelecionado?.id === tema.id ? '#ff33cc' : '#e5e5e5'}`, borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                      <div style={{ height: '80px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', position: 'relative' }}>
                        {tema.foto_url && (
                          <NextImage src={tema.foto_url} fill style={{ objectFit: 'cover' }} alt={tema.nome} unoptimized />
                        )}
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: temaSelecionado?.id === tema.id ? '#ff33cc' : '#140033', margin: 0, padding: '10px 12px' }}>
                        {tema.nome}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => setEtapa(2)} disabled={!temaSelecionado} style={{ width: '100%', marginTop: '24px', background: !temaSelecionado ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '16px', color: !temaSelecionado ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: !temaSelecionado ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Próximo <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ETAPA 2 — Kit + Adicionais */}
        {etapa === 2 && (
          <div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 6px 0' }}>
              Escolha o kit
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Tema: <strong>{temaSelecionado?.nome}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kits.map(kit => (
                <button key={kit.id} onClick={() => setKitSelecionado(kit)} style={{ background: kitSelecionado?.id === kit.id ? 'linear-gradient(135deg, #fff5fd, #f5f0ff)' : '#fff', border: `2px solid ${kitSelecionado?.id === kit.id ? '#ff33cc' : '#e5e5e5'}`, borderRadius: '16px', padding: '18px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: 0 }}>{kit.nome}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#9900ff', margin: 0 }}>
                      R$ {Number(kit.preco).toFixed(2)}
                    </p>
                  </div>
                  {kit.descricao && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 8px 0' }}>{kit.descricao}</p>
                  )}
                  {Array.isArray(kit.itens) && kit.itens.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {kit.itens.map((item: string) => (
                        <span key={item} style={{ background: '#f5f0ff', borderRadius: '20px', padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#9900ff' }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {adicionais.length > 0 && (
              <>
                <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '24px 0 12px 0' }}>
                  Adicionais (opcional)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {adicionais.map(adicional => {
                    const selecionado = adicionaisSelecionados.find(a => a.id === adicional.id)
                    return (
                      <button key={adicional.id} onClick={() => toggleAdicional(adicional)} style={{ background: selecionado ? 'linear-gradient(135deg, #fff5fd, #f5f0ff)' : '#fff', border: `2px solid ${selecionado ? '#ff33cc' : '#e5e5e5'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: selecionado ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f0f0f0', border: `2px solid ${selecionado ? 'transparent' : '#e5e5e5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selecionado && <Check size={11} style={{ color: '#fff' }} />}
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#140033', margin: 0 }}>{adicional.nome}</p>
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9900ff', margin: 0 }}>
                          + R$ {Number(adicional.preco).toFixed(2)}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setEtapa(1)} style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', padding: '16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={18} /> Voltar
              </button>
              <button onClick={() => setEtapa(3)} disabled={!kitSelecionado} style={{ flex: 2, background: !kitSelecionado ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '16px', color: !kitSelecionado ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: !kitSelecionado ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Próximo <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3 — Dados */}
        {etapa === 3 && (
          <div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 6px 0' }}>
              Seus dados
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Preencha para finalizarmos seu pedido
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input value={form.nome_cliente} onChange={e => setForm(p => ({ ...p, nome_cliente: e.target.value }))} placeholder="Seu nome" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input value={form.telefone_cliente} onChange={e => setForm(p => ({ ...p, telefone_cliente: e.target.value }))} placeholder="(00) 00000-0000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Data do evento *</label>
                <input type="date" value={form.data_evento} onChange={e => setForm(p => ({ ...p, data_evento: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Forma de pagamento</label>
                <select value={form.forma_pagamento} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Alguma informação adicional..." rows={3} style={{ ...inputStyle, resize: 'none' as const }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setEtapa(2)} style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', padding: '16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={18} /> Voltar
              </button>
              <button onClick={() => setEtapa(4)} disabled={!form.nome_cliente || !form.data_evento} style={{ flex: 2, background: !form.nome_cliente || !form.data_evento ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '16px', color: !form.nome_cliente || !form.data_evento ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: !form.nome_cliente || !form.data_evento ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Próximo <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4 — Resumo + Confirmar */}
        {etapa === 4 && (
          <div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 6px 0' }}>
              Resumo do pedido
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: '0 0 24px 0' }}>
              Confirme os dados antes de enviar
            </p>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid #eeeeee' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '🎨', label: 'Tema', value: `${temaSelecionado?.nome} (${categoriaSelecionada})` },
                  { icon: '📦', label: 'Kit', value: kitSelecionado?.nome },
                  { icon: '👤', label: 'Nome', value: form.nome_cliente },
                  { icon: '📅', label: 'Data', value: new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR') },
                  { icon: '💳', label: 'Pagamento', value: form.forma_pagamento || 'Não informado' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', margin: '0 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#140033', margin: 0 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
                {adicionaisSelecionados.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>✨</span>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', margin: '0 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adicionais</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: '#140033', margin: 0 }}>{adicionaisSelecionados.map(a => a.nome).join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #eeeeee', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>Total</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#9900ff', margin: 0 }}>
                  R$ {valorTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {erroEnvio && (
              <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#cc0000', margin: 0 }}>
                  ⚠️ {erroEnvio}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEtapa(3)} style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e5', borderRadius: '14px', padding: '16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={18} /> Voltar
              </button>
              <button onClick={enviarPedido} disabled={enviando} style={{ flex: 2, background: enviando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '16px', color: enviando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: enviando ? 'none' : '0 8px 32px rgba(255,51,204,0.3)' }}>
                {enviando ? 'Enviando...' : '🎉 Confirmar pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}