'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planoId: string
  destaque: boolean
  nomePlano: string
}

type Etapa = 'auth' | 'cpf' | 'aguardando'

// ── Formatação CPF/CNPJ ──────────────────────────────────
function formatarCpfCnpj(valor: string) {
  const n = valor.replace(/\D/g, '')
  if (n.length <= 11) {
    return n
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return n
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export default function BotaoAssinarPublico({ planoId, destaque, nomePlano }: Props) {
  const supabase = createClient()

  const [modalAberto, setModalAberto]     = useState(false)
  const [etapa, setEtapa]                 = useState<Etapa>('auth')
  const [modoAuth, setModoAuth]           = useState<'cadastro' | 'login'>('cadastro')

  // Auth fields
  const [nome, setNome]     = useState('')
  const [email, setEmail]   = useState('')
  const [senha, setSenha]   = useState('')

  // CPF field
  const [cpfCnpj, setCpfCnpj] = useState('')

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState<string | null>(null)

  // Ao abrir o modal, checa se já tem sessão → pula direto para CPF
  async function abrirModal() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setEtapa('cpf')
    } else {
      setEtapa('auth')
    }
    setErro(null)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setErro(null)
  }

  // ── Etapa 1: Autenticação ────────────────────────────────
  async function handleAuth() {
    setErro(null)
    if (!email.trim() || !senha.trim()) { setErro('Preencha e-mail e senha.'); return }
    if (modoAuth === 'cadastro' && !nome.trim()) { setErro('Digite seu nome.'); return }
    if (senha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    setCarregando(true)

    if (modoAuth === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro('E-mail ou senha incorretos.')
        setCarregando(false)
        return
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { full_name: nome } },
      })
      if (error) {
        setErro(
          error.message.includes('already registered')
            ? 'Este e-mail já tem conta. Faça login.'
            : 'Erro ao criar conta. Tente novamente.'
        )
        setCarregando(false)
        return
      }

      // Cria assinatura trial + perfil
      if (data.user) {
        const trialExpira = new Date()
        trialExpira.setDate(trialExpira.getDate() + 7)
        await supabase.from('assinaturas').insert({
          usuario_id: data.user.id,
          status: 'trial',
          trial_expira_em: trialExpira.toISOString(),
        })
        if (nome) {
          await supabase.from('perfis').upsert({ id: data.user.id, nome_loja: nome })
        }
      }
    }

    setCarregando(false)
    setEtapa('cpf')
  }

  // ── Etapa 2: CPF e checkout ──────────────────────────────
  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fmt = formatarCpfCnpj(e.target.value)
    if (fmt.replace(/\D/g, '').length <= 14) setCpfCnpj(fmt)
  }

  async function handleCheckout() {
    const numeros = cpfCnpj.replace(/\D/g, '')
    if (numeros.length !== 11 && numeros.length !== 14) {
      setErro('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const res = await fetch('/api/asaas/criar-assinatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoId, cpfCnpj: numeros }),
      })
      const json = await res.json()
      if (json.erro) throw new Error(json.erro)
      if (json.checkoutUrl) {
        setEtapa('aguardando')
        window.location.href = json.checkoutUrl
      }
    } catch (e) {
      setErro(String(e))
      setCarregando(false)
    }
  }

  // ── Estilos compartilhados ───────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${erro ? '#cc0000' : '#e5e5e5'}`,
    borderRadius: 10, padding: '12px 14px',
    fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#140033',
    outline: 'none', background: '#fafafa',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
    color: '#140033', display: 'block', marginBottom: 6, textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const btnPrimario: React.CSSProperties = {
    width: '100%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
    border: 'none', borderRadius: 12, padding: '14px',
    color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
    cursor: carregando ? 'not-allowed' : 'pointer',
    opacity: carregando ? 0.7 : 1, marginBottom: 10,
  }

  const btnSecundario: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none',
    fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055',
    cursor: 'pointer', padding: '8px',
  }

  return (
    <>
      {/* ── Botão do card ── */}
      <button
        onClick={abrirModal}
        style={{
          width: '100%',
          background: destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#140033',
          border: 'none', borderRadius: 12, padding: '14px',
          color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
          boxShadow: destaque ? '0 8px 24px rgba(255,51,204,0.3)' : 'none',
        }}
      >
        Assinar agora
      </button>

      {/* ── Modal ── */}
      {modalAberto && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(20,0,51,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 24, padding: 32,
            width: '100%', maxWidth: 420,
            boxShadow: '0 32px 80px rgba(153,0,255,0.2)',
          }}>

            {/* ─── ETAPA AUTH ─────────────────────────────── */}
            {etapa === 'auth' && (
              <>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, margin: '0 auto 14px',
                    boxShadow: '0 8px 24px rgba(255,51,204,0.3)',
                  }}>
                    🎀
                  </div>
                  <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 20, color: '#140033', margin: '0 0 6px 0' }}>
                    {modoAuth === 'cadastro' ? 'Crie sua conta' : 'Bem-vinda de volta!'}
                  </h2>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055', margin: 0 }}>
                    Plano <strong style={{ color: '#9900ff' }}>{nomePlano}</strong> selecionado
                  </p>
                </div>

                {/* Toggle cadastro / login */}
                <div style={{
                  display: 'flex', background: '#f5f5f5', borderRadius: 12,
                  padding: 4, marginBottom: 20, gap: 4,
                }}>
                  {(['cadastro', 'login'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setModoAuth(m); setErro(null) }}
                      style={{
                        flex: 1, padding: '9px 0',
                        background: modoAuth === m ? '#fff' : 'transparent',
                        border: 'none', borderRadius: 10,
                        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: modoAuth === m ? 700 : 500,
                        color: modoAuth === m ? '#140033' : '#00000055',
                        cursor: 'pointer',
                        boxShadow: modoAuth === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all .15s',
                      }}
                    >
                      {m === 'cadastro' ? 'Criar conta' : 'Já tenho conta'}
                    </button>
                  ))}
                </div>

                {/* Campos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
                  {modoAuth === 'cadastro' && (
                    <div>
                      <label style={labelStyle}>Nome</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Seu nome"
                        style={inputStyle}
                        autoFocus
                      />
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={inputStyle}
                      autoFocus={modoAuth === 'login'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Senha</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder={modoAuth === 'cadastro' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                      style={inputStyle}
                      onKeyDown={e => e.key === 'Enter' && handleAuth()}
                    />
                  </div>
                </div>

                {erro && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0000', margin: '0 0 12px 0' }}>
                    {erro}
                  </p>
                )}

                <button onClick={handleAuth} disabled={carregando} style={btnPrimario}>
                  {carregando
                    ? 'Aguarde...'
                    : modoAuth === 'cadastro'
                      ? 'Criar conta e continuar →'
                      : 'Entrar e continuar →'}
                </button>
                <button onClick={fecharModal} style={btnSecundario}>Cancelar</button>
              </>
            )}

            {/* ─── ETAPA CPF ──────────────────────────────── */}
            {etapa === 'cpf' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: '#f0fff8', border: '2px solid #00cc6622',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, margin: '0 auto 14px',
                  }}>
                    🎉
                  </div>
                  <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 20, color: '#140033', margin: '0 0 6px 0' }}>
                    Quase lá!
                  </h2>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055', margin: 0 }}>
                    Precisamos do seu CPF ou CNPJ para emitir a cobrança.
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    autoFocus
                    style={inputStyle}
                    onKeyDown={e => e.key === 'Enter' && handleCheckout()}
                  />
                  {erro && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0000', margin: '6px 0 0 0' }}>
                      {erro}
                    </p>
                  )}
                </div>

                <button onClick={handleCheckout} disabled={carregando} style={btnPrimario}>
                  {carregando ? 'Aguarde...' : 'Continuar para pagamento →'}
                </button>
                <button onClick={fecharModal} style={btnSecundario}>Cancelar</button>
              </>
            )}

            {/* ─── ETAPA AGUARDANDO ───────────────────────── */}
            {etapa === 'aguardando' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 18, color: '#140033', margin: '0 0 8px 0' }}>
                  Redirecionando para o pagamento...
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055', margin: 0 }}>
                  Você será redirecionada em instantes.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}