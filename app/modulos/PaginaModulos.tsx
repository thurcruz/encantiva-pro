'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const LS_KEY = 'modulos_oferta_expira'
const SS_KEY = 'modulos_barra_fechada'

function getOrCreateExpiry(): number {
  if (typeof window === 'undefined') return Date.now() + 48 * 3600 * 1000
  const stored = localStorage.getItem(LS_KEY)
  if (stored) {
    const ts = Number(stored)
    if (!isNaN(ts) && ts > Date.now()) return ts
  }
  const ts = Date.now() + 48 * 3600 * 1000
  localStorage.setItem(LS_KEY, String(ts))
  return ts
}

function calcRestante(expiry: number): { h: number; m: number; s: number } | null {
  const diff = expiry - Date.now()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { h, m, s }
}

function pad(n: number) { return String(n).padStart(2, '0') }

type Modulo = 'biblioteca' | 'contratos' | null

const MODULOS = {
  biblioteca: {
    nome: 'Biblioteca de Materiais',
    preco: 'R$ 19,90',
    cor: '#ff33cc',
    corBg: '#fff0fb',
    descricao: 'Acesso vitalicio a todos os materiais gratuitos e exclusivos para festas na mesa, incluindo comunidade.',
    itens: [
      'Materiais gratuitos ilimitados',
      'Materiais exclusivos premium',
      'Cortador de paineis A4',
      'Comunidade Encantiva',
      'Novos materiais toda semana',
      'Acesso vitalicio — pague uma vez',
    ],
    icone: '🎨',
  },
  contratos: {
    nome: 'Contratos Ilimitados',
    preco: 'R$ 19,90',
    cor: '#9900ff',
    corBg: '#f5f0ff',
    descricao: 'Crie e envie contratos digitais ilimitados para suas clientes, com assinatura eletronica.',
    itens: [
      'Contratos ilimitados',
      'Assinatura eletronica',
      'Termo de responsabilidade',
      'Dados da loja no contrato',
      'Link de assinatura para cliente',
      'Acesso vitalicio — pague uma vez',
    ],
    icone: '📝',
  },
}

interface FormData {
  nome: string
  email: string
  senha: string
  cpf: string
}

