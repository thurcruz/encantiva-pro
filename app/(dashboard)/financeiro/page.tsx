import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
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
    .select('status, plano, trial_expira_em')
    .eq('usuario_id', user.id)
    .single()

  const planoId = getPlanoId(assinatura?.status ?? null, assinatura?.plano ?? null, assinatura?.trial_expira_em ?? null, isAdmin)
  const limites = getLimites(planoId)

  if (!limites.financeiro) {
    return <ModuloBloqueado titulo="Financeiro" descricao="Acompanhe suas entradas, metas e lucros com gráficos detalhados." planoMinimo="elite" icone="💰" />
  }

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader titulo="Financeiro" subtitulo="Acompanhe suas entradas e lucros" />
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <GraficosFinanceiro pedidos={pedidos ?? []} />
      </div>
    </div>
  )
}