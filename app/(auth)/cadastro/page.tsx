'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PaginaCadastro() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nomeLoja, setNomeLoja] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const supabase = createClient()


  async function handleCadastro(e: React.FormEvent) {
  e.preventDefault()
  if (senha !== confirmarSenha) return setErro('As senhas não coincidem.')
  if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
  setCarregando(true)
  setErro(null)

  const { data, error } = await supabase.auth.signUp({ email, password: senha })

  if (error) {
    setErro('Erro ao criar conta. Tente novamente.')
    setCarregando(false)
    return
  }

  if (data.user) {
    const trialExpira = new Date()
    trialExpira.setDate(trialExpira.getDate() + 7)

    const { error: erroAssinatura } = await supabase.from('assinaturas').insert({
      usuario_id: data.user.id,
      status: 'ativo',
      trial_expira_em: trialExpira.toISOString(),
      expira_em: trialExpira.toISOString(),
    })

    if (erroAssinatura) {
      setErro(`Erro ao criar trial: ${erroAssinatura.message}`)
      setCarregando(false)
      return
    }

    if (nomeLoja) {
      await supabase.from('perfis').upsert({
        id: data.user.id,
        nome_loja: nomeLoja,
      })
    }
  }

  setSucesso(true)
  setCarregando(false)
}
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#ffffff55',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  }

  if (sucesso) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0018',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255,51,204,0.15)',
            border: '1px solid rgba(255,51,204,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 24px',
          }}>
            🎉
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '28px', color: '#fff', margin: '0 0 12px 0' }}>
            Conta criada!
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#ffffff66', margin: '0 0 32px 0', lineHeight: 1.6 }}>
            Verifique seu e-mail para confirmar o cadastro e depois acesse o sistema.
          </p>
          <Link href="/login" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: '12px', padding: '14px 32px',
            color: '#fff', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, fontSize: '15px', textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(255,51,204,0.3)',
          }}>
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0018',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Blobs */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #9900ff22 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #ff33cc18 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <svg viewBox="0 0 144 108" width="44" height="33">
              <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
              <circle fill="#9900ff" cx="108" cy="36" r="36"/>
            </svg>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '26px', color: '#fff', letterSpacing: '-0.5px' }}>
              Encantiva
            </span>
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#ffffff44', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
            Área do Profissional
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(20px)' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
            Criar conta
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: '0 0 32px 0' }}>
            Comece a usar a plataforma hoje
          </p>

          <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nome da loja</label>
              <input
                type="text" value={nomeLoja}
                onChange={e => setNomeLoja(e.target.value)}
                placeholder="Ex: Encantiva Festas"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>E-mail *</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required placeholder="seu@email.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Senha *</label>
              <input
                type="password" value={senha}
                onChange={e => setSenha(e.target.value)}
                required placeholder="Mínimo 6 caracteres"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirmar senha *</label>
              <input
                type="password" value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {erro && (
              <div style={{ background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.3)', borderRadius: '10px', padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc' }}>
                {erro}
              </div>
            )}

            <button
              type="submit" disabled={carregando}
              style={{
                width: '100%',
                background: carregando ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none', borderRadius: '12px', padding: '16px',
                color: carregando ? '#ffffff44' : '#fff',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
                cursor: carregando ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: carregando ? 'none' : '0 8px 32px rgba(255,51,204,0.3)',
              }}
            >
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff44', marginTop: '24px' }}>
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: '#ff33cc', textDecoration: 'none', fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.2); }`}</style>
    </div>
  )
}