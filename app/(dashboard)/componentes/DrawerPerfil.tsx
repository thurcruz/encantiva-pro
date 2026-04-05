'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, Save, Crown, CheckCircle, Clock, AlertTriangle, XCircle,
  LogOut, FileText, ChevronRight, User, CreditCard,
  Scissors, Calculator, Calendar, FileSignature, BookOpen,
  Package, BarChart2, Star, Zap, Settings,
} from 'lucide-react'

interface Perfil {
  nome_loja: string | null
  cpf_cnpj: string | null
  telefone: string | null
  endereco: string | null
}

interface Props {
  aberto: boolean
  onFechar: () => void
  usuarioId: string
  email: string
  inicial: string
  perfil: Perfil | null
  status: string | null
  expiraEm: string | null
  trialExpiraEm: string | null
  assinaturaAtiva: boolean
  temSubscriptionId: boolean
  isAdmin: boolean
  nomePlano: string
  isTrial: boolean
}

// Mapa de planos com funcionalidades e cores
const PLANOS_INFO: Record<string, {
  nome: string; preco: string | null; cor: string; corBg: string
  icone: React.ReactNode; funcionalidades: { icone: React.ReactNode; label: string; incluso: boolean }[]
}> = {
  free: {
    nome: 'Grátis', preco: null, cor: '#6b7280', corBg: '#f3f4f6',
    icone: <Zap size={14} />,
    funcionalidades: [
      { icone: <Scissors size={12} />, label: 'Cortador de painéis', incluso: true },
      { icone: <BookOpen size={12} />, label: 'Materiais (5/mês)', incluso: true },
      { icone: <FileSignature size={12} />, label: 'Contratos (5/mês)', incluso: true },
      { icone: <Calendar size={12} />, label: 'Agenda (5/mês)', incluso: true },
      { icone: <Calculator size={12} />, label: 'Calculadora', incluso: false },
      { icone: <BarChart2 size={12} />, label: 'Financeiro', incluso: false },
      { icone: <Package size={12} />, label: 'Acervo', incluso: false },
    ],
  },
  iniciante: {
    nome: 'Iniciante', preco: 'R$ 19,90', cor: '#059669', corBg: '#f0fdf4',
    icone: <Zap size={14} />,
    funcionalidades: [
      { icone: <Scissors size={12} />, label: 'Cortador ilimitado', incluso: true },
      { icone: <BookOpen size={12} />, label: 'Materiais ilimitados', incluso: true },
      { icone: <FileSignature size={12} />, label: 'Contratos (10/mês)', incluso: true },
      { icone: <Calendar size={12} />, label: 'Agenda (10/mês)', incluso: true },
      { icone: <Calculator size={12} />, label: 'Calculadora', incluso: true },
      { icone: <BarChart2 size={12} />, label: 'Financeiro', incluso: false },
      { icone: <Package size={12} />, label: 'Acervo', incluso: false },
    ],
  },
  avancado: {
    nome: 'Avançado', preco: 'R$ 34,90', cor: '#7c3aed', corBg: '#f5f3ff',
    icone: <Crown size={14} />,
    funcionalidades: [
      { icone: <Scissors size={12} />, label: 'Cortador ilimitado', incluso: true },
      { icone: <BookOpen size={12} />, label: 'Materiais ilimitados', incluso: true },
      { icone: <FileSignature size={12} />, label: 'Contratos ilimitados', incluso: true },
      { icone: <Calendar size={12} />, label: 'Agenda ilimitada', incluso: true },
      { icone: <Calculator size={12} />, label: 'Calculadora', incluso: true },
      { icone: <BarChart2 size={12} />, label: 'Financeiro', incluso: false },
      { icone: <Package size={12} />, label: 'Acervo', incluso: false },
    ],
  },
  elite: {
    nome: 'Elite', preco: 'R$ 54,90', cor: '#ff33cc', corBg: '#fff0fb',
    icone: <Crown size={14} />,
    funcionalidades: [
      { icone: <Scissors size={12} />, label: 'Cortador ilimitado', incluso: true },
      { icone: <BookOpen size={12} />, label: 'Materiais ilimitados', incluso: true },
      { icone: <FileSignature size={12} />, label: 'Contratos ilimitados', incluso: true },
      { icone: <Calendar size={12} />, label: 'Agenda ilimitada', incluso: true },
      { icone: <Calculator size={12} />, label: 'Calculadora', incluso: true },
      { icone: <BarChart2 size={12} />, label: 'Financeiro completo', incluso: true },
      { icone: <Package size={12} />, label: 'Acervo', incluso: true },
    ],
  },
}

export default function DrawerPerfil({
  aberto, onFechar, usuarioId, email, inicial, perfil,
  status, expiraEm, trialExpiraEm, assinaturaAtiva, temSubscriptionId, isAdmin, nomePlano,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [aba, setAba] = useState<'perfil' | 'plano'>('perfil')
  const [nomeLoja, setNomeLoja] = useState(perfil?.nome_loja ?? '')
  const [cpfCnpj, setCpfCnpj] = useState(perfil?.cpf_cnpj ?? '')
  const [telefone, setTelefone] = useState(perfil?.telefone ?? '')
  const [endereco, setEndereco] = useState(perfil?.endereco ?? '')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [confirmarCancel, setConfirmarCancel] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [mensagemCancel, setMensagemCancel] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [planoReal, setPlanoReal] = useState<string>(nomePlano ?? 'free')

  // Buscar plano diretamente do banco ao abrir o drawer
  useState(() => {
    if (!usuarioId) return
    supabase.from('assinaturas').select('plano, status').eq('usuario_id', usuarioId).single()
      .then(({ data }) => {
        if (data?.plano) setPlanoReal(data.plano)
      })
  })

  const agora = new Date()
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > agora : false
  const dataExpiracao = expiraEm ? new Date(expiraEm) : null
  const diasRestantes = dataExpiracao
    ? Math.max(0, Math.ceil((dataExpiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  // Normalizar nome do plano para chave do mapa
  const planoKey = (() => {
    const n = (planoReal ?? '').toLowerCase().trim()
    if (n.includes('elite')) return 'elite'
    if (n.includes('avan') || n === 'avancado' || n === 'avançado') return 'avancado'
    if (n.includes('inici')) return 'iniciante'
    return 'free'
  })()
  const planoInfo = PLANOS_INFO[planoKey] ?? PLANOS_INFO.free

  const badge = (() => {
    if (isAdmin) return { label: 'Admin', color: '#9900ff', bg: '#f5f0ff', icon: <Crown size={13} /> }
    if (trialAtivo) return { label: 'Trial ativo', color: '#cc8800', bg: '#fff8ec', icon: <Clock size={13} /> }
    if (status === 'ativo' || status === 'active') return { label: 'Ativo', color: '#059669', bg: '#f0fdf4', icon: <CheckCircle size={13} /> }
    if (status === 'cancelando') return { label: 'Cancela ao expirar', color: '#cc5500', bg: '#fff5ec', icon: <AlertTriangle size={13} /> }
    if (status === 'cancelado') return { label: 'Cancelado', color: '#cc0000', bg: '#fff0f0', icon: <XCircle size={13} /> }
    return { label: 'Gratuito', color: '#6b7280', bg: '#f3f4f6', icon: <Zap size={13} /> }
  })()

  async function salvarPerfil() {
    setSalvando(true)
    await supabase.from('perfis').upsert({
      id: usuarioId,
      nome_loja: nomeLoja || null,
      cpf_cnpj: cpfCnpj || null,
      telefone: telefone || null,
      endereco: endereco || null,
      atualizado_em: new Date().toISOString(),
    })
    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2500)
    router.refresh()
  }

  async function cancelarAssinatura() {
    setCancelando(true)
    const res = await fetch('/api/abacatepay/cancelar-assinatura', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setMensagemCancel({ tipo: 'sucesso', texto: 'Assinatura cancelada. Acesso continua até o fim do período pago.' })
      setConfirmarCancel(false)
      router.refresh()
    } else {
      setMensagemCancel({ tipo: 'erro', texto: json.error ?? 'Erro ao cancelar.' })
    }
    setCancelando(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fafafa', border: '1px solid #e8e8ec',
    borderRadius: '10px', padding: '10px 14px', color: '#111827',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '10px',
    fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
    letterSpacing: '0.8px', textTransform: 'uppercase',
  }

  return (
    <>
      {aberto && (
        <div onClick={onFechar} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(10,0,30,0.55)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease' }} />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: '420px',
        background: '#fff', zIndex: 99,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(10,0,30,0.18)',
        transform: aberto ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(145deg, #0e0025 0%, #2d0060 100%)', padding: '24px 20px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#fff', boxShadow: '0 0 0 3px rgba(255,51,204,0.3)', flexShrink: 0 }}>
                {inicial}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nomeLoja || 'Minha loja'}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email}
                </p>
              </div>
            </div>
            <button onClick={onFechar} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
              <X size={15} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Badge plano */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ color: planoInfo.cor, display: 'flex' }}>{planoInfo.icone}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
              Plano {planoInfo.nome}
            </span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ display: 'flex', color: badge.color === '#059669' ? '#6ee7b7' : 'rgba(255,255,255,0.6)' }}>{badge.icon}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: badge.color === '#059669' ? '#6ee7b7' : 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* ── Abas ── */}
        <div style={{ display: 'flex', background: '#f6f6f8', margin: '14px 16px 0', borderRadius: '12px', padding: '3px', flexShrink: 0 }}>
          {([
            { key: 'perfil', icon: <User key="icon-perfil" size={13} />, label: 'Meu Perfil' },
            { key: 'plano', icon: <CreditCard key="icon-plano" size={13} />, label: 'Meu Plano' },
          ] as const).map(({ key, icon, label }) => (
            <button key={key} onClick={() => setAba(key as 'perfil' | 'plano')} style={{
              flex: 1, padding: '9px 8px',
              background: aba === key ? '#fff' : 'transparent',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px',
              color: aba === key ? '#111827' : '#9ca3af',
              boxShadow: aba === key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* ABA PERFIL */}
          {aba === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px', border: '1px solid #f0f0f4' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 12px' }}>Dados da loja</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Nome da loja</label>
                    <input type="text" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)} placeholder="Ex: Encantiva Festas" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>CPF / CNPJ</label>
                      <input type="text" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Telefone</label>
                      <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Endereço</label>
                    <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" style={inputStyle} />
                  </div>
                </div>
              </div>

              {sucesso && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} /> Dados salvos com sucesso!
                </div>
              )}

              <button onClick={salvarPerfil} disabled={salvando} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: salvando ? '#f0f0f0' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '13px', color: salvando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: salvando ? 'not-allowed' : 'pointer' }}>
                <Save size={14} />
                {salvando ? 'Salvando...' : 'Salvar dados'}
              </button>

              {/* Assinatura da loja */}
              <Link href="/configuracoes" onClick={onFechar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '13px 14px', textDecoration: 'none', transition: 'border-color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#ff33cc44')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e8ec')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={14} color="#ff33cc" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Assinatura da loja</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Aparece nos contratos</p>
                  </div>
                </div>
                <ChevronRight size={15} color="#d1d5db" />
              </Link>

              {/* Configurações */}
              <Link href="/configuracoes" onClick={onFechar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '13px 14px', textDecoration: 'none', transition: 'border-color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#e8e8ec')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e8ec')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={14} color="#6b7280" />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Configurações</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Notificações e preferências</p>
                  </div>
                </div>
                <ChevronRight size={15} color="#d1d5db" />
              </Link>
            </div>
          )}

          {/* ABA PLANO */}
          {aba === 'plano' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Card do plano atual */}
              <div style={{ background: `linear-gradient(135deg, ${planoInfo.corBg}, #fff)`, border: `1.5px solid ${planoInfo.cor}33`, borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${planoInfo.cor}10` }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>Plano atual</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
                      {planoInfo.nome}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {planoInfo.preco ? (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: planoInfo.cor, margin: 0 }}>{planoInfo.preco}<span style={{ fontSize: '11px', fontWeight: 500, color: '#9ca3af' }}>/mês</span></p>
                    ) : (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 900, color: planoInfo.cor, margin: 0 }}>Grátis</p>
                    )}
                  </div>
                </div>

                {/* Status + data */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: badge.bg, color: badge.color, borderRadius: '999px', padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px' }}>
                    {badge.icon} {badge.label}
                  </div>
                  {trialAtivo && trialExpiraEm && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                      até {new Date(trialExpiraEm).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {dataExpiracao && !trialAtivo && (
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                      {status === 'cancelando' ? 'Acesso até' : 'Renova em'} {dataExpiracao.toLocaleDateString('pt-BR')}
                      {diasRestantes !== null && ` · ${diasRestantes}d`}
                    </span>
                  )}
                </div>
              </div>

              {/* Funcionalidades do plano */}
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px', border: '1px solid #f0f0f4' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>O que está incluso</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {planoInfo.funcionalidades.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: f.incluso ? 1 : 0.4 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '6px', background: f.incluso ? `${planoInfo.cor}15` : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: f.incluso ? planoInfo.cor : '#9ca3af' }}>
                        {f.icone}
                      </div>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 500, color: f.incluso ? '#111827' : '#9ca3af', textDecoration: f.incluso ? 'none' : 'line-through' }}>
                        {f.label}
                      </span>
                      {f.incluso && <CheckCircle size={11} color={planoInfo.cor} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA upgrade */}
              {!assinaturaAtiva && !isAdmin && (
                <div style={{ background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)', border: '1px solid rgba(153,0,255,0.15)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Star size={15} color="#ff33cc" />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0 }}>Desbloqueie mais recursos</p>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>Contratos ilimitados, financeiro, acervo e muito mais.</p>
                  <Link href="/planos" onClick={onFechar} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', borderRadius: '999px', padding: '10px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}>
                    <Crown size={13} /> Ver planos
                  </Link>
                </div>
              )}

              {/* Trocar plano */}
              {(assinaturaAtiva || isAdmin) && status !== 'cancelando' && (
                <Link href="/planos" onClick={onFechar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '13px 14px', textDecoration: 'none', transition: 'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#9900ff44')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e8ec')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={14} color="#9900ff" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Trocar plano</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Upgrade ou downgrade</p>
                    </div>
                  </div>
                  <ChevronRight size={15} color="#d1d5db" />
                </Link>
              )}

              {/* Cancelar */}
              {temSubscriptionId && (status === 'ativo' || status === 'active') && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '14px', padding: '14px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#374151', margin: '0 0 4px' }}>Cancelar assinatura</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 12px' }}>Acesso continua até o fim do período pago.</p>
                  {!confirmarCancel ? (
                    <button onClick={() => setConfirmarCancel(true)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '999px', padding: '9px 16px', color: '#dc2626', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                      Cancelar assinatura
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AlertTriangle size={13} /> Tem certeza? Esta ação não pode ser desfeita.
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={cancelarAssinatura} disabled={cancelando} style={{ flex: 1, background: '#dc2626', border: 'none', borderRadius: '999px', padding: '10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', opacity: cancelando ? 0.7 : 1 }}>
                          {cancelando ? 'Cancelando...' : 'Confirmar'}
                        </button>
                        <button onClick={() => setConfirmarCancel(false)} style={{ flex: 1, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '999px', padding: '10px', color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                          Voltar
                        </button>
                      </div>
                    </div>
                  )}
                  {mensagemCancel && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: mensagemCancel.tipo === 'sucesso' ? '#059669' : '#dc2626', margin: '10px 0 0', background: mensagemCancel.tipo === 'sucesso' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', padding: '8px 10px' }}>
                      {mensagemCancel.texto}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div style={{ padding: '10px 16px 20px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e8e8ec'; e.currentTarget.style.color = '#6b7280' }}>
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  )
}