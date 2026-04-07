'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Check, X, Shield, Clock, Zap, Crown, Star, MessageCircle } from 'lucide-react'
import type { Assinatura, Usuario } from './types'
import AcoesUsuario from './AcoesUsuario'

interface Props {
  usuarios: Usuario[]
}

type Filtro = 'todos' | 'active' | 'trial' | 'trial_expirado' | 'pendente' | 'free' | 'beta'

const MENSAGENS_WHATSAPP: Record<string, string> = {
  pendente: `Ola! Vi que voce iniciou a assinatura da Encantiva Pro mas nao finalizou o pagamento. Quer que eu te ajude a concluir? Temos planos a partir de R$ 19,90/mes e voce ainda tem 7 dias gratis pra testar!`,
  trial_expirado: `Ola! Seu periodo de teste na Encantiva Pro expirou. Nao perca o acesso as suas ferramentas de festas! Assine agora a partir de R$ 19,90/mes!`,
  free: `Ola! Voce esta no plano gratuito da Encantiva Pro. Sabia que com o plano pago voce tem contratos ilimitados, calculadora, catalogo e muito mais? A partir de R$ 19,90/mes!`,
}

function getMensagem(status: string | undefined | null): string {
  if (status === 'pending') return MENSAGENS_WHATSAPP.pendente
  if (status === 'trial') return MENSAGENS_WHATSAPP.trial_expirado
  return MENSAGENS_WHATSAPP.free
}

function formatarTelefone(tel: string | null): string | null {
  if (!tel) return null
  const nums = tel.replace(/\D/g, '')
  if (nums.length < 10) return null
  return nums.startsWith('55') ? nums : `55${nums}`
}

function getPlanoInfo(assinatura: Assinatura | undefined): {
  label: string; cor: string; bg: string; icon: React.ReactNode
} {
  if (!assinatura) return { label: 'Free', cor: '#ffffff55', bg: '#ffffff0d', icon: null }

  const agora = new Date()

  if (assinatura.is_beta) return { label: 'Beta', cor: '#cc66ff', bg: '#9900ff22', icon: <Star size={11} /> }

  const status = assinatura.status
  const plano  = assinatura.plano?.toLowerCase().trim() ?? ''

  if (status === 'pending') return { label: 'Pendente', cor: '#ff6644', bg: '#ff664422', icon: <Clock size={11} /> }

  if (status === 'active' || status === 'ativo' || status === 'cancelando') {
    const icons: Record<string, React.ReactNode> = {
      iniciante: <Zap size={11} />,
      avancado:  <Shield size={11} />,
      elite:     <Crown size={11} />,
    }
    const cores: Record<string, string> = {
      iniciante: '#00ff88',
      avancado:  '#00ccff',
      elite:     '#ff33cc',
    }
    if (plano && cores[plano]) {
      return {
        label: plano.charAt(0).toUpperCase() + plano.slice(1),
        cor: cores[plano],
        bg: cores[plano] + '22',
        icon: icons[plano] ?? <Check size={11} />,
      }
    }
    return { label: 'Ativo', cor: '#00ff88', bg: '#00ff8822', icon: <Check size={11} /> }
  }

  if (status === 'trial') {
    const trialAtivo = assinatura.trial_expira_em && new Date(assinatura.trial_expira_em) > agora
    return trialAtivo
      ? { label: 'Trial',          cor: '#ffcc00', bg: '#ffcc0022', icon: <Clock size={11} /> }
      : { label: 'Trial expirado', cor: '#ff6644', bg: '#ff664422', icon: <X size={11} />    }
  }

  return { label: 'Free', cor: '#ffffff55', bg: '#ffffff0d', icon: null }
}

function formatarData(iso: string | null) {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function diasRestantes(iso: string | null): string {
  if (!iso) return ''
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)}d atras`
  if (diff === 0) return 'hoje'
  return `${diff}d`
}

function BotaoWhatsApp({ telefone, nome, status }: { telefone: string | null; nome: string | null; status: string | null | undefined }) {
  const tel = formatarTelefone(telefone)

  function abrirWhatsApp() {
    const mensagem = getMensagem(status)
    const texto = encodeURIComponent(mensagem)
    if (tel) {
      window.open(`https://wa.me/${tel}?text=${texto}`, '_blank')
    } else {
      // Sem telefone - abrir WhatsApp Web sem numero para copiar a mensagem
      navigator.clipboard.writeText(getMensagem(status))
      alert(`Telefone nao cadastrado para ${nome ?? 'este usuario'}.\nMensagem copiada para a area de transferencia!`)
    }
  }

  return (
    <button
      onClick={abrirWhatsApp}
      title={tel ? `WhatsApp: ${telefone}` : 'Sem telefone - copiar mensagem'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32,
        background: tel ? '#25d36622' : '#ffffff0d',
        border: `1px solid ${tel ? '#25d36644' : '#ffffff18'}`,
        borderRadius: '8px',
        color: tel ? '#25d366' : '#ffffff33',
        cursor: 'pointer', transition: 'all .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#25d36633'
        e.currentTarget.style.borderColor = '#25d36666'
        e.currentTarget.style.color = '#25d366'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = tel ? '#25d36622' : '#ffffff0d'
        e.currentTarget.style.borderColor = tel ? '#25d36644' : '#ffffff18'
        e.currentTarget.style.color = tel ? '#25d366' : '#ffffff33'
      }}
    >
      <MessageCircle size={13} />
    </button>
  )
}

export default function TabelaUsuarios({ usuarios }: Props) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordenar, setOrdenar] = useState<'recente' | 'antigo' | 'email'>('recente')

  const usuariosFiltrados = useMemo(() => {
    const agora = new Date()
    let lista = [...usuarios]

    if (filtro !== 'todos') {
      lista = lista.filter(u => {
        const a = u.assinaturas?.[0]
        if (filtro === 'pendente') return a?.status === 'pending'
        if (filtro === 'free') return !a || (a.status !== 'active' && a.status !== 'ativo' && a.status !== 'trial' && a.status !== 'pending')
        if (filtro === 'beta') return a?.is_beta
        if (filtro === 'trial') return a?.status === 'trial' && !!a.trial_expira_em && new Date(a.trial_expira_em) > agora
        if (filtro === 'trial_expirado') return a?.status === 'trial' && !!a.trial_expira_em && new Date(a.trial_expira_em) <= agora
        if (filtro === 'active') return (a?.status === 'active' || a?.status === 'ativo') && ['iniciante', 'avancado', 'elite'].includes(a?.plano ?? '')
        return true
      })
    }

    if (busca.trim()) {
      lista = lista.filter(u =>
        u.email.toLowerCase().includes(busca.toLowerCase()) ||
        (u.nome_loja ?? '').toLowerCase().includes(busca.toLowerCase())
      )
    }

    if (ordenar === 'recente') lista.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
    if (ordenar === 'antigo')  lista.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime())
    if (ordenar === 'email')   lista.sort((a, b) => a.email.localeCompare(b.email))

    return lista
  }, [usuarios, filtro, busca, ordenar])

  const filtros: { key: Filtro; label: string; cor?: string }[] = [
    { key: 'todos',          label: 'Todos'          },
    { key: 'active',         label: 'Assinantes'     },
    { key: 'trial',          label: 'Trial'          },
    { key: 'trial_expirado', label: 'Trial expirado' },
    { key: 'pendente',       label: 'Pendentes', cor: '#ff6644' },
    { key: 'free',           label: 'Free'           },
    { key: 'beta',           label: 'Beta'           },
  ]

  return (
    <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', overflow: 'hidden' }}>

      {/* Barra de ferramentas */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #ffffff12', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ffffff44' }} />
          <input type="text" placeholder="Buscar por email ou nome da loja..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '8px', padding: '8px 12px 8px 34px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filtros.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{ padding: '6px 12px', borderRadius: '999px', border: `1px solid ${filtro === f.key ? (f.cor ?? '#ff33cc') : '#ffffff18'}`, background: filtro === f.key ? `${f.cor ?? '#ff33cc'}22` : 'transparent', color: filtro === f.key ? (f.cor ?? '#ff33cc') : '#ffffff55', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <select value={ordenar} onChange={e => setOrdenar(e.target.value as typeof ordenar)}
            style={{ appearance: 'none', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '8px', padding: '8px 28px 8px 12px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
            <option value="recente" style={{ background: '#1a0044' }}>Mais recentes</option>
            <option value="antigo"  style={{ background: '#1a0044' }}>Mais antigos</option>
            <option value="email"   style={{ background: '#1a0044' }}>Email A-Z</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#ffffff44', pointerEvents: 'none' }} />
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33', whiteSpace: 'nowrap' }}>
          {usuariosFiltrados.length} resultado{usuariosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Aviso de mensagens para pendentes */}
      {filtro === 'pendente' && usuariosFiltrados.length > 0 && (
        <div style={{ padding: '12px 20px', background: '#ff664411', borderBottom: '1px solid #ff664422', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={14} color="#ff6644" />
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff9977', margin: 0 }}>
            <strong>{usuariosFiltrados.length} pessoas</strong> iniciaram o pagamento mas nao concluiram. Clique no icone do WhatsApp para enviar uma mensagem direta.
          </p>
        </div>
      )}

      {/* Tabela */}
      {usuariosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '14px' }}>
          Nenhum usuario encontrado
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ffffff12' }}>
              {['Usuario', 'Plano', 'Status', 'Trial / Expira', 'Cadastro', 'Acoes'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff33', letterSpacing: '1px', textTransform: 'uppercase', background: '#ffffff05', whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => {
              const assinatura = usuario.assinaturas?.[0]
              const planoInfo = getPlanoInfo(assinatura)
              const expiracaoRelevante = assinatura?.status === 'trial'
                ? assinatura?.trial_expira_em
                : assinatura?.expira_em

              return (
                <tr key={usuario.id} style={{ borderBottom: '1px solid #ffffff08', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>

                  <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                    {usuario.nome_loja && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#fff', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {usuario.nome_loja}
                      </p>
                    )}
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff55', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {usuario.email}
                    </p>
                    {usuario.telefone && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#25d36688', margin: '2px 0 0' }}>
                        {usuario.telefone}
                      </p>
                    )}
                    {assinatura?.is_beta && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#cc66ff', fontWeight: 600 }}>* Beta</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: planoInfo.bg, color: planoInfo.cor, border: `1px solid ${planoInfo.cor}44`, borderRadius: '999px', padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {planoInfo.icon}
                      {planoInfo.label}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: assinatura?.status === 'active' || assinatura?.status === 'ativo' ? '#00ff88' : assinatura?.status === 'pending' ? '#ff6644' : '#ffffff44' }}>
                      {assinatura?.status ?? 'free'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    {expiracaoRelevante ? (
                      <div>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff88', margin: '0 0 1px' }}>
                          {formatarData(expiracaoRelevante)}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: new Date(expiracaoRelevante) < new Date() ? '#ff6644' : '#ffffff44', margin: 0 }}>
                          {diasRestantes(expiracaoRelevante)}
                        </p>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff22' }}>--</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44' }}>
                      {formatarData(usuario.criado_em)}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <BotaoWhatsApp
                        telefone={usuario.telefone}
                        nome={usuario.nome_loja ?? usuario.email}
                        status={assinatura?.status}
                      />
                      <AcoesUsuario
                        usuarioId={usuario.id}
                        email={usuario.email}
                        assinatura={assinatura ?? null}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}