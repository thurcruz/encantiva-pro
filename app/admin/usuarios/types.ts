export interface Assinatura {
  id: string
  usuario_id?: string
  plano: string
  status: string
  expira_em: string | null
  trial_expira_em: string | null
  is_beta: boolean
  asaas_subscription_id: string | null
  asaas_customer_id: string | null
  criado_em: string
  atualizado_em?: string
}

export interface Usuario {
  id: string
  email: string
  nome_loja?: string | null
  criado_em: string
  assinaturas: Assinatura[]
}