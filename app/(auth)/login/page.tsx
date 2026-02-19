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
    <div className="min-h-screen flex" style={{ backgroundColor: '#140033' }}>

      {/* Lado esquerdo — visual */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">

        {/* Fundo decorativo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 50%, #9900ff33 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #ff33cc22 0%, transparent 50%)',
        }} />

        {/* Círculos decorativos */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, #9900ff44, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, #ff33cc33, transparent 70%)',
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <svg viewBox="0 0 144 108" width="48" height="36">
            <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
            <circle fill="#9900ff" cx="108" cy="36" r="36"/>
          </svg>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#fff', letterSpacing: '-0.5px' }}>
            Encantiva Pro
          </span>
        </div>

        {/* Texto central */}
        <div className="relative z-10">
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '52px',
            lineHeight: '1.05',
            color: '#fff',
            letterSpacing: '-2px',
            marginBottom: '24px',
          }}>
            Materiais incríveis para festas{' '}
            <span style={{ color: '#ff33cc' }}>inesquecíveis</span>
          </h1>
          <p style={{ color: '#ffffff88', fontSize: '18px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif' }}>
            Baixe painéis, totens e muito mais prontos para imprimir. Só apertar o botão.
          </p>
        </div>

        {/* Badges decorativos */}
        <div className="relative z-10 flex gap-3 flex-wrap">
          {['🎪 Painéis', '🎈 Totens', '🏷️ Tags', '🎀 Bandeirolas'].map(item => (
            <span key={item} style={{
              background: '#ffffff11',
              border: '1px solid #ffffff22',
              color: '#ffffffcc',
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 relative">

        {/* Linha divisória */}
        <div className="hidden lg:block absolute left-0 top-16 bottom-16" style={{
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, #ffffff22 30%, #ffffff22 70%, transparent)',
        }} />

        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <svg viewBox="0 0 144 108" width="40" height="30">
              <path fill="#ff33cc" d="M72,108H0V36C0,16.12,16.12,0,36,0h0c19.88,0,36,16.12,36,36v72Z"/>
              <circle fill="#9900ff" cx="108" cy="36" r="36"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#fff' }}>
              Encantiva Pro
            </span>
          </div>

          <h2 style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '32px',
            color: '#fff',
            letterSpacing: '-1px',
            marginBottom: '8px',
          }}>
            Bem-vinda de volta ✨
          </h2>
          <p style={{ color: '#ffffff66', fontFamily: 'Inter, sans-serif', marginBottom: '40px' }}>
            Entre na sua conta para acessar os materiais
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* E-mail */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#ffffff88',
                marginBottom: '8px',
                letterSpacing: '0.5px',
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
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
                onBlur={e => e.target.style.borderColor = '#ffffff22'}
              />
            </div>

            {/* Senha */}
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#ffffff88',
                marginBottom: '8px',
                letterSpacing: '0.5px',
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
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#ff33cc66'}
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
                transition: 'opacity 0.2s, transform 0.1s',
                letterSpacing: '-0.3px',
                marginTop: '4px',
              }}
              onMouseEnter={e => !carregando && ((e.target as HTMLButtonElement).style.opacity = '0.9')}
              onMouseLeave={e => !carregando && ((e.target as HTMLButtonElement).style.opacity = '1')}
            >
              {carregando ? 'Entrando...' : 'Entrar na plataforma'}
            </button>
          </form>

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
    </div>
  )
}