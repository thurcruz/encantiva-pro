import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
import PageHeader from '../componentes/PageHeader'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import ClientesLista from './ClientesLista'

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { busca } = await searchParams
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

  const podeLer       = isAdmin || isBeta || limites.listaClientes
  const podeGerenciar = isAdmin || isBeta || limites.gerenciarClientes

  if (!podeLer) {
    return <ModuloBloqueado titulo="Clientes" descricao="Acompanhe todos os seus clientes em um so lugar." planoMinimo="avancado" icone="👥" planoAtual={planoId} />
  }

  let query = supabase
    .from('clientes')
    .select('id, nome, telefone, email, data_aniversario, criado_em')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  if (busca) query = query.ilike('nome', `%${busca}%`)

  const { data: clientes } = await query

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader
        titulo="Clientes"
        subtitulo={`${clientes?.length ?? 0} cliente${(clientes?.length ?? 0) !== 1 ? 's' : ''} cadastrado${(clientes?.length ?? 0) !== 1 ? 's' : ''}`}
      />

    
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <ClientesLista
          clientes={clientes ?? []}
          usuarioId={user.id}
          buscaInicial={busca ?? ''}
          somenteLeitura={!podeGerenciar}
        />
      </div>
    </div>
  )
}