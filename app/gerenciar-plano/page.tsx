import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GerenciarPlanoClient from './GerenciarPlanoClient'

export default async function PaginaGerenciarPlano() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, plano, asaas_subscription_id')
    .eq('usuario_id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Meu Plano
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Gerencie sua assinatura Encantiva
            </p>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 40px' }}>
        <GerenciarPlanoClient
          status={assinatura?.status ?? null}
          planoAtual={assinatura?.plano ?? ''}
          asaasSubscriptionId={assinatura?.asaas_subscription_id ?? null}
        />
      </div>
    </div>
  )
}