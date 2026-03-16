'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Mail, Lock, User, Loader2 } from 'lucide-react'

interface Props {
  onFechar: () => void
  onSucesso: () => void
}

const BENEFICIOS = [
  '✂️ Cortador de Painéis ilimitado',
  '📋 Catálogo digital dos seus produtos',
  '📅 Agenda de pedidos e entregas',
  '💰 Controle financeiro do seu negócio',
  '🖼️ Painéis prontos da comunidade',
]

export default function ModalLogin({ onFechar, onSucesso }: Props) {
  const supabase = createClient()
  const [modo, setModo]             = useState<'login' | 'cadastro'>('cadastro')
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [nome, setNome]             = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]             = useState('')

  async function handleSubmit() {
    setErro('')
    if (!email.trim() || !senha.trim()) { setErro('Preencha e-mail e senha.'); return }
    if (modo === 'cadastro' && !nome.trim()) { setErro('Digite seu nome.'); return }
    if (senha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    setCarregando(true)

    if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        setErro('E-mail ou senha incorretos.')
        setCarregando(false)
      } else {
        onSucesso()
      }
      return
    }

    // Cadastro — sem verificação de e-mail, chama onSucesso direto
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

    // Salva o nome — trial é criado quando entrar no dashboard
    if (data.user && nome) {
      await supabase.from('perfis').upsert({ id: data.user.id, nome_loja: nome })
    }

    onSucesso()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fafafa', border: '1.5px solid #e8e8ec',
    borderRadius: '10px', padding: '11px 14px 11px 42px', color: '#111827',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onFechar() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20,0,51,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '24px',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#111827', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              {modo === 'cadastro' ? 'Criar conta grátis' : 'Entrar na conta'}
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              {modo === 'cadastro' ? 'E baixe o PDF agora' : 'Entre para baixar o PDF'}
            </p>
          </div>
          <button
            onClick={onFechar}
            style={{ width: 32, height: 32, borderRadius: '8px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Benefícios (só no cadastro) ── */}
        {modo === 'cadastro' && (
          <div style={{ margin: '16px 24px 0', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {BENEFICIOS.map((b, i) => (
              <p key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#374151', margin: 0 }}>{b}</p>
            ))}
          </div>
        )}

        {/* ── Toggle cadastro / login ── */}
        <div style={{ margin: '16px 24px 0', display: 'flex', background: '#f3f4f6', borderRadius: '10px', padding: '3px', gap: '3px' }}>
          {(['cadastro', 'login'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setModo(m); setErro('') }}
              style={{
                flex: 1, padding: '8px',
                background: modo === m ? '#fff' : 'transparent',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
                color: modo === m ? '#111827' : '#9ca3af',
                boxShadow: modo === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s',
              }}
            >
              {m === 'cadastro' ? 'Criar conta' : 'Já tenho conta'}
            </button>
          ))}
        </div>

        {/* ── Formulário ── */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {modo === 'cadastro' && (
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus={modo === 'login'}
              style={inputStyle}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="password"
              placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Sua senha'}
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          </div>

          {erro && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '9px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626' }}>
              {erro}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={carregando}
            style={{
              width: '100%', border: 'none', borderRadius: '10px', padding: '13px',
              background: carregando ? '#e5e7eb' : '#ff33cc',
              color: carregando ? '#9ca3af' : '#fff',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px',
              cursor: carregando ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: '2px', transition: 'background .15s',
            }}
          >
            {carregando && <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {carregando
              ? 'Aguarde...'
              : modo === 'cadastro'
                ? 'Criar conta e baixar PDF ✨'
                : 'Entrar e baixar PDF'}
          </button>

          {modo === 'cadastro' && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Ao criar conta você concorda com os termos de uso
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}