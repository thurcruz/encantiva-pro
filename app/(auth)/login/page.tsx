'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

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
      background: '#0a0018',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Blobs de fundo */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, #9900ff22 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #ff33cc18 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '30%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, #ff33cc08 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
           <img src="/enc_logotipo.svg" width="240" height="33" alt="Encantiva" />
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
        }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}>
            Bem-vindo de volta
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#ffffff55',
            margin: '0 0 32px 0',
          }}>
            Entre na sua conta para continuar
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: '#ffffff55',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
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
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff55',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}>
                  Senha
                </label>
                <Link href="/recuperar-senha" style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#ff33cc',
                  textDecoration: 'none',
                  opacity: 0.8,
                }}>
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {erro && (
              <div style={{
                background: 'rgba(255,51,204,0.1)',
                border: '1px solid rgba(255,51,204,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#ff33cc',
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                background: carregando ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: carregando ? '#ffffff44' : '#fff',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '15px',
                cursor: carregando ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                transition: 'opacity 0.2s',
                boxShadow: carregando ? 'none' : '0 8px 32px rgba(255,51,204,0.3)',
              }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Link cadastro */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#ffffff44',
          marginTop: '24px',
        }}>
          Não tem uma conta?{' '}
          <Link href="/cadastro" style={{
            color: '#ff33cc',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Criar conta
          </Link>
        </p>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}