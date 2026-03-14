'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

const FORMAS_PAGAMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência']

// ── Ícones ───────────────────────────────────────────────
const IconChevRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4"/></svg>
const IconChevLeft  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4L6 8l4 4"/></svg>
const IconCheck     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l4.5 4.5L15 5"/></svg>
const IconCheckSm   = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.5l2.5 2.5L9 3"/></svg>

interface Tema     { id: string; nome: string; categoria: string; foto_url: string | null }
interface Kit      { id: string; nome: string; descricao: string | null; preco: number; itens: string[]; foto_url?: string | null }
interface Adicional { id: string; nome: string; preco: number; foto_url?: string | null }

interface Props {
  usuarioId: string
  temas: Tema[]
  kits: Kit[]
  adicionais: Adicional[]
  nomeLoja: string | null
  telefone: string | null
}

const btnPrimario = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  background: disabled ? '#f3f4f6' : '#ff33cc',
  border: 'none', borderRadius: '999px', padding: '14px 24px',
  color: disabled ? '#9ca3af' : '#fff',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  width: '100%', transition: 'background .15s',
})

const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  background: '#fff', border: '1.5px solid #e8e8ec', borderRadius: '999px',
  padding: '12px 20px', color: '#374151',
  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
  cursor: 'pointer', flex: '0 0 auto',
}

const input: React.CSSProperties = {
  width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
  borderRadius: '12px', padding: '12px 14px', color: '#111827',
  fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .15s',
}

const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase',
}

