import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import AgendaCliente from './AgendaCliente'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaAgenda() {
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

  if (!temAcesso('agendaFestas', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Agenda de Festas" descricao="Visualize todos os seus eventos em um calendário organizado. Nunca mais perca um prazo." planoMinimo="avancado" icone="📅" />
  }

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, catalogo_temas(nome), catalogo_kits(nome)')
    .eq('usuario_id', user.id)
    .order('data_evento', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader titulo="Agenda" subtitulo="Seus eventos e pedidos organizados por data" />
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <AgendaCliente pedidos={pedidos ?? []} />
      </div>
    </div>
  )
}