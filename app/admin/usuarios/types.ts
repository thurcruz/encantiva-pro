export interface Assinatura {
  id: string
  usuario_id: string
  status: string | null
  plano: string | null
  expira_em: string | null
  trial_expira_em: string | null
  is_beta: boolean
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  abacatepay_subscription_id?: string | null
  criado_em: string
}

export interface Usuario {
  id: string
  email: string
  nome_loja: string | null
  telefone: string | null
  criado_em: string
  assinaturas: Assinatura[]
}