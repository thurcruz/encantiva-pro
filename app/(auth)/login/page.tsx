'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [verSenha, setVerSenha] = useState(false)

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setCarregando(false)
    } else {
      window.location.href = '/inicio'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f6f8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image src="/enc_logo_mono.png" width={180} height={30} alt="Encantiva Pro" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Plataforma para decoradoras</p>
        </div>

        {/* Form card */}
        <div style={{
          background: '#fff',
          border: '1px solid #e8e8ec',
          borderRadius: '20px',
          padding: '32px 28px',
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
            Entrar na conta
          </h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 28px' }}>
            Bem-vinda de volta ✨
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#fafafa', border: '1px solid #e8e8ec',
                  borderRadius: '10px', padding: '12px 14px',
                  fontSize: '14px', color: '#111827', outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Senha
                </label>
                <Link href="/recuperar-senha" style={{ fontSize: '12px', color: '#ff33cc', fontWeight: 600, textDecoration: 'none' }}>
                  Esqueci a senha
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#fafafa', border: '1px solid #e8e8ec',
                    borderRadius: '10px', padding: '12px 44px 12px 14px',
                    fontSize: '14px', color: '#111827', outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: '4px', display: 'flex', alignItems: 'center',
                  }}
                >
                  {verSenha ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/></svg>
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '10px 14px',
                fontSize: '13px', color: '#dc2626',
              }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || !email || !senha}
              style={{
                width: '100%', padding: '14px',
                background: carregando || !email || !senha ? '#e5e7eb' : '#ff33cc',
                color: carregando || !email || !senha ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: '999px',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                cursor: carregando || !email || !senha ? 'not-allowed' : 'pointer',
                transition: 'all .15s',
                marginTop: '4px',
              }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Cadastro */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', margin: '20px 0 0' }}>
          Não tem conta?{' '}
          <Link href="/cadastro" style={{ color: '#ff33cc', fontWeight: 700, textDecoration: 'none' }}>
            Criar conta grátis
          </Link>
        </p>

      </div>
    </div>
  )
}