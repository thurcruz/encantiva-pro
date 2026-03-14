import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import FormularioContrato from './FormularioContrato'
import PageHeader from '../../componentes/PageHeader'

export default async function PaginaNovoContrato() {
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

  if (!temAcesso('contratosPoMes', limites, isBeta, isAdmin)) redirect('/contratos')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Novo contrato" subtitulo="Preencha os dados para gerar o contrato" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <FormularioContrato usuarioId={user.id} />
      </div>
    </div>
  )
}