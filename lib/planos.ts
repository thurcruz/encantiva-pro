// lib/planos.ts

export type PlanoId = 'free' | 'trial' | 'iniciante' | 'avancado' | 'elite' | 'admin'

export interface LimitesPlano {
  // Cortador
  cortadorPaineis: boolean

  // Materiais
  downloadMateriais: number | 'ilimitado'

  // Contratos
  contratosPoMes: number | 'ilimitado'
  contratoPersonalizado: boolean

  // Ferramentas básicas
  calculadora: boolean
  salvarKits: boolean
  catalogo: boolean
  adicionarKitsCatalogo: boolean

  // Ferramentas avançadas
  agenda: boolean
  pedidos: boolean
  clientes: boolean
  financeiro: boolean

  // Extras
  comunidade: boolean
  fidelidade: boolean
  checklistMontagem: boolean
  acessoFuncionalidadesNovas: boolean
}

export const LIMITES: Record<PlanoId, LimitesPlano> = {
  free: {
    cortadorPaineis:           true,
    downloadMateriais:         10,
    contratosPoMes:            5,
    contratoPersonalizado:     false,
    calculadora:               false,
    salvarKits:                false,
    catalogo:                  false,
    adicionarKitsCatalogo:     false,
    agenda:                    false,
    pedidos:                   false,
    clientes:                  false,
    financeiro:                false,
    comunidade:                false,
    fidelidade:                false,
    checklistMontagem:         false,
    acessoFuncionalidadesNovas: false,
  },
  trial: {
    cortadorPaineis:           true,
    downloadMateriais:         10,
    contratosPoMes:            5,
    contratoPersonalizado:     false,
    calculadora:               true,
    salvarKits:                false,
    catalogo:                  true,
    adicionarKitsCatalogo:     false,
    agenda:                    true,
    pedidos:                   true,
    clientes:                  true,
    financeiro:                true,
    comunidade:                false,
    fidelidade:                false,
    checklistMontagem:         false,
    acessoFuncionalidadesNovas: false,
  },
  iniciante: {
    cortadorPaineis:           true,
    downloadMateriais:         'ilimitado',
    contratosPoMes:            15,
    contratoPersonalizado:     false,
    calculadora:               true,
    salvarKits:                true,
    catalogo:                  true,
    adicionarKitsCatalogo:     true,
    agenda:                    false,
    pedidos:                   false,
    clientes:                  false,
    financeiro:                false,
    comunidade:                true,
    fidelidade:                false,
    checklistMontagem:         false,
    acessoFuncionalidadesNovas: false,
  },
  avancado: {
    cortadorPaineis:           true,
    downloadMateriais:         'ilimitado',
    contratosPoMes:            'ilimitado',
    contratoPersonalizado:     true,
    calculadora:               true,
    salvarKits:                true,
    catalogo:                  true,
    adicionarKitsCatalogo:     true,
    agenda:                    true,
    pedidos:                   true,
    clientes:                  true,
    financeiro:                false,
    comunidade:                true,
    fidelidade:                false,
    checklistMontagem:         false,
    acessoFuncionalidadesNovas: false,
  },
  elite: {
    cortadorPaineis:           true,
    downloadMateriais:         'ilimitado',
    contratosPoMes:            'ilimitado',
    contratoPersonalizado:     true,
    calculadora:               true,
    salvarKits:                true,
    catalogo:                  true,
    adicionarKitsCatalogo:     true,
    agenda:                    true,
    pedidos:                   true,
    clientes:                  true,
    financeiro:                true,
    comunidade:                true,
    fidelidade:                true,
    checklistMontagem:         true,
    acessoFuncionalidadesNovas: true,
  },
  admin: {
    cortadorPaineis:           true,
    downloadMateriais:         'ilimitado',
    contratosPoMes:            'ilimitado',
    contratoPersonalizado:     true,
    calculadora:               true,
    salvarKits:                true,
    catalogo:                  true,
    adicionarKitsCatalogo:     true,
    agenda:                    true,
    pedidos:                   true,
    clientes:                  true,
    financeiro:                true,
    comunidade:                true,
    fidelidade:                true,
    checklistMontagem:         true,
    acessoFuncionalidadesNovas: true,
  },
}

export function getPlanoId(
  status: string | null,
  plano: string | null,
  trialExpiraEm: string | null,
  isAdmin: boolean,
): PlanoId {
  if (isAdmin) return 'admin'

  const planoNorm = plano?.toLowerCase().trim()

  // Assinatura paga ativa
  if (status === 'active' || status === 'ativo' || status === 'cancelando') {
    if (planoNorm === 'iniciante') return 'iniciante'
    if (planoNorm === 'avancado') return 'avancado'
    if (planoNorm === 'elite') return 'elite'
  }

  // Trial ativo
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > new Date() : false
  if (status === 'trial' && trialAtivo) return 'trial'

  // Free (trial expirado ou sem assinatura)
  return 'free'
}

export function getLimites(planoId: PlanoId): LimitesPlano {
  return LIMITES[planoId] ?? LIMITES.free
}

export function temAcesso(
  feature: keyof LimitesPlano,
  limites: LimitesPlano,
  isBeta: boolean,
  isAdmin: boolean,
): boolean {
  if (isAdmin || isBeta) return true
  const valor = limites[feature]
  if (typeof valor === 'boolean') return valor
  // Para number | 'ilimitado' (downloadMateriais, contratosPoMes) — sempre passa aqui
  // O controle de quantidade fica no contador (implementar depois)
  return true
}

export const NOMES_PLANO: Record<PlanoId, string> = {
  free:      'Gratuito',
  trial:     'Teste grátis',
  iniciante: 'Iniciante',
  avancado:  'Avançado',
  elite:     'Elite',
  admin:     'Admin',
}

export const PLANO_MINIMO: Record<keyof LimitesPlano, PlanoId | null> = {
  cortadorPaineis:            null,
  downloadMateriais:          null,
  contratosPoMes:             null,
  contratoPersonalizado:      'avancado',
  calculadora:                'iniciante',
  salvarKits:                 'iniciante',
  catalogo:                   'iniciante',
  adicionarKitsCatalogo:      'iniciante',
  agenda:                     'avancado',
  pedidos:                    'avancado',
  clientes:                   'avancado',
  financeiro:                 'elite',
  comunidade:                 'iniciante',
  fidelidade:                 'elite',
  checklistMontagem:          'elite',
  acessoFuncionalidadesNovas: 'elite',
}

export const PRECOS: Record<PlanoId, string | null> = {
  free:      null,
  trial:     null,
  iniciante: 'R$ 24,90/mês',
  avancado:  'R$ 54,90/mês',
  elite:     'R$ 94,00/mês',
  admin:     null,
}