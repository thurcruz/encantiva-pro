import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import GraficosFinanceiro from './GraficosFinanceiro'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaFinanceiro() {
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

  if (!temAcesso('financeiro', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Financeiro" descricao="Acompanhe suas entradas, metas e lucros com gráficos detalhados." planoMinimo="elite" icone="💰" />
  }

  const { data: pedidos } = await supabase
    .from('gestorPedidos')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Financeiro" subtitulo="Acompanhe suas entradas e lucros" />
      <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 60px' }}>
        <GraficosFinanceiro pedidos={pedidos ?? []} />
      </div>
    </div>
  )
}