'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Mail, Lock, User, Loader2, Sparkles, BookOpen, Calendar, DollarSign, Users } from 'lucide-react'

interface Props {
  onFechar: () => void
  onSucesso: () => void
}

const BENEFICIOS = [
  { icon: Sparkles, label: 'Cortador de Painéis ilimitado' },
  { icon: BookOpen, label: 'Catálogo digital dos seus produtos' },
  { icon: Calendar, label: 'Agenda de pedidos e entregas' },
  { icon: DollarSign, label: 'Controle financeiro do seu negócio' },
  { icon: Users, label: 'Painéis prontos da comunidade' },
]

export default function ModalLogin({ onFechar, onSucesso }: Props) {
  const supabase = createClient()
  const [modo, setModo] = useState<'login' | 'cadastro'>('cadastro')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function handleSubmit() {
    setErro(''); setSucesso('')
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    if (modo === 'cadastro' && !nome.trim()) { setErro('Digite seu nome.'); return }
    setCarregando(true)

    if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro('E-mail ou senha incorretos.')
      else onSucesso()
    } else {
      const { error } = await supabase.auth.signUp({
        email, password: senha,
        options: { data: { full_name: nome } },
      })
      if (error) {
        setErro(error.message.includes('already registered')
          ? 'Este e-mail já possui conta. Faça login.'
          : 'Erro ao criar conta. Tente novamente.')
      } else {
        setSucesso('Conta criada! Verifique seu e-mail para confirmar.')
      }
    }
    setCarregando(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fafafa', border: '1.5px solid #e5e5e5',
    borderRadius: '12px', padding: '12px 16px 12px 44px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(20,0,51,0.6)', backdropFilter: 'blur(6px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '28px',
        maxWidth: '460px', width: '100%', position: 'relative',
        boxShadow: '0 32px 80px rgba(153,0,255,0.2)',
        overflow: 'hidden',
      }}>

        {/* Header gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, #140033, #2d0066)',
          padding: '28px 28px 24px',
        }}>
          <button onClick={onFechar} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={15} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(255,51,204,0.4)' }}>
              <Sparkles size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                {modo === 'cadastro' ? 'Crie sua conta grátis' : 'Bem-vinda de volta!'}
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {modo === 'cadastro' ? 'E baixe o PDF agora' : 'Entre para baixar o PDF'}
              </p>
            </div>
          </div>

          {/* Benefícios — só no modo cadastro */}
          {modo === 'cadastro' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {BENEFICIOS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,51,204,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <b.icon size={10} style={{ color: '#ff99ee' }} />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{b.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* Toggle login/cadastro */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            {(['cadastro', 'login'] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); setErro(''); setSucesso('') }} style={{
                flex: 1, padding: '9px',
                background: modo === m ? '#fff' : 'transparent',
                border: 'none', borderRadius: '9px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
                color: modo === m ? '#140033' : '#00000044',
                boxShadow: modo === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
                {m === 'cadastro' ? 'Criar conta' : 'Já tenho conta'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {modo === 'cadastro' && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00000033', pointerEvents: 'none' }} />
                <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00000033', pointerEvents: 'none' }} />
              <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00000033', pointerEvents: 'none' }} />
              <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
            </div>
          </div>

          {erro && (
            <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#cc0000' }}>
              {erro}
            </div>
          )}
          {sucesso && (
            <div style={{ background: '#f0fff4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#166534' }}>
              {sucesso}
            </div>
          )}

          <button onClick={handleSubmit} disabled={carregando} style={{
            width: '100%',
            background: carregando ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)',
            border: 'none', borderRadius: '14px', padding: '15px',
            color: carregando ? '#00000033' : '#fff',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
            cursor: carregando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: carregando ? 'none' : '0 8px 28px rgba(255,51,204,0.3)',
          }}>
            {carregando && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {carregando ? 'Aguarde...' : modo === 'cadastro' ? 'Criar conta e baixar PDF ✨' : 'Entrar e baixar PDF'}
          </button>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}