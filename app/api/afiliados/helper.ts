import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Registra uma conversão de afiliado e retorna config de split se o afiliado
 * tiver um asaas_wallet_id configurado.
 */
export async function criarConversaoAfiliado(
  usuarioId: string,
  codigoAfiliado: string,
  plano: string,
  valorTotal: number,
  asaasPaymentId: string
): Promise<{ walletId: string; percentual: number } | null> {
  const supabase = createAdminClient()

  const { data: afiliado } = await supabase
    .from('afiliados')
    .select('id, comissao_pct, asaas_wallet_id')
    .ilike('codigo', codigoAfiliado)
    .eq('ativo', true)
    .single()

  if (!afiliado) return null

  const comissao = (valorTotal * afiliado.comissao_pct) / 100

  await supabase.from('afiliados_conversoes').insert({
    afiliado_id:      afiliado.id,
    usuario_id:       usuarioId,
    plano,
    valor_total:      valorTotal,
    comissao,
    asaas_payment_id: asaasPaymentId,
    status:           'pending',
  })

  if (afiliado.asaas_wallet_id) {
    return { walletId: afiliado.asaas_wallet_id, percentual: afiliado.comissao_pct }
  }

  return null
}

/**
 * Marca como pago a conversão pendente com o payment_id informado.
 */
export async function registrarConversaoAfiliado(
  _usuarioId: string,
  _plano: string,
  _valorTotal: number,
  asaasPaymentId: string
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('afiliados_conversoes')
    .update({ status: 'pago' })
    .eq('asaas_payment_id', asaasPaymentId)
    .eq('status', 'pending')
}
