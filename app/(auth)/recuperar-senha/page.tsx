'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PaginaRecuperarSenha() {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (error) {
      setErro('Erro ao enviar o e-mail. Tente novamente.')
      setCarregando(false)
      return
    }

    setEnviado(true)
    setCarregando(false)
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

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

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

          {enviado ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>
                E-mail enviado!
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66', margin: '0 0 24px 0', lineHeight: 1.6 }}>
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <Link href="/login" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ff33cc', textDecoration: 'none', fontWeight: 600 }}>
                ← Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                Recuperar senha
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: '0 0 32px 0' }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff55', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    E-mail
                  </label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required placeholder="seu@email.com"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', background: carregando ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '16px', color: carregando ? '#ffffff44' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: carregando ? 'not-allowed' : 'pointer', boxShadow: carregando ? 'none' : '0 8px 32px rgba(255,51,204,0.3)' }}
                >
                  {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff44', marginTop: '24px', marginBottom: 0 }}>
                <Link href="/login" style={{ color: '#ff33cc', textDecoration: 'none', fontWeight: 600 }}>
                  ← Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.2); }`}</style>
    </div>
  )
}