import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlanoId, getLimites } from '@/lib/planos'
import PageHeader from '../componentes/PageHeader'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import GraficosFinanceiro from './GraficosFinanceiro'

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

  if (!limites.financeiro && !isAdmin && !isBeta) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
        <PageHeader titulo="Financeiro" subtitulo="Controle sua receita e despesas" />
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
          <ModuloBloqueado
            planoMinimo="elite"
            titulo="Financeiro"
            descricao="Controle sua receita, despesas e metas de vendas"
            icone="💰"
          />
        </div>
      </div>
    )
  }

  const [
    { data: pedidos },
    { data: config },
    { data: custosFixos },
    { data: fluxoCaixa },
    { data: pedidosOcultos },
  ] = await Promise.all([
    supabase.from('pedidos').select('id, nome_cliente, valor_total, status, criado_em, data_evento, forma_pagamento').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('financeiro_config').select('*').eq('usuario_id', user.id).single(),
    supabase.from('custos_fixos').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('fluxo_caixa').select('*').eq('usuario_id', user.id).order('data', { ascending: false }),
    supabase.from('fluxo_caixa_pedidos_ocultos').select('id, pedido_id').eq('usuario_id', user.id),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Financeiro" subtitulo="Controle sua receita e despesas" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <GraficosFinanceiro
          pedidos={pedidos ?? []}
          config={config ?? null}
          custosFixos={custosFixos ?? []}
          fluxoCaixa={fluxoCaixa ?? []}
          pedidosOcultos={pedidosOcultos ?? []}
          usuarioId={user.id}
        />
      </div>
    </div>
  )
}