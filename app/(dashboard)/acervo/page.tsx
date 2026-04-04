import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
import AcervoCliente from './AcervoCliente'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaAcervo() {
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

  if (!limites.controleEstoque && !isBeta && !isAdmin) {
    return (
      <ModuloBloqueado
        titulo="Acervo"
        descricao="Controle os itens que você possui para montar kits e orçamentos."
        planoMinimo="elite"
        icone="📦"
        planoAtual={planoId}
      />
    )
  }

  const { data: acervo, error } = await supabase
    .from('acervo')
    .select('id, usuario_id, nome, custo, unidade, foto_url')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  if (error) console.error('[Acervo] erro ao buscar:', error.message)

  const acervoIds = (acervo ?? []).map(i => i.id)
  const { data: variacoesData } = acervoIds.length > 0
    ? await supabase.from('acervo_variacoes').select('*').in('acervo_id', acervoIds).order('criado_em', { ascending: true })
    : { data: [] }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Acervo" subtitulo="Itens que você possui para montar seus kits e orçamentos" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 100px' }}>
        <AcervoCliente usuarioId={user.id} acervoInicial={acervo ?? []} variacoesIniciais={variacoesData ?? []} />
      </div>
    </div>
  )
}