'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

export default function PaginaCadastro() {
  const [nomeLoja, setNomeLoja] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const supabase = createClient()

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setErro('')
    setCarregando(true)

    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) { setErro(error.message); setCarregando(false); return }

    if (data.user) {
      const trialExpira = new Date()
      trialExpira.setDate(trialExpira.getDate() + 7)
      await supabase.from('assinaturas').insert({
        usuario_id: data.user.id,
        status: 'trial',
        trial_expira_em: trialExpira.toISOString(),
      })
      if (nomeLoja) {
        await supabase.from('perfis').upsert({ id: data.user.id, nome_loja: nomeLoja })
      }
    }

    setSucesso(true)
    setCarregando(false)
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: '100vh', background: '#f6f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '999px', background: '#fff0fb', border: '2px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
            🎉
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: '0 0 8px' }}>Conta criada!</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px', lineHeight: 1.6 }}>
            Verifique seu e-mail para confirmar o cadastro e depois acesse a plataforma.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', background: '#ff33cc', color: '#fff', borderRadius: '999px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
            Ir para o login →
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: '#fafafa', border: '1px solid #e8e8ec',
    borderRadius: '10px', padding: '12px 14px',
    fontSize: '14px', color: '#111827', outline: 'none',
    fontFamily: 'Inter, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: '#9ca3af', letterSpacing: '0.5px',
    textTransform: 'uppercase', marginBottom: '6px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Image src="/enc_logo_mono.png" width={180} height={30} alt="Encantiva Pro" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Plataforma para decoradoras</p>
        </div>

        {/* Badge trial */}
        <div style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '12px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🧪</span>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#ff33cc', margin: '0 0 1px' }}>7 dias grátis</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Acesso completo ao plano Elite. Sem cartão.</p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '20px', padding: '32px 28px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Criar conta</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 28px' }}>Comece a organizar seu negócio hoje</p>

          <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <div>
              <label style={labelStyle}>Nome da sua loja <span style={{ color: '#d1d5db', fontWeight: 400, textTransform: 'none' }}>— opcional</span></label>
              <input type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} placeholder="Ex: Encantiva Festas" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>E-mail *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Senha *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={verSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  style={{ ...inputStyle, paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setVerSenha(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', display: 'flex', alignItems: 'center' }}>
                  {verSenha ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/><circle cx="8" cy="8" r="2"/></svg>
                  )}
                </button>
              </div>
              {senha.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '999px', background: senha.length >= (i + 1) * 2 ? (senha.length >= 8 ? '#10b981' : '#f59e0b') : '#e5e7eb', transition: 'background .2s' }} />
                  ))}
                </div>
              )}
            </div>

            {erro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626' }}>
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
                fontSize: '14px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                cursor: carregando || !email || !senha ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {carregando ? 'Criando conta...' : 'Criar conta grátis →'}
            </button>

            <p style={{ fontSize: '11px', color: '#d1d5db', textAlign: 'center', margin: 0 }}>
              Ao criar conta você concorda com nossos termos de uso
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', margin: '20px 0 0' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#ff33cc', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}