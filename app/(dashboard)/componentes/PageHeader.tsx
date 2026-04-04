import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import BotaoConfig from './BotaoConfig'

interface Props {
  titulo: string
  subtitulo?: string
  maxWidth?: string
  action?: ReactNode
}

export default async function PageHeader({ titulo, subtitulo, maxWidth = '1000px', action }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: perfil }, { data: assinatura }] = await Promise.all([
    supabase.from('perfis').select('nome_loja, cpf_cnpj, telefone, endereco').eq('id', user!.id).single(),
    supabase.from('assinaturas').select('status, plano, expira_em, trial_expira_em, abacatepay_subscription_id').eq('usuario_id', user!.id).single(),
  ])

  const isAdmin = user!.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const agora = new Date()
  const isTrial = !!(assinatura?.trial_expira_em && new Date(assinatura.trial_expira_em) > agora)
  const assinaturaAtiva =
    isAdmin ||
    isTrial ||
    ((assinatura?.status === 'ativo' || assinatura?.status === 'active') && (!assinatura.expira_em || new Date(assinatura.expira_em) > agora))

  // ✅ Defensivo: nunca quebra mesmo sem perfil ou email
  const nomeOuEmail = perfil?.nome_loja ?? user?.email ?? ''
  const inicial = nomeOuEmail.length > 0 ? nomeOuEmail[0].toUpperCase() : 'U'

  const nomePlano = isAdmin ? 'Admin' : (assinatura?.plano ?? 'free')

  return (
    <div style={{
      borderBottom: '1px solid #eeeeee',
      padding: '24px 40px',
      backgroundColor: '#fff',
    }} className="page-header-wrap">
      <div style={{
        maxWidth,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '4px', height: '32px', borderRadius: '4px',
            background: '#ff33cc',
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 900,
              fontSize: '28px', color: '#140033',
              letterSpacing: '-1px', margin: 0,
            }}>
              {titulo}
            </h1>
            {subtitulo && (
              <p style={{
                color: '#00000055', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', margin: 0,
              }}>
                {subtitulo}
              </p>
            )}
          </div>
        </div>

        {/* Direita: action + botão config */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {action}
          <BotaoConfig
            usuarioId={user!.id}
            email={user!.email ?? ''}
            inicial={inicial}
            perfil={perfil}
            status={assinatura?.status ?? null}
            expiraEm={assinatura?.expira_em ?? null}
            trialExpiraEm={assinatura?.trial_expira_em ?? null}
            assinaturaAtiva={assinaturaAtiva}
            temSubscriptionId={!!assinatura?.abacatepay_subscription_id}
            isAdmin={isAdmin}
            nomePlano={nomePlano}
            isTrial={isTrial}
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .page-header-wrap { padding: 14px 16px !important; }
          .page-header-wrap h1 { font-size: 22px !important; }
        }
      `}</style>
    </div>
  )
}