export default function PaginaModulos() {
  const supabase = createClient()
  const [moduloSelecionado, setModuloSelecionado] = useState<Modulo>(null)
  const [etapa, setEtapa] = useState<'escolha' | 'cadastro' | 'pagamento' | 'sucesso'>('escolha')
  const [form, setForm] = useState<FormData>({ nome: '', email: '', senha: '', cpf: '' })
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [dadosPix, setDadosPix] = useState<{ qrCode: string; chave: string } | null>(null)
  const [aguardandoPix, setAguardandoPix] = useState(false)
  const [ehAssinante, setEhAssinante] = useState(false)
  const [verificandoPlano, setVerificandoPlano] = useState(true)
  const [usuarioLogado, setUsuarioLogado] = useState(false)

  const [precisaCpf, setPrecisaCpf] = useState(false)

  // ── Barra de contagem regressiva ─────────────────────────
  const [restante, setRestante] = useState<{ h: number; m: number; s: number } | null>(null)
  const [barraFechada, setBarraFechada] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SS_KEY) === '1') { setBarraFechada(true); return }

    const expiry = getOrCreateExpiry()
    setRestante(calcRestante(expiry))

    const id = setInterval(() => {
      const r = calcRestante(expiry)
      setRestante(r)
      if (!r) clearInterval(id)
    }, 1000)

    return () => clearInterval(id)
  }, [])

  function fecharBarra() {
    if (typeof window !== 'undefined') sessionStorage.setItem(SS_KEY, '1')
    setBarraFechada(true)
  }

  function scrollParaCards() {
    document.getElementById('modulos-cards')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const mostrarBarra = !barraFechada && !!restante && etapa !== 'sucesso'

  // Verificar se usuario logado e qual e o plano
  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setVerificandoPlano(false); return }

      setUsuarioLogado(true)
      setForm(p => ({ ...p, email: user.email ?? '', senha: '________' }))

      const { data: ass } = await supabase
        .from('assinaturas')
        .select('status, plano')
        .eq('usuario_id', user.id)
        .single()

      const ativo = ass?.status === 'active' || ass?.status === 'ativo'
      const planosPagos = ['iniciante', 'avancado', 'elite']
      setEhAssinante(ativo && planosPagos.includes(ass?.plano ?? ''))

      const { data: perfil } = await supabase
        .from('perfis')
        .select('nome_loja, cpf_cnpj')
        .eq('id', user.id)
        .single()

      if (perfil) {
        setForm(p => ({
          ...p,
          nome: perfil.nome_loja ?? p.nome,
          cpf: perfil.cpf_cnpj ?? p.cpf,
        }))
        // So mostra campo CPF se nao tiver no perfil
        setPrecisaCpf(!perfil.cpf_cnpj)
      } else {
        setPrecisaCpf(true)
      }

      setVerificandoPlano(false)
    }
    verificar()
  }, [supabase])

  const info = moduloSelecionado ? MODULOS[moduloSelecionado] : null

  function selecionarModulo(m: Modulo) {
    if (ehAssinante) return
    setModuloSelecionado(m)
    setErro('')
    // Se ja esta logado, pula o cadastro e vai direto para pagamento
    if (usuarioLogado) {
      setEtapa('pagamento')
    } else {
      setEtapa('cadastro')
    }
  }

  function validarCadastro() {
    if (!form.nome.trim()) return 'Informe seu nome'
    if (!form.email.trim() || !form.email.includes('@')) return 'Email invalido'
    if (!usuarioLogado && form.senha.length < 6) return 'Senha deve ter pelo menos 6 caracteres'
    if (!form.cpf.replace(/\D/g, '')) return 'Informe seu CPF'
    return null
  }

  async function irParaPagamento() {
    const errValidacao = validarCadastro()
    if (errValidacao) { setErro(errValidacao); return }
    setErro('')
    setEtapa('pagamento')
  }

  async function processarPagamento() {
    if (!moduloSelecionado) return
    setCarregando(true); setErro('')

    try {
      const res = await fetch('/api/modulos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: moduloSelecionado,
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          cpf: form.cpf.replace(/\D/g, ''),
          metodoPagamento,
          cartao: metodoPagamento === 'CREDIT_CARD' ? cartao : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.erro ?? 'Erro ao processar pagamento')

      if (metodoPagamento === 'PIX') {
        setDadosPix({ qrCode: data.qrCode, chave: data.pixKey })
        setAguardandoPix(true)
        const interval = setInterval(async () => {
          const check = await fetch(`/api/modulos/verificar?paymentId=${data.paymentId}`)
          const checkData = await check.json()
          if (checkData.pago) {
            clearInterval(interval)
            setAguardandoPix(false)
            setEtapa('sucesso')
          }
        }, 4000)
        setTimeout(() => clearInterval(interval), 600000)
      } else {
        // Cartao — verificar status retornado pelo Asaas
        if (data.pago) {
          setEtapa('sucesso')
        } else {
          throw new Error(data.erro ?? 'Pagamento nao aprovado. Verifique os dados do cartao.')
        }
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  function formatarCPF(v: string) {
    const n = v.replace(/\D/g, '').slice(0, 11)
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
      .replace(/(\d{3})(\d{3})/, '$1.$2')
  }

  function formatarCartaoNum(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim()
  }

  function formatarValidade(v: string) {
    return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#f9f9f9', border: '1px solid #e5e5e5',
    borderRadius: '12px', padding: '12px 16px',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033',
    outline: 'none',
  }

  const lbl: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif',
    fontSize: '11px', fontWeight: 600, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>

      {/* ── Barra de oferta ── */}
      {mostrarBarra && restante && (
        <div style={{ background: 'linear-gradient(90deg, #ff33cc, #9900ff)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            Oferta por tempo limitado — termina em{' '}
            <strong style={{ fontFamily: 'monospace', fontSize: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '2px 8px', letterSpacing: '1px' }}>
              {pad(restante.h)}:{pad(restante.m)}:{pad(restante.s)}
            </strong>
          </span>
          <button
            onClick={scrollParaCards}
            style={{ background: '#fff', border: 'none', borderRadius: '999px', padding: '6px 16px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#9900ff', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Aproveitar agora →
          </button>
          <button
            onClick={fecharBarra}
            aria-label="Fechar"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1 }}
          >
            x
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#140033', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src="/enc_logotipo.svg" width={140} height={24} alt="Encantiva Pro" />
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ETAPA ESCOLHA */}
        {etapa === 'escolha' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{ background: '#fff0fb', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', padding: '5px 14px', borderRadius: '999px', border: '1px solid #ffd6f5', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Pagamento unico vitalicio
              </span>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#140033', letterSpacing: '-1px', margin: '16px 0 12px' }}>
                Escolha seu modulo
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#6b7280', margin: 0 }}>
                Pague uma vez e tenha acesso para sempre. Sem mensalidade, sem surpresas.
              </p>
            </div>

            {/* Banner para assinantes */}
            {ehAssinante && (
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#059669', margin: 0 }}>Voce ja e assinante!</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0 }}>Seu plano ja inclui acesso completo a esses modulos. Os botoes abaixo estao disponiveis apenas para nao assinantes.</p>
                </div>
              </div>
            )}

            {/* Grid de cards */}
            <div id="modulos-cards" className="modulos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
              {(Object.entries(MODULOS) as [Modulo, typeof MODULOS['biblioteca']][]).map(([key, mod]) => {
                const bloqueado = ehAssinante || verificandoPlano
                return (
                  <div key={key}
                    style={{ background: '#fff', border: `1.5px solid ${bloqueado ? '#e8e8ec' : '#e8e8ec'}`, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform .2s, box-shadow .2s', cursor: bloqueado ? 'default' : 'pointer', opacity: verificandoPlano ? 0.7 : 1 }}
                    onClick={() => !bloqueado && selecionarModulo(key)}
                    onMouseEnter={e => { if (!bloqueado) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${mod.cor}20` } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)' }}
                  >
                    {/* Header do card */}
                    <div style={{ background: `linear-gradient(135deg, ${mod.cor}15, ${mod.cor}05)`, padding: '28px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{mod.icone}</div>
                      <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{mod.nome}</h2>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>{mod.descricao}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '32px', color: mod.cor, letterSpacing: '-1px' }}>{mod.preco}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af' }}>vitalicio</span>
                      </div>
                    </div>

                    {/* Itens */}
                    <div style={{ padding: '20px 28px' }}>
                      {mod.itens.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < mod.itens.length - 1 ? '10px' : '20px' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${mod.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={mod.cor} strokeWidth="2" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2.5"/></svg>
                          </div>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151', fontWeight: i === mod.itens.length - 1 ? 700 : 400 }}>{item}</span>
                        </div>
                      ))}

                      {bloqueado ? (
                        <button disabled style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: '14px', padding: '14px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'not-allowed' }}>
                          {verificandoPlano ? 'Verificando...' : 'Disponivel para nao assinantes'}
                        </button>
                      ) : (
                        <button style={{ width: '100%', background: mod.cor, border: 'none', borderRadius: '14px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                          Comprar agora →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Secao "Ou assine e tenha tudo" ── */}
            <div style={{ background: 'linear-gradient(135deg, #140033, #2d0060)', border: '1px solid rgba(255,51,204,0.2)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff55', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Plano completo
              </p>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#fff', letterSpacing: '-0.5px', margin: '0 0 8px' }}>
                Ou assine e tenha tudo
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff88', margin: '0 0 24px', lineHeight: 1.6 }}>
                Com um plano completo voce tem acesso a TUDO da plataforma
              </p>

              <div className="beneficios-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {[
                  'Agenda ilimitada de eventos',
                  'Catalogo de kits e pedidos',
                  'Calculadora de precificacao',
                  'Financeiro e fluxo de caixa',
                  'Acervo de materiais proprios',
                  'Clientes ilimitados',
                  'Contratos ilimitados',
                  'Biblioteca de materiais exclusivos',
                  'Cortador de paineis ilimitado',
                  'Suporte prioritario',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 2.5"/></svg>
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Comparativo */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff55', minWidth: '130px' }}>Modulo avulso:</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc' }}>R$19,90 — acesso a 1 recurso para sempre</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#ff33cc', minWidth: '130px' }}>Plano Avancado:</span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff' }}>R$34,90/mes — acesso COMPLETO a tudo</span>
                </div>
              </div>

              <a href="/planos" style={{ display: 'inline-block', background: '#ff33cc', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', padding: '12px 28px', borderRadius: '999px', textDecoration: 'none', marginBottom: '10px' }}>
                Ver todos os planos →
              </a>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: 0 }}>
                Cancele quando quiser · Sem fidelidade
              </p>
            </div>

            {/* FAQ */}
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '20px', padding: '32px' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: '#140033', margin: '0 0 20px' }}>Perguntas frequentes</h3>
              {[
                { p: 'Posso comprar os dois modulos?', r: 'Sim! Voce pode comprar a Biblioteca e os Contratos separadamente.' },
                { p: 'O acesso e realmente vitalicio?', r: 'Sim. Voce paga uma unica vez e tem acesso para sempre, sem mensalidade.' },
                { p: 'Posso fazer upgrade para um plano completo depois?', r: 'Sim. Voce pode assinar qualquer plano a qualquer momento.' },
                { p: 'Como acesso apos a compra?', r: 'Voce cria sua conta durante a compra e ja acessa imediatamente apos o pagamento.' },
              ].map((faq, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? '16px' : 0, paddingBottom: i < 3 ? '16px' : 0, borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 4px' }}>{faq.p}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', margin: 0 }}>{faq.r}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ETAPA CADASTRO */}
        {etapa === 'cadastro' && info && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button onClick={() => setEtapa('escolha')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Voltar
            </button>

            <div style={{ background: `linear-gradient(135deg, ${info.cor}15, ${info.cor}05)`, border: `1.5px solid ${info.cor}30`, borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{info.icone}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{info.nome}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>Acesso vitalicio</p>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: info.cor }}>{info.preco}</span>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 6px' }}>Crie sua conta</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 24px' }}>Voce vai usar essas informacoes para acessar a plataforma.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={lbl}>Nome completo</label>
                  <input style={inputStyle} placeholder="Seu nome completo" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input style={inputStyle} type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Senha (minimo 6 caracteres)</label>
                  <input style={inputStyle} type="password" placeholder="Crie uma senha" value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>CPF</label>
                  <input style={inputStyle} placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))} />
                </div>

                {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{erro}</p>}

                <button onClick={irParaPagamento} style={{ background: info.cor, border: 'none', borderRadius: '14px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>
                  Continuar para pagamento →
                </button>

                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '4px 0 0' }}>
                  Ja tem conta?{' '}
                  <a href="/login" style={{ color: info.cor, fontWeight: 700, textDecoration: 'none' }}>
                    Entrar
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA PAGAMENTO */}
        {etapa === 'pagamento' && info && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <button onClick={() => usuarioLogado ? setEtapa('escolha') : setEtapa('cadastro')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ← Voltar
            </button>

            <div style={{ background: `linear-gradient(135deg, ${info.cor}15, ${info.cor}05)`, border: `1.5px solid ${info.cor}30`, borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{info.icone}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>{info.nome}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>{form.email}</p>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: info.cor }}>{info.preco}</span>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '20px', padding: '28px' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 20px' }}>Pagamento</h2>

              {/* Campo CPF para usuario logado sem CPF cadastrado */}
              {usuarioLogado && precisaCpf && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={lbl}>CPF (necessario para o pagamento)</label>
                  <input style={inputStyle} placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: formatarCPF(e.target.value) }))} />
                </div>
              )}

              {/* Tabs metodo */}
              <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '12px', padding: '3px', marginBottom: '20px' }}>
                {(['PIX', 'CREDIT_CARD'] as const).map(m => (
                  <button key={m} onClick={() => setMetodoPagamento(m)}
                    style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', background: metodoPagamento === m ? '#fff' : 'transparent', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: metodoPagamento === m ? '#111827' : '#9ca3af', cursor: 'pointer', boxShadow: metodoPagamento === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s' }}>
                    {m === 'PIX' ? 'PIX' : 'Cartao de credito'}
                  </button>
                ))}
              </div>

              {/* PIX info */}
              {metodoPagamento === 'PIX' && !aguardandoPix && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#059669', margin: 0 }}>PIX — aprovacao instantanea</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', margin: 0 }}>Gere o QR Code e pague pelo seu banco</p>
                  </div>
                </div>
              )}

              {/* QR Code PIX */}
              {aguardandoPix && dadosPix && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: '0 0 16px' }}>Escaneie o QR Code para pagar</p>
                  {dadosPix.qrCode && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/png;base64,${dadosPix.qrCode}`} alt="QR Code PIX" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '8px' }} />
                  )}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 8px' }}>Ou copie a chave PIX:</p>
                  <div style={{ background: '#f9f9f9', border: '1px solid #e8e8ec', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#374151', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dadosPix.chave}</p>
                    <button onClick={() => navigator.clipboard.writeText(dadosPix.chave)}
                      style={{ background: '#ff33cc', border: 'none', borderRadius: '6px', padding: '4px 10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                      Copiar
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', animation: 'pulse 1.5s infinite' }} />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: 0 }}>Aguardando confirmacao do pagamento...</p>
                  </div>
                </div>
              )}

              {/* Cartao */}
              {metodoPagamento === 'CREDIT_CARD' && !aguardandoPix && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={lbl}>Numero do cartao</label>
                    <input style={inputStyle} placeholder="0000 0000 0000 0000" value={cartao.numero} onChange={e => setCartao(p => ({ ...p, numero: formatarCartaoNum(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={lbl}>Nome no cartao</label>
                    <input style={inputStyle} placeholder="Nome como no cartao" value={cartao.nome} onChange={e => setCartao(p => ({ ...p, nome: e.target.value.toUpperCase() }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lbl}>Validade</label>
                      <input style={inputStyle} placeholder="MM/AA" value={cartao.validade} onChange={e => setCartao(p => ({ ...p, validade: formatarValidade(e.target.value) }))} />
                    </div>
                    <div>
                      <label style={lbl}>CVV</label>
                      <input style={inputStyle} placeholder="123" maxLength={4} value={cartao.cvv} onChange={e => setCartao(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                    </div>
                  </div>
                </div>
              )}

              {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: '0 0 16px' }}>{erro}</p>}

              {!aguardandoPix && (
                <button onClick={processarPagamento} disabled={carregando}
                  style={{ width: '100%', background: carregando ? '#e5e5e5' : info.cor, border: 'none', borderRadius: '14px', padding: '14px', color: carregando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: carregando ? 'not-allowed' : 'pointer' }}>
                  {carregando ? 'Processando...' : `Pagar ${info.preco}`}
                </button>
              )}

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '12px 0 0' }}>
                Pagamento seguro via Asaas
              </p>
            </div>
          </div>
        )}

        {/* ETAPA SUCESSO */}
        {etapa === 'sucesso' && info && (
          <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '24px', padding: '48px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '26px', color: '#140033', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                Pagamento confirmado!
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#6b7280', margin: '0 0 8px' }}>
                Voce tem acesso vitalicio ao modulo
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '18px', color: info.cor, margin: '0 0 32px' }}>
                {info.nome}
              </p>
              <a href="/login" style={{ display: 'block', background: info.cor, borderRadius: '14px', padding: '16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', marginBottom: '12px' }}>
                Acessar a plataforma →
              </a>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                Use o email <strong>{form.email}</strong> e a senha que voce criou
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @media (max-width: 640px) {
          .modulos-grid { grid-template-columns: 1fr !important; }
          .beneficios-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}