'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }

    router.push('/materiais')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#140033',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Fundo decorativo */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, #9900ff33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #ff33cc22 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Círculo decorativo topo direito */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #9900ff44, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Círculo decorativo baixo esquerdo */}
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, #ff33cc33, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card central */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff08',
        border: '1px solid #ffffff18',
        borderRadius: '24px',
        padding: '48px 40px',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Logo centralizada */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <svg viewBox="0 0 144 108" width="56" height="42" style={{ marginBottom: '16px' }}>
            <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
            <circle fill="#9900ff" cx="108" cy="36" r="36"/>
          </svg>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '24px',
            color: '#fff',
            letterSpacing: '-0.5px',
          }}>
            Encantiva Pro
          </span>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '28px',
            color: '#fff',
            letterSpacing: '-1px',
            marginBottom: '8px',
          }}>
            Bem-vinda de volta ✨
          </h1>
          <p style={{
            color: '#ffffff66',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
          }}>
            Entre na sua conta para acessar os materiais
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* E-mail */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff88',
              marginBottom: '8px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%',
                background: '#ffffff0d',
                border: '1px solid #ffffff22',
                borderRadius: '12px',
                padding: '14px 18px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#ff33cc88'}
              onBlur={e => e.target.style.borderColor = '#ffffff22'}
            />
          </div>

          {/* Senha */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff88',
              marginBottom: '8px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#ffffff0d',
                border: '1px solid #ffffff22',
                borderRadius: '12px',
                padding: '14px 18px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#ff33cc88'}
              onBlur={e => e.target.style.borderColor = '#ffffff22'}
            />
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: '#ff33cc11',
              border: '1px solid #ff33cc44',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#ff33cc',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={carregando}
            style={{
              width: '100%',
              background: carregando
                ? '#ffffff22'
                : 'linear-gradient(135deg, #ff33cc, #9900ff)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.3px',
              marginTop: '4px',
            }}
          >
            {carregando ? 'Entrando...' : 'Entrar na plataforma'}
          </button>
        </form>

        {/* Rodapé */}
        <p style={{
          textAlign: 'center',
          color: '#ffffff33',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          marginTop: '32px',
        }}>
          © 2025 Encantiva Pro. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}