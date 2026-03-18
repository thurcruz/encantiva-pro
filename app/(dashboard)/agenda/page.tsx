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

  if (!temAcesso('eventosPorMes', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Agenda de Festas" descricao="Visualize todos os seus eventos em um calendário organizado. Nunca mais perca um prazo." planoMinimo="avancado" icone="📅" />
  }

  const [{ data: pedidos }, { data: temas }, { data: kits }, { data: clientes }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('*, catalogo_temas(nome), catalogo_kits(nome)')
      .eq('usuario_id', user.id)
      .order('data_evento', { ascending: true }),
    supabase
      .from('catalogo_temas')
      .select('id, nome')
      .eq('usuario_id', user.id)
      .order('nome'),
    supabase
      .from('catalogo_kits')
      .select('id, nome, tema_id')
      .eq('usuario_id', user.id)
      .order('nome'),
    supabase
      .from('clientes')
      .select('id, nome, telefone, email')
      .eq('usuario_id', user.id)
      .order('nome'),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Agenda" subtitulo="Seus eventos organizados por data" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <AgendaCliente
          pedidos={pedidos ?? []}
          usuarioId={user.id}
          temas={temas ?? []}
          kits={kits ?? []}
          clientes={clientes ?? []}
        />
      </div>
    </div>
  )
}