export default function FluxoPedido({ usuarioId, temas, kits, adicionais, nomeLoja, telefone }: Props) {
  const supabase = createClient()

  const temKits      = kits.length > 0
  const totalEtapas  = temKits ? 4 : 2  // sem kits: só tema→dados

  const [etapa, setEtapa]     = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pedidoFeito, setPedidoFeito] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [temaSelecionado, setTemaSelecionado]   = useState<Tema | null>(null)
  const [kitSelecionado, setKitSelecionado]     = useState<Kit | null>(null)
  const [adicionaisSel, setAdicionaisSel]       = useState<Adicional[]>([])
  const [temaLivre, setTemaLivre]               = useState('')  // campo "não encontrei meu tema"
  const [mostrarTemaLivre, setMostrarTemaLivre] = useState(false)

  const [form, setForm] = useState({
    nome_cliente: '', telefone_cliente: '', data_evento: '',
    forma_pagamento: '', observacoes: '',
  })

  const categorias      = [...new Set(temas.map(t => t.categoria))].filter(Boolean)
  const temasFiltrados  = categoriaSelecionada ? temas.filter(t => t.categoria === categoriaSelecionada) : temas
  const valorAdicionais = adicionaisSel.reduce((s, a) => s + a.preco, 0)
  const valorTotal      = (kitSelecionado?.preco ?? 0) + valorAdicionais

  function toggleAdicional(a: Adicional) {
    setAdicionaisSel(p => p.find(x => x.id === a.id) ? p.filter(x => x.id !== a.id) : [...p, a])
  }

  // Calcula a etapa real considerando que sem kits pula etapa 2
  function proximaEtapa() {
    if (etapa === 1 && !temKits) setEtapa(3)  // pula kits
    else setEtapa(e => e + 1)
  }
  function etapaAnterior() {
    if (etapa === 3 && !temKits) setEtapa(1)
    else setEtapa(e => e - 1)
  }

  async function enviarPedido() {
    if (!form.nome_cliente || !form.data_evento) return
    setEnviando(true); setErroEnvio(null)

    const nomeTemaMostrar = mostrarTemaLivre && temaLivre
      ? temaLivre
      : (temaSelecionado?.nome ?? null)

    const { error } = await supabase.from('pedidos').insert({
      usuario_id: usuarioId,
      tema_id: mostrarTemaLivre ? null : (temaSelecionado?.id ?? null),
      catalogo_kit_id: kitSelecionado?.id ?? null,
      nome_cliente: form.nome_cliente,
      telefone_cliente: form.telefone_cliente || null,
      data_evento: form.data_evento,
      forma_pagamento: form.forma_pagamento || null,
      observacoes: [
        form.observacoes,
        nomeTemaMostrar && mostrarTemaLivre ? `Tema desejado: ${nomeTemaMostrar}` : null,
        adicionaisSel.length > 0 ? `Adicionais: ${adicionaisSel.map(a => a.nome).join(', ')}` : null,
      ].filter(Boolean).join('\n') || null,
      valor_total: valorTotal,
      status: 'pendente',
    })

    if (error) { setErroEnvio(`Erro ao enviar: ${error.message}`) }
    else { setPedidoFeito(true) }
    setEnviando(false)
  }

  // ── Tela de sucesso ──────────────────────────────────
  if (pedidoFeito) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 28px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #e8e8ec' }}>
          <div style={{ width: 64, height: 64, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff' }}>
            <IconCheck />
          </div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#111827', margin: '0 0 10px' }}>
            Pedido enviado!
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
            Recebemos seu pedido com sucesso.{nomeLoja ? ` ${nomeLoja} ` : ' '}entrará em contato para confirmar os detalhes.
          </p>
          {/* Resumo */}
          <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px' }}>Resumo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(temaSelecionado || temaLivre) && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Tema</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827' }}>{mostrarTemaLivre ? temaLivre : temaSelecionado?.nome}</span>
                </div>
              )}
              {kitSelecionado && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Kit</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827' }}>{kitSelecionado.nome}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>Data</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827' }}>{new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
              {valorTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e8e8ec', marginTop: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#111827' }}>Total</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 900, color: '#ff33cc', letterSpacing: '-0.3px' }}>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
            </div>
          </div>
          {telefone && (
            <a href={`https://wa.me/55${telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ ...btnPrimario(), textDecoration: 'none', background: '#25D366' }}>
              Falar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  const etapaLabel = () => {
    if (etapa === 1) return temas.length === 0 ? 'Sem tema' : 'Tema'
    if (etapa === 2) return 'Kit'
    if (etapa === 3) return 'Seus dados'
    return 'Confirmar'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f8' }}>

      {/* ── Header ── */}
      <div style={{ background: '#ff33cc', padding: '20px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff', margin: '0 0 2px' }}>
            {nomeLoja ?? 'Fazer pedido'}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {etapaLabel()} — passo {etapa} de {totalEtapas}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: '3px', background: '#ffd6f5' }}>
        <div style={{ height: '100%', width: `${(etapa / totalEtapas) * 100}%`, background: '#ff33cc', transition: 'width .3s ease' }} />
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ════ ETAPA 1 — TEMA ════ */}
        {etapa === 1 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>
              {temas.length === 0 ? 'Faça seu pedido' : 'Qual é a ocasião?'}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
              {temas.length === 0 ? 'Preencha seus dados para continuar' : 'Escolha o tema do seu evento'}
            </p>

            {temas.length > 0 && !mostrarTemaLivre && (
              <>
                {/* Filtro por categoria */}
                {categorias.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '14px' }}>
                    <button
                      onClick={() => setCategoriaSelecionada('')}
                      style={{ padding: '6px 14px', borderRadius: '999px', border: `1.5px solid ${!categoriaSelecionada ? '#ff33cc' : '#e8e8ec'}`, background: !categoriaSelecionada ? '#ff33cc' : '#fff', color: !categoriaSelecionada ? '#fff' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Todos
                    </button>
                    {categorias.map(cat => (
                      <button key={cat}
                        onClick={() => setCategoriaSelecionada(cat)}
                        style={{ padding: '6px 14px', borderRadius: '999px', border: `1.5px solid ${categoriaSelecionada === cat ? '#ff33cc' : '#e8e8ec'}`, background: categoriaSelecionada === cat ? '#ff33cc' : '#fff', color: categoriaSelecionada === cat ? '#fff' : '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid de temas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {temasFiltrados.map(tema => {
                    const sel = temaSelecionado?.id === tema.id
                    return (
                      <button key={tema.id} onClick={() => setTemaSelecionado(sel ? null : tema)}
                        style={{ background: sel ? '#fff0fb' : '#fff', border: `2px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', padding: 0, textAlign: 'left', transition: 'border-color .15s' }}
                      >
                        <div style={{ height: '80px', background: '#f5f0ff', position: 'relative', overflow: 'hidden' }}>
                          {tema.foto_url
                            ? <NextImage src={tema.foto_url} fill style={{ objectFit: 'cover' }} alt={tema.nome} unoptimized />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🎨</div>
                          }
                          {sel && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              <IconCheckSm />
                            </div>
                          )}
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: sel ? '#ff33cc' : '#111827', margin: 0, padding: '9px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tema.nome}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Botão não encontrei */}
                <button
                  onClick={() => { setMostrarTemaLivre(true); setTemaSelecionado(null) }}
                  style={{ width: '100%', background: 'transparent', border: '1.5px dashed #ffd6f5', borderRadius: '12px', padding: '12px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginBottom: '16px' }}
                >
                  Não encontrei meu tema
                </button>
              </>
            )}

            {/* Campo de tema livre */}
            {(mostrarTemaLivre || temas.length === 0) && (
              <div style={{ marginBottom: '16px' }}>
                {mostrarTemaLivre && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={lbl}>Descreva o tema desejado</span>
                    <button onClick={() => { setMostrarTemaLivre(false); setTemaLivre('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer' }}>
                      ← Voltar aos temas
                    </button>
                  </div>
                )}
                {temas.length === 0 && <span style={lbl}>Tema do evento (opcional)</span>}
                <input
                  style={input}
                  placeholder="Ex: Dinossauro verde, Jardim encantado..."
                  value={temaLivre}
                  onChange={e => setTemaLivre(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')}
                  onBlur={e => (e.target.style.borderColor = '#e8e8ec')}
                />
              </div>
            )}

            <button
              onClick={proximaEtapa}
              disabled={temas.length > 0 && !mostrarTemaLivre && !temaSelecionado}
              style={btnPrimario(temas.length > 0 && !mostrarTemaLivre && !temaSelecionado)}
            >
              Próximo <IconChevRight />
            </button>
          </div>
        )}

        {/* ════ ETAPA 2 — KIT ════ */}
        {etapa === 2 && temKits && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Escolha o kit</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
              {temaSelecionado ? `Tema: ${temaSelecionado.nome}` : temaLivre ? `Tema: ${temaLivre}` : 'Selecione o pacote ideal'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: adicionais.length > 0 ? '24px' : '16px' }}>
              {kits.map(kit => {
                const sel = kitSelecionado?.id === kit.id
                return (
                  <button key={kit.id} onClick={() => setKitSelecionado(sel ? null : kit)}
                    style={{ background: sel ? '#fff0fb' : '#fff', border: `2px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '12px', transition: 'border-color .15s' }}
                  >
                    {kit.foto_url && (
                      <div style={{ width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <NextImage src={kit.foto_url} fill style={{ objectFit: 'cover' }} alt={kit.nome} unoptimized />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{kit.nome}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '15px', color: '#ff33cc', margin: 0, letterSpacing: '-0.3px', flexShrink: 0, marginLeft: '8px' }}>
                          R$ {Number(kit.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      {kit.descricao && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 6px' }}>{kit.descricao}</p>}
                      {Array.isArray(kit.itens) && kit.itens.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {kit.itens.map((item: string) => (
                            <span key={item} style={{ background: sel ? '#fff0fb' : '#f5f0ff', color: '#7700ff', borderRadius: '999px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600 }}>{item}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {sel && (
                      <div style={{ width: 22, height: 22, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, alignSelf: 'center' }}>
                        <IconCheckSm />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Adicionais */}
            {adicionais.length > 0 && (
              <>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 10px' }}>
                  Adicionais <span style={{ color: '#9ca3af', fontWeight: 400 }}>— opcional</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {adicionais.map(a => {
                    const sel = !!adicionaisSel.find(x => x.id === a.id)
                    return (
                      <button key={a.id} onClick={() => toggleAdicional(a)}
                        style={{ background: sel ? '#fff0fb' : '#fff', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color .15s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '999px', background: sel ? '#ff33cc' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>
                            {sel && <IconCheckSm />}
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{a.nome}</p>
                        </div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: 0 }}>
                          + R$ {Number(a.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /> Voltar</button>
              <button onClick={proximaEtapa} disabled={!kitSelecionado} style={{ ...btnPrimario(!kitSelecionado), flex: 1 }}>
                Próximo <IconChevRight />
              </button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 3 — DADOS ════ */}
        {etapa === 3 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Seus dados</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Preencha para finalizarmos seu pedido</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Nome completo *</label>
                <input style={input} placeholder="Seu nome" value={form.nome_cliente} onChange={e => setForm(p => ({ ...p, nome_cliente: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
              </div>
              <div>
                <label style={lbl}>WhatsApp</label>
                <input style={input} placeholder="(00) 00000-0000" value={form.telefone_cliente} onChange={e => setForm(p => ({ ...p, telefone_cliente: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
              </div>
              <div>
                <label style={lbl}>Data do evento *</label>
                <input type="date" style={input} value={form.data_evento} onChange={e => setForm(p => ({ ...p, data_evento: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
              </div>
              <div>
                <label style={lbl}>Forma de pagamento</label>
                <select style={{ ...input, cursor: 'pointer' }} value={form.forma_pagamento} onChange={e => setForm(p => ({ ...p, forma_pagamento: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Observações</label>
                <textarea style={{ ...input, resize: 'none' }} rows={3} placeholder="Alguma informação adicional..." value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /> Voltar</button>
              <button onClick={proximaEtapa} disabled={!form.nome_cliente || !form.data_evento}
                style={{ ...btnPrimario(!form.nome_cliente || !form.data_evento), flex: 1 }}>
                Próximo <IconChevRight />
              </button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 4 — RESUMO ════ */}
        {etapa === 4 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Confirmar pedido</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Verifique os dados antes de enviar</p>

            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Tema', value: mostrarTemaLivre ? temaLivre : temaSelecionado?.nome, show: !!(mostrarTemaLivre ? temaLivre : temaSelecionado) },
                  { label: 'Kit', value: kitSelecionado?.nome, show: !!kitSelecionado },
                  { label: 'Nome', value: form.nome_cliente, show: true },
                  { label: 'Data', value: new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR'), show: true },
                  { label: 'WhatsApp', value: form.telefone_cliente, show: !!form.telefone_cliente },
                  { label: 'Pagamento', value: form.forma_pagamento, show: !!form.forma_pagamento },
                  { label: 'Adicionais', value: adicionaisSel.map(a => a.nome).join(', '), show: adicionaisSel.length > 0 },
                ].filter(i => i.show).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {valorTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827' }}>Total</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#ff33cc', letterSpacing: '-0.3px' }}>
                    R$ {valorTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>

            {erroEnvio && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', margin: 0 }}>{erroEnvio}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /> Voltar</button>
              <button onClick={enviarPedido} disabled={enviando} style={{ ...btnPrimario(enviando), flex: 1 }}>
                {enviando ? 'Enviando...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}