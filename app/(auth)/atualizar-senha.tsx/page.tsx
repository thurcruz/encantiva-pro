'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PaginaAtualizarSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem.')
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setCarregando(true)
    setErro(null)

    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro('Erro ao atualizar senha. Tente novamente.')
      setCarregando(false)
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/materiais'), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0018', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #9900ff22 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #ff33cc18 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

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
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(20px)' }}>

          {sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Senha atualizada!</h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66', margin: 0 }}>Redirecionando...</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                Nova senha
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: '0 0 32px 0' }}>
                Digite sua nova senha abaixo
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff55', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Nova senha</label>
                  <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required placeholder="Mínimo 6 caracteres" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ff33cc66'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff55', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Confirmar senha</label>
                  <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required placeholder="••••••••" style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = '#ff33cc66'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                {erro && (
                  <div style={{ background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.3)', borderRadius: '10px', padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc' }}>
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={carregando} style={{ width: '100%', background: carregando ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '16px', color: carregando ? '#ffffff44' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', cursor: carregando ? 'not-allowed' : 'pointer', boxShadow: carregando ? 'none' : '0 8px 32px rgba(255,51,204,0.3)' }}>
                  {carregando ? 'Atualizando...' : 'Atualizar senha'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff44', marginTop: '24px' }}>
          <Link href="/login" style={{ color: '#ff33cc', textDecoration: 'none', fontWeight: 600 }}>
            ← Voltar para o login
          </Link>
        </p>
      </div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.2); }`}</style>
    </div>
  )
}