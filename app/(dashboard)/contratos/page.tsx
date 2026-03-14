import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import Link from 'next/link'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

const IconPlus     = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconWarning  = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5L13.5 13H1.5L7.5 1.5z"/><path d="M7.5 6v3M7.5 10.5v.5"/></svg>
const IconArrow    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5h9M8 3l3.5 3.5L8 10"/></svg>
const IconCalendar = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="2" width="9" height="8" rx="1.5"/><path d="M1 5h9M3.5 1v2M7.5 1v2"/></svg>
const IconPin      = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="5.5" cy="4.5" r="2"/><path d="M5.5 6.5V10"/></svg>
const IconMoney    = () => <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="3" width="9" height="6" rx="1.5"/><circle cx="5.5" cy="6" r="1.5"/></svg>
const IconSettings = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6" cy="6" r="2"/><path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11M2.5 2.5l1 1M8.5 8.5l1 1M8.5 3.5l-1 1M3.5 8.5l-1 1"/></svg>
const IconEmpty    = () => <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#e0e0e6" strokeWidth="1.4" strokeLinecap="round"><rect x="7" y="5" width="22" height="26" rx="3"/><path d="M13 13h10M13 18h10M13 23h7"/></svg>

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

  if (!temAcesso('contratosPoMes', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Contratos Digitais" descricao="Gere contratos profissionais e envie para seus clientes assinarem." planoMinimo="avancado" icone="📋" />
  }

  // ✅ Fix: filtro por usuario_id para não vazar contratos de outros usuários
  const [{ data: contratos }, { data: perfil }] = await Promise.all([
    supabase.from('contratos').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('perfis').select('*').eq('id', user.id).single(),
  ])

  const perfilIncompleto = !perfil?.nome_loja || !perfil?.cpf_cnpj || !perfil?.telefone

  const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    pendente:  { label: 'Pendente',  color: '#d97706', bg: '#fffbf0', dot: '#f59e0b' },
    assinado:  { label: 'Assinado',  color: '#059669', bg: '#f0fdf9', dot: '#10b981' },
    cancelado: { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  }

  const total    = contratos?.length ?? 0
  const assinados = contratos?.filter(c => c.status === 'assinado').length ?? 0
  const pendentes = contratos?.filter(c => c.status === 'pendente').length ?? 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader
        titulo="Contratos"
        subtitulo={`${total} contratos gerados`}
        action={
          <Link href="/contratos/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#ff33cc', borderRadius: '999px', padding: '10px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
            <IconPlus /> Novo contrato
          </Link>
        }
      />

      <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* Aviso perfil incompleto */}
        {perfilIncompleto && (
          <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#d97706', flexShrink: 0 }}><IconWarning /></span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#92400e', margin: 0 }}>
                <strong>Dados da loja incompletos.</strong> Preencha para que apareçam nos contratos.
              </p>
            </div>
            <Link href="/configuracoes" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '999px', padding: '5px 12px', textDecoration: 'none', background: '#fff', whiteSpace: 'nowrap' }}>
              <IconSettings /> Completar perfil
            </Link>
          </div>
        )}

        {/* Mini métricas */}
        {total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total', value: total, color: '#7700ff' },
              { label: 'Assinados', value: assinados, color: '#059669' },
              { label: 'Pendentes', value: pendentes, color: '#d97706' },
            ].map((m, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{m.label}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '22px', fontWeight: 900, color: m.color, margin: 0, letterSpacing: '-0.5px' }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista */}
        {contratos && contratos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {contratos.map(contrato => {
              const badge = STATUS[contrato.status] ?? STATUS.pendente
              return (
                <div key={contrato.id} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: 3, height: 40, borderRadius: '99px', background: badge.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contrato.cliente_nome || 'Aguardando cliente'}
                      </p>
                      <span style={{ background: badge.bg, color: badge.color, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '10px', padding: '2px 8px', borderRadius: '999px', flexShrink: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                        <IconCalendar /> {new Date(contrato.evento_data).toLocaleDateString('pt-BR')}
                      </span>
                      {contrato.evento_local && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                          <IconPin /> {contrato.evento_local}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af' }}>
                        <IconMoney /> R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                  <Link href={`/contratos/${contrato.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fff0fb', borderRadius: '999px', padding: '7px 14px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap', border: '1.5px solid #ffd6f5' }}>
                    Ver <IconArrow />
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '72px 0', background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><IconEmpty /></div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 6px' }}>Nenhum contrato ainda</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>Crie seu primeiro contrato em segundos</p>
            <Link href="/contratos/novo" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#fff', background: '#ff33cc', padding: '10px 20px', borderRadius: '999px', textDecoration: 'none' }}>
              <IconPlus /> Criar contrato
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}