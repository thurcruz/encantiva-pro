'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FORMAS_PAGAMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência']

const IconChevRight = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l4 4-4 4"/></svg>
const IconChevLeft  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4L6 8l4 4"/></svg>
const IconCheck     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l4.5 4.5L15 5"/></svg>
const IconCheckSm   = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.5l2.5 2.5L9 3"/></svg>
const IconSearch    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4"/><path d="M10 10l3 3"/></svg>
const IconWA        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>

interface Tema      { id: string; nome: string; categoria: string; categorias: string[]; foto_url: string | null }
interface Kit       { id: string; nome: string; descricao: string | null; origem?: string | null; preco: number; itens: string[]; foto_url?: string | null }
interface Adicional { id: string; nome: string; preco: number; categoria: string | null; foto_url?: string | null }

interface Props {
  usuarioId: string
  temas: Tema[]
  kits: Kit[]
  adicionais: Adicional[]
  nomeLoja: string | null
  telefone: string | null
  vagasPadrao: number
}

const btnPrimario = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  background: disabled ? '#f3f4f6' : '#ff33cc',
  border: 'none', borderRadius: '999px', padding: '14px 24px',
  color: disabled ? '#9ca3af' : '#fff',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
  cursor: disabled ? 'not-allowed' : 'pointer', width: '100%', transition: 'background .15s',
})
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  background: '#fff', border: '1.5px solid #e8e8ec', borderRadius: '999px',
  padding: '12px 20px', color: '#374151',
  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
  cursor: 'pointer', flexShrink: 0,
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

// ── Rodapé fixo com total ────────────────────────────────
function RodapeTotal({
  valorTotal, kitSelecionado, adicionaisSel, etapaDisplay,
}: {
  valorTotal: number
  kitSelecionado: Kit | null
  adicionaisSel: Adicional[]
  etapaDisplay: number
}) {
  if (valorTotal === 0) return null
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#fff', borderTop: '1px solid #f3f4f6',
      padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 2px' }}>
            Total estimado
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#ff33cc', margin: 0, letterSpacing: '-0.5px' }}>
              R$ {valorTotal.toFixed(2).replace('.', ',')}
            </p>
          </div>
          {kitSelecionado && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {kitSelecionado.nome}
              {adicionaisSel.length > 0 && ` + ${adicionaisSel.length} adicional${adicionaisSel.length > 1 ? 'is' : ''}`}
            </p>
          )}
        </div>
        <div style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '10px', padding: '6px 12px', flexShrink: 0 }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#ff33cc', margin: '0 0 1px', letterSpacing: '0.3px' }}>Etapa {etapaDisplay}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: 0 }}>Preço pode variar</p>
        </div>
      </div>
    </div>
  )
}

export default function FluxoPedido({ usuarioId, temas, kits, adicionais, nomeLoja, telefone, vagasPadrao }: Props) {
  const supabase = createClient()
  const temKits      = kits.length > 0
  const temAdicionais = adicionais.length > 0

  // Sequência de etapas existentes (1=ocasião, 2=tema, 3=kit, 4=adicionais, 5=dados, 6=confirm)
  const STEPS = [1, 2, ...(temKits ? [3] : []), ...(temAdicionais ? [4] : []), 5, 6]
  const totalEtapas = STEPS.length

  const [etapa, setEtapa]             = useState(1)
  const [enviando, setEnviando]       = useState(false)
  const [pedidoFeito, setPedidoFeito] = useState(false)
  const [erroEnvio, setErroEnvio]     = useState<string | null>(null)

  const [ocasiao, setOcasiao]         = useState('')
  const [temaSelecionado, setTemaSelecionado] = useState<Tema | null>(null)
  const [temaLivre, setTemaLivre]     = useState('')
  const [mostrarTemaLivre, setMostrarTemaLivre] = useState(false)
  const [buscaTema, setBuscaTema]     = useState('')
  const [kitSelecionado, setKitSelecionado] = useState<Kit | null>(null)
  const [adicionaisSel, setAdicionaisSel] = useState<Adicional[]>([])
  const [form, setForm] = useState({ nome_cliente: '', telefone_cliente: '', data_evento: '', forma_pagamento: '', observacoes: '' })
  const [vagasInfo, setVagasInfo]     = useState<{ total: number; usadas: number } | null>(null)
  const [verificandoVagas, setVerificandoVagas] = useState(false)

  const todasCategorias = [...new Set(
    temas.flatMap(t => t.categorias?.length > 0 ? t.categorias : (t.categoria ? [t.categoria] : []))
  )].filter(Boolean).sort()

  const temasFiltrados = (() => {
    let lista = ocasiao
      ? temas.filter(t => {
          const cats = t.categorias?.length > 0 ? t.categorias : (t.categoria ? [t.categoria] : [])
          return cats.includes(ocasiao)
        })
      : temas
    if (buscaTema.trim()) {
      lista = lista.filter(t => t.nome.toLowerCase().includes(buscaTema.toLowerCase()))
    }
    return lista
  })()

  const temasTemFoto = temas.some(t => !!t.foto_url)

  const valorAdicionais = adicionaisSel.reduce((s, a) => s + a.preco, 0)
  const valorTotal = (kitSelecionado?.preco ?? 0) + valorAdicionais

  function toggleAdicional(a: Adicional) {
    setAdicionaisSel(p => p.find(x => x.id === a.id) ? p.filter(x => x.id !== a.id) : [...p, a])
  }

  async function verificarVagas(data: string) {
    if (!data) return
    setVerificandoVagas(true); setVagasInfo(null)
    const { data: vagasDia } = await supabase.from('vagas_dia').select('vagas_total').eq('usuario_id', usuarioId).eq('data', data).single()
    const total = vagasDia?.vagas_total ?? vagasPadrao
    const { count } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('usuario_id', usuarioId).eq('data_evento', data).not('status', 'eq', 'cancelado')
    setVagasInfo({ total, usadas: count ?? 0 })
    setVerificandoVagas(false)
  }

  const etapaIdx = STEPS.indexOf(etapa)
  const etapaDisplay = etapaIdx + 1

  function proximaEtapa() {
    const next = STEPS[etapaIdx + 1]
    if (next) setEtapa(next)
  }
  function etapaAnterior() {
    const prev = STEPS[etapaIdx - 1]
    if (prev) setEtapa(prev)
  }

  function montarMensagemWA(): string {
    const tema = mostrarTemaLivre ? temaLivre : (temaSelecionado?.nome ?? '')
    const data = form.data_evento ? new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR') : ''
    const linhas = [
      `*Novo pedido via ${nomeLoja ?? 'site'}*`, ``,
      `👤 *Cliente:* ${form.nome_cliente}`,
      form.telefone_cliente ? `📱 *WhatsApp:* ${form.telefone_cliente}` : null,
      tema ? `🎨 *Tema:* ${tema}` : null,
      ocasiao ? `🎉 *Ocasião:* ${ocasiao}` : null,
      kitSelecionado ? `📦 *Kit:* ${kitSelecionado.nome}` : null,
      adicionaisSel.length > 0 ? `✨ *Adicionais:* ${adicionaisSel.map(a => a.nome).join(', ')}` : null,
      `📅 *Data:* ${data}`,
      form.forma_pagamento ? `💳 *Pagamento:* ${form.forma_pagamento}` : null,
      valorTotal > 0 ? `💰 *Total:* R$ ${valorTotal.toFixed(2).replace('.', ',')}` : null,
      form.observacoes ? `\n📝 *Obs:* ${form.observacoes}` : null,
    ].filter(Boolean)
    return linhas.join('\n')
  }

  async function enviarPedido() {
    if (!form.nome_cliente || !form.data_evento) return
    setEnviando(true); setErroEnvio(null)
    const nomeTemaMostrar = mostrarTemaLivre && temaLivre ? temaLivre : (temaSelecionado?.nome ?? null)
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
        ocasiao ? `Ocasião: ${ocasiao}` : null,
        adicionaisSel.length > 0 ? `Adicionais: ${adicionaisSel.map(a => a.nome).join(', ')}` : null,
      ].filter(Boolean).join('\n') || null,
      valor_total: valorTotal,
      status: 'pendente',
    })
    if (error) { setErroEnvio(`Erro ao enviar: ${error.message}`); setEnviando(false); return }
    if (telefone) {
      const msg = encodeURIComponent(montarMensagemWA())
      const tel = telefone.replace(/\D/g, '')
      window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
    }
    setPedidoFeito(true); setEnviando(false)
  }

  const vagasDisponiveis = vagasInfo ? vagasInfo.total - vagasInfo.usadas : null
  const dataEsgotada = vagasDisponiveis !== null && vagasDisponiveis <= 0

  // Adicionais agrupados por categoria
  const categoriasAdicionais = [...new Set(adicionais.map(a => a.categoria).filter(Boolean))] as string[]
  const adicionaisSemCategoria = adicionais.filter(a => !a.categoria)

  // ── Sucesso ──────────────────────────────────────────────
  if (pedidoFeito) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 28px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid #e8e8ec' }}>
          <div style={{ width: 64, height: 64, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fff' }}><IconCheck /></div>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#111827', margin: '0 0 10px' }}>Pedido enviado!</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
            {nomeLoja ? `${nomeLoja} entrará` : 'Entraremos'} em contato para confirmar os detalhes.
          </p>
          <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 10px' }}>Resumo</p>
            {[
              { label: 'Tema', value: mostrarTemaLivre ? temaLivre : temaSelecionado?.nome },
              { label: 'Kit', value: kitSelecionado?.nome },
              { label: 'Data', value: form.data_evento ? new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR') : null },
            ].filter(i => i.value).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>{item.label}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#111827' }}>{item.value}</span>
              </div>
            ))}
            {valorTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e8e8ec', marginTop: '4px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#111827' }}>Total</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 900, color: '#ff33cc' }}>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
          </div>
          {telefone && (
            <a href={`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(montarMensagemWA())}`}
              target="_blank" rel="noopener noreferrer"
              style={{ ...btnPrimario(), background: '#25D366', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <IconWA /> Confirmar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f8', paddingBottom: valorTotal > 0 ? '90px' : '0' }}>
      {/* Header */}
      <div style={{ background: '#ff33cc', padding: '20px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '16px', color: '#fff', margin: '0 0 2px' }}>{nomeLoja ?? 'Fazer pedido'}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Passo {etapaDisplay} de {totalEtapas}</p>
        </div>
      </div>
      <div style={{ height: '3px', background: '#ffd6f5' }}>
        <div style={{ height: '100%', width: `${(etapaDisplay / totalEtapas) * 100}%`, background: '#ff33cc', transition: 'width .3s ease' }} />
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px 32px' }}>

        {/* ════ ETAPA 1 — OCASIÃO ════ */}
        {etapa === 1 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Qual é a ocasião?</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Isso vai filtrar os temas certos para você</p>
            {todasCategorias.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {todasCategorias.map(cat => (
                  <button key={cat} onClick={() => setOcasiao(cat === ocasiao ? '' : cat)}
                    style={{ padding: '16px 12px', background: ocasiao === cat ? '#fff0fb' : '#fff', border: `2px solid ${ocasiao === cat ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: ocasiao === cat ? '#ff33cc' : '#374151', textAlign: 'center', transition: 'all .12s', position: 'relative' }}>
                    {cat}
                    {ocasiao === cat && (
                      <span style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><IconCheckSm /></span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>Prossiga para escolher o tema</p>
              </div>
            )}
            <div style={{ position: 'sticky', bottom: 16, zIndex: 10 }}>
              <button onClick={proximaEtapa} style={btnPrimario()}>
                {ocasiao ? `${ocasiao} →` : 'Pular este passo'} <IconChevRight />
              </button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 2 — TEMA ════ */}
        {etapa === 2 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Escolha o tema</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 16px' }}>
              {ocasiao ? `Mostrando temas para: ${ocasiao}` : 'Todos os temas disponíveis'}
            </p>

            {temas.length > 0 && !mostrarTemaLivre && (
              <>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', pointerEvents: 'none' }}><IconSearch /></span>
                  <input
                    style={{ ...input, paddingLeft: '36px' }}
                    placeholder="Buscar tema..."
                    value={buscaTema}
                    onChange={e => setBuscaTema(e.target.value)}
                    onFocus={e => (e.target.style.borderColor = '#ff33cc')}
                    onBlur={e => (e.target.style.borderColor = '#e8e8ec')}
                  />
                </div>

                {temasTemFoto ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {temasFiltrados.map(tema => {
                      const sel = temaSelecionado?.id === tema.id
                      return (
                        <button key={tema.id} onClick={() => setTemaSelecionado(sel ? null : tema)}
                          style={{ background: sel ? '#fff0fb' : '#fff', border: `2px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '14px', cursor: 'pointer', overflow: 'hidden', padding: 0, textAlign: 'left', transition: 'border-color .12s' }}>
                          <div style={{ height: '80px', background: '#f5f0ff', position: 'relative', overflow: 'hidden' }}>
                            {tema.foto_url
                              ? <img src={tema.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} alt={tema.nome} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🎨</div>}
                            {sel && <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><IconCheckSm /></div>}
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: sel ? '#ff33cc' : '#111827', margin: 0, padding: '9px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.nome}</p>
                        </button>
                      )
                    })}
                    {temasFiltrados.length === 0 && (
                      <div style={{ gridColumn: '1/-1', background: '#fafafa', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>Nenhum tema encontrado</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                    {temasFiltrados.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>Nenhum tema encontrado</p>
                      </div>
                    ) : temasFiltrados.map((tema, idx) => {
                      const sel = temaSelecionado?.id === tema.id
                      return (
                        <button key={tema.id} onClick={() => setTemaSelecionado(sel ? null : tema)}
                          style={{ width: '100%', padding: '13px 16px', background: sel ? '#fff0fb' : 'transparent', border: 'none', borderBottom: idx < temasFiltrados.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', transition: 'background .1s' }}>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', color: sel ? '#ff33cc' : '#111827', margin: 0, textAlign: 'left' }}>{tema.nome}</p>
                          {sel && <div style={{ width: 20, height: 20, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><IconCheckSm /></div>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {(mostrarTemaLivre || temas.length === 0) && (
              <div style={{ marginBottom: '16px' }}>
                {mostrarTemaLivre && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={lbl}>Descreva o tema</span>
                    <button onClick={() => { setMostrarTemaLivre(false); setTemaLivre('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '11px', cursor: 'pointer' }}>← Ver temas</button>
                  </div>
                )}
                {temas.length === 0 && <span style={lbl}>Tema do evento (opcional)</span>}
                <input style={input} placeholder="Ex: Dinossauro verde, Jardim encantado..." value={temaLivre} onChange={e => setTemaLivre(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = '#e8e8ec')} />
              </div>
            )}

            <div style={{ position: 'sticky', bottom: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {temas.length > 0 && !mostrarTemaLivre && (
                <button onClick={() => { setMostrarTemaLivre(true); setTemaSelecionado(null) }}
                  style={{ width: '100%', background: '#fff', border: '1.5px dashed #ffd6f5', borderRadius: '12px', padding: '12px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                  Não encontrei meu tema
                </button>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /></button>
                <button onClick={proximaEtapa}
                  disabled={temas.length > 0 && !mostrarTemaLivre && !temaSelecionado}
                  style={{ ...btnPrimario(temas.length > 0 && !mostrarTemaLivre && !temaSelecionado), flex: 1 }}>
                  Próximo <IconChevRight />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ ETAPA 3 — KIT ════ */}
        {etapa === 3 && temKits && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Escolha o kit</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
              {temaSelecionado ? `Tema: ${temaSelecionado.nome}` : temaLivre ? `Tema: ${temaLivre}` : 'Selecione o pacote'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {kits.map(kit => {
                const sel = kitSelecionado?.id === kit.id
                return (
                  <button key={kit.id} onClick={() => setKitSelecionado(sel ? null : kit)}
                    style={{ background: sel ? '#fff0fb' : '#fff', border: `2px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '12px', transition: 'border-color .12s' }}>
                    {kit.foto_url && (
                      <div style={{ width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <img src={kit.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={kit.nome} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{kit.nome}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '15px', color: '#ff33cc', margin: 0, letterSpacing: '-0.3px', flexShrink: 0, marginLeft: '8px' }}>R$ {Number(kit.preco).toFixed(2).replace('.', ',')}</p>
                      </div>
                      {kit.descricao && kit.descricao !== 'Kit exportado da calculadora' && (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 6px' }}>{kit.descricao}</p>
                      )}
                      {Array.isArray(kit.itens) && kit.itens.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {kit.itens.map((item: string) => <span key={item} style={{ background: '#f5f0ff', color: '#7700ff', borderRadius: '999px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600 }}>{item}</span>)}
                        </div>
                      )}
                    </div>
                    {sel && <div style={{ width: 22, height: 22, borderRadius: '999px', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, alignSelf: 'center' }}><IconCheckSm /></div>}
                  </button>
                )
              })}
            </div>

            <div style={{ position: 'sticky', bottom: 16, zIndex: 10, display: 'flex', gap: '10px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /></button>
              <button onClick={proximaEtapa} disabled={!kitSelecionado} style={{ ...btnPrimario(!kitSelecionado), flex: 1 }}>Próximo <IconChevRight /></button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 4 — ADICIONAIS ════ */}
        {etapa === 4 && temAdicionais && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Adicionais</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Itens opcionais para complementar seu pedido</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
              {/* Categorias com adicionais */}
              {categoriasAdicionais.map(categoria => {
                const itensCategoria = adicionais.filter(a => a.categoria === categoria)
                return (
                  <div key={categoria}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>{categoria}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {itensCategoria.map(a => {
                        const sel = !!adicionaisSel.find(x => x.id === a.id)
                        return (
                          <button key={a.id} onClick={() => toggleAdicional(a)}
                            style={{ background: sel ? '#fff0fb' : '#fff', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color .12s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {a.foto_url && (
                                <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={a.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={a.nome} />
                                </div>
                              )}
                              <div style={{ width: 20, height: 20, borderRadius: '999px', background: sel ? '#ff33cc' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{sel && <IconCheckSm />}</div>
                              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{a.nome}</p>
                            </div>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: 0 }}>+ R$ {Number(a.preco).toFixed(2).replace('.', ',')}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Adicionais sem categoria */}
              {adicionaisSemCategoria.length > 0 && (
                <div>
                  {categoriasAdicionais.length > 0 && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>Outros</p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adicionaisSemCategoria.map(a => {
                      const sel = !!adicionaisSel.find(x => x.id === a.id)
                      return (
                        <button key={a.id} onClick={() => toggleAdicional(a)}
                          style={{ background: sel ? '#fff0fb' : '#fff', border: `1.5px solid ${sel ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color .12s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {a.foto_url && (
                              <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={a.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={a.nome} />
                              </div>
                            )}
                            <div style={{ width: 20, height: 20, borderRadius: '999px', background: sel ? '#ff33cc' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff' }}>{sel && <IconCheckSm />}</div>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{a.nome}</p>
                          </div>
                          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ff33cc', margin: 0 }}>+ R$ {Number(a.preco).toFixed(2).replace('.', ',')}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'sticky', bottom: 16, zIndex: 10, display: 'flex', gap: '10px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /></button>
              <button onClick={proximaEtapa} style={{ ...btnPrimario(), flex: 1 }}>
                {adicionaisSel.length > 0 ? `${adicionaisSel.length} adicional${adicionaisSel.length > 1 ? 'is' : ''} selecionado${adicionaisSel.length > 1 ? 's' : ''} →` : 'Pular'} <IconChevRight />
              </button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 5 — DADOS ════ */}
        {etapa === 5 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Seus dados</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Preencha para finalizar o pedido</p>
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
                <input type="date" style={{ ...input, borderColor: dataEsgotada ? '#ef4444' : '#e8e8ec' }} value={form.data_evento}
                  onChange={e => { setForm(p => ({ ...p, data_evento: e.target.value })); verificarVagas(e.target.value) }}
                  onFocus={e => (e.target.style.borderColor = '#ff33cc')} onBlur={e => (e.target.style.borderColor = dataEsgotada ? '#ef4444' : '#e8e8ec')} />
                {form.data_evento && (
                  <div style={{ marginTop: '6px' }}>
                    {verificandoVagas ? (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Verificando disponibilidade...</p>
                    ) : vagasInfo ? (
                      dataEsgotada
                        ? <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ef4444', fontWeight: 700, margin: 0 }}>❌ Data esgotada — não há vagas disponíveis</p>
                        : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: vagasDisponiveis! <= 1 ? '#f59e0b' : '#10b981', fontWeight: 600, margin: 0 }}>{vagasDisponiveis! <= 1 ? '⚠️' : '✅'} {vagasDisponiveis} vaga{vagasDisponiveis !== 1 ? 's' : ''} disponível{vagasDisponiveis !== 1 ? 'veis' : ''}</p>
                    ) : null}
                  </div>
                )}
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
            <div style={{ position: 'sticky', bottom: 16, zIndex: 10, display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /></button>
              <button onClick={proximaEtapa} disabled={!form.nome_cliente || !form.data_evento || dataEsgotada}
                style={{ ...btnPrimario(!form.nome_cliente || !form.data_evento || dataEsgotada), flex: 1 }}>
                Revisar pedido <IconChevRight />
              </button>
            </div>
          </div>
        )}

        {/* ════ ETAPA 6 — CONFIRMAÇÃO ════ */}
        {etapa === 6 && (
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>Confirmar pedido</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Verifique antes de enviar</p>
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Ocasião',    value: ocasiao,                                              show: !!ocasiao },
                  { label: 'Tema',       value: mostrarTemaLivre ? temaLivre : temaSelecionado?.nome, show: !!(mostrarTemaLivre ? temaLivre : temaSelecionado) },
                  { label: 'Kit',        value: kitSelecionado?.nome,                                 show: !!kitSelecionado },
                  { label: 'Adicionais', value: adicionaisSel.map(a => a.nome).join(', '),            show: adicionaisSel.length > 0 },
                  { label: 'Nome',       value: form.nome_cliente,                                    show: true },
                  { label: 'Data',       value: new Date(form.data_evento + 'T00:00:00').toLocaleDateString('pt-BR'), show: true },
                  { label: 'WhatsApp',   value: form.telefone_cliente,                                show: !!form.telefone_cliente },
                  { label: 'Pagamento',  value: form.forma_pagamento,                                 show: !!form.forma_pagamento },
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
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#ff33cc', letterSpacing: '-0.3px' }}>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
            </div>
            {erroEnvio && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', margin: 0 }}>{erroEnvio}</p>
              </div>
            )}
            <div style={{ position: 'sticky', bottom: 16, zIndex: 10, display: 'flex', gap: '10px' }}>
              <button onClick={etapaAnterior} style={btnGhost}><IconChevLeft /></button>
              <button onClick={enviarPedido} disabled={enviando}
                style={{ ...btnPrimario(enviando), flex: 1, background: enviando ? '#f3f4f6' : '#25D366' }}>
                {enviando ? 'Enviando...' : <><IconWA /> Enviar pedido</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Rodapé fixo com total ── */}
      <RodapeTotal
        valorTotal={valorTotal}
        kitSelecionado={kitSelecionado}
        adicionaisSel={adicionaisSel}
        etapaDisplay={etapaDisplay}
      />
    </div>
  )
}
