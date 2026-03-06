import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioPerfil from './FormularioPerfil'
import GerenciarPlanoClient from '../../gerenciar-plano/GerenciarPlanoClient'

export default async function PaginaConfiguracoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: perfil }, { data: assinatura }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase.from('assinaturas').select('status, expira_em, trial_expira_em, abacatepay_subscription_id').eq('usuario_id', user.id).single(),
  ])

  const agora = new Date()
  const trialAtivo = assinatura?.trial_expira_em
    ? new Date(assinatura.trial_expira_em) > agora
    : false

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const assinaturaAtiva =
    isAdmin ||
    trialAtivo ||
    ((assinatura?.status === 'ativo' || assinatura?.status === 'cancelando') &&
    (!assinatura.expira_em || new Date(assinatura.expira_em) > agora))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Configurações
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Dados da sua loja e assinatura
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Formulário de perfil */}
        <FormularioPerfil usuarioId={user.id} perfil={perfil} />

        {/* Divisor */}
        <div style={{ borderTop: '1px solid #eeeeee', paddingTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '4px', height: '24px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: 0 }}>
              Meu Plano
            </h2>
          </div>
          <GerenciarPlanoClient
            status={assinatura?.status ?? null}
            expiraEm={assinatura?.expira_em ?? null}
            trialExpiraEm={assinatura?.trial_expira_em ?? null}
            assinaturaAtiva={assinaturaAtiva}
            temSubscriptionId={!!assinatura?.abacatepay_subscription_id}
            isAdmin={isAdmin}
          />
        </div>

      </div>
    </div>
  )
}