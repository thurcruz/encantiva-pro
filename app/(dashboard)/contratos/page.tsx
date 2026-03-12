import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import Link from 'next/link'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

// ── Ícones SVG ────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7.5 2v11M2 7.5h11"/>
  </svg>
)
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5L14.5 13H1.5L8 1.5z"/>
    <path d="M8 6v3.5M8 11v.5"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7h10M8 3l4 4-4 4"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="1" y="2" width="10" height="9" rx="1.5"/>
    <path d="M1 5h10M4 1v2M8 1v2"/>
  </svg>
)
const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <circle cx="6" cy="5" r="2.5"/>
    <path d="M6 7.5V11M3.5 5a2.5 2.5 0 0 1 5 0"/>
  </svg>
)
const IconMoney = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <rect x="1" y="3" width="10" height="7" rx="1.5"/>
    <circle cx="6" cy="6.5" r="1.5"/>
  </svg>
)
const IconEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#e0e0e6" strokeWidth="1.5" strokeLinecap="round">
    <rect x="8" y="6" width="24" height="29" rx="3"/>
    <path d="M14 14h12M14 19h12M14 24h8"/>
  </svg>
)
const IconSettings = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="6.5" cy="6.5" r="2"/>
    <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12M2.5 2.5l1 1M9.5 9.5l1 1M9.5 3.5l-1 1M3.5 9.5l-1 1"/>
  </svg>
)

export default async function PaginaContratos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, plano, trial_expira_em, is_beta')
    .eq('usuario_id', user.id)
    .single()

  const isBeta = assinatura?.is_beta === true
  const planoId = getPlanoId(assinatura?.status ?? null, assinatura?.plano ?? null, assinatura?.trial_expira_em ?? null, isAdmin)
  const limites = getLimites(planoId)

  if (!temAcesso('contratosDigitais', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Contratos Digitais" descricao="Gere contratos profissionais e envie para seus clientes assinarem." planoMinimo="avancado" icone="📋" />
  }

  const [{ data: contratos }, { data: perfil }] = await Promise.all([
    supabase.from('contratos').select('*').order('criado_em', { ascending: false }),
    supabase.from('perfis').select('*').eq('id', user.id).single(),
  ])

  const perfilIncompleto = !perfil?.nome_loja || !perfil?.cpf_cnpj || !perfil?.telefone

  const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pendente:  { label: 'Pendente',  color: '#d97706', bg: '#fffbf0', dot: '#f59e0b' },
    assinado:  { label: 'Assinado',  color: '#059669', bg: '#f0fdf9', dot: '#10b981' },
    cancelado: { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  }

  const total = contratos?.length ?? 0
  const assinados = contratos?.filter(c => c.status === 'assinado').length ?? 0
  const pendentes = contratos?.filter(c => c.status === 'pendente').length ?? 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader
        titulo="Contratos"
        subtitulo={`${total} contratos gerados`}
        action={
          <Link href="/contratos/novo" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '10px', padding: '10px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
            <IconPlus />
            Novo contrato
          </Link>
        }
      />

      <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* ── Aviso perfil incompleto ── */}
        {perfilIncompleto && (
          <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#d97706', flexShrink: 0 }}><IconWarning /></span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                <strong>Dados da loja incompletos.</strong> Preencha para que apareçam nos contratos.
              </p>
            </div>
            <Link href="/configuracoes" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '7px', padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap', background: '#fff' }}>
              <IconSettings />
              Completar perfil
            </Link>
          </div>
        )}

        {/* ── Mini métricas ── */}
        {total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Total', value: total, accent: '#7700ff' },
              { label: 'Assinados', value: assinados, accent: '#059669' },
              { label: 'Pendentes', value: pendentes, accent: '#d97706' },
            ].map((m, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '14px 18px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{m.label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 800, color: m.accent, margin: 0, letterSpacing: '-0.5px' }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Lista de contratos ── */}
        {contratos && contratos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contratos.map(contrato => {
              const badge = statusConfig[contrato.status] ?? statusConfig.pendente
              return (
                <div key={contrato.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>

                  {/* Indicador lateral */}
                  <div style={{ width: '3px', height: '40px', borderRadius: '99px', background: badge.dot, flexShrink: 0 }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contrato.cliente_nome || 'Cliente não preenchido'}
                      </h3>
                      <span style={{ background: badge.bg, color: badge.color, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.3px', flexShrink: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                        <IconCalendar />
                        {new Date(contrato.evento_data).toLocaleDateString('pt-BR')}
                      </span>
                      {contrato.evento_local && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                          <IconPin />
                          {contrato.evento_local}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                        <IconMoney />
                        R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Ação */}
                  <Link href={`/contratos/${contrato.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f0ff', borderRadius: '8px', padding: '8px 14px', color: '#7700ff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    Ver contrato
                    <IconArrow />
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <IconEmpty />
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#374151', margin: '0 0 6px 0' }}>Nenhum contrato ainda</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px 0' }}>Crie seu primeiro contrato em segundos</p>
            <Link href="/contratos/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none' }}>
              <IconPlus />
              Criar contrato
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}