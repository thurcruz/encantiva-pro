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
    supabase.from('gestorPedidos').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <style>{`
        .catalogo-wrapper {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 24px 100px 24px;
        }
        /* Grid 2 colunas no formulário (nome + categoria / nome + preço) */
        .cat-grid-2 {
          grid-template-columns: 1fr 1fr;
        }
        /* Grid de temas: 3 colunas no desktop, 2 no tablet, 1 no mobile */
        .cat-temas-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 900px) {
          .cat-temas-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .catalogo-wrapper {
            padding: 16px 16px 100px 16px;
          }
          .cat-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .cat-temas-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 380px) {
          .cat-temas-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <PageHeader titulo="Catálogo & Pedidos" subtitulo="Monte seu catálogo e receba pedidos pelo WhatsApp" />

      <div className="catalogo-wrapper">
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