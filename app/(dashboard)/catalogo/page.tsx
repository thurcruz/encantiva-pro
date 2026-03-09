import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites, temAcesso } from '@/lib/planos'
import CatalogoManager from './CatalogoManager'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaCatalogo() {
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

  if (!temAcesso('gestorPedidos', limites, isBeta, isAdmin)) {
    return <ModuloBloqueado titulo="Catálogo & Pedidos" descricao="Monte seu catálogo de temas e kits e receba pedidos pelo WhatsApp." planoMinimo="avancado" icone="🛍️" />
  }

  const [{ data: temas }, { data: kits }, { data: adicionais }, { data: pedidos }] = await Promise.all([
    supabase.from('catalogo_temas').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('catalogo_kits').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('adicionais').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('pedidos').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader titulo="Catálogo & Pedidos" subtitulo="Monte seu catálogo e receba pedidos pelo WhatsApp" />
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <CatalogoManager
          usuarioId={user.id}
          temasIniciais={temas ?? []}
          kitsIniciais={kits ?? []}
          adicionaisIniciais={adicionais ?? []}
          pedidosIniciais={pedidos ?? []}
        />
      </div>
    </div>
  )
}