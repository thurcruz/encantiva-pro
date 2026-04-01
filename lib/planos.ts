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

  // Agenda
  eventosPorMes: number | 'ilimitado'

  // Calculadora
  calculadora: boolean
  salvarKits: boolean
  lancarKitsCatalogo: boolean

  // Catálogo
  catalogo: boolean
  catalogoInteligente: boolean
  gestorPedidos: boolean

  // Comunidade
  comunidade: boolean
  lancarPaineisComunidade: boolean

  // Clientes
  listaClientes: boolean          // acesso somente leitura (clientes dos contratos)
  gerenciarClientes: boolean      // adicionar, editar, excluir, vincular

  // Elite
  financeiro: boolean
  controleEstoque: boolean
  cartaoFidelidade: boolean
  acessoAntecipado: boolean
  checklistPedidos: boolean
}

export const LIMITES: Record<PlanoId, LimitesPlano> = {
  free: {
    cortadorPaineis:          true,
    downloadMateriais:        5,
    contratosPoMes:           5,
    contratoPersonalizado:    false,
    eventosPorMes:            5,
    calculadora:              false,
    salvarKits:               false,
    lancarKitsCatalogo:       false,
    catalogo:                 false,
    catalogoInteligente:      false,
    gestorPedidos:            false,
    comunidade:               false,
    lancarPaineisComunidade:  false,
    listaClientes:            true,   // somente leitura
    gerenciarClientes:        false,
    financeiro:               false,
    controleEstoque:          false,
    cartaoFidelidade:         false,
    acessoAntecipado:         false,
    checklistPedidos:         false,
  },
  trial: {
    cortadorPaineis:          true,
    downloadMateriais:        10,
    contratosPoMes:           10,
    contratoPersonalizado:    false,
    eventosPorMes:            10,
    calculadora:              true,
    salvarKits:               true,
    lancarKitsCatalogo:       true,
    catalogo:                 true,
    catalogoInteligente:      true,
    gestorPedidos:            true,
    comunidade:               true,
    lancarPaineisComunidade:  true,
    listaClientes:            true,
    gerenciarClientes:        true,
    financeiro:               true,
    controleEstoque:          true,
    cartaoFidelidade:         true,
    acessoAntecipado:         false,  // exclusivo assinante Elite
    checklistPedidos:         true,
  },
  iniciante: {
    cortadorPaineis:          true,
    downloadMateriais:        'ilimitado',
    contratosPoMes:           10,
    contratoPersonalizado:    false,
    eventosPorMes:            10,
    calculadora:              true,
    salvarKits:               true,
    lancarKitsCatalogo:       false,
    catalogo:                 false,
    catalogoInteligente:      false,
    gestorPedidos:            false,
    comunidade:               true,
    lancarPaineisComunidade:  true,
    listaClientes:            true,   // somente leitura
    gerenciarClientes:        false,
    financeiro:               false,
    controleEstoque:          false,
    cartaoFidelidade:         false,
    acessoAntecipado:         false,
    checklistPedidos:         false,
  },
  avancado: {
    cortadorPaineis:          true,
    downloadMateriais:        'ilimitado',
    contratosPoMes:           'ilimitado',
    contratoPersonalizado:    false,
    eventosPorMes:            'ilimitado',
    calculadora:              true,
    salvarKits:               true,
    lancarKitsCatalogo:       true,
    catalogo:                 true,
    catalogoInteligente:      true,
    gestorPedidos:            true,
    comunidade:               true,
    lancarPaineisComunidade:  true,
    listaClientes:            true,
    gerenciarClientes:        true,
    financeiro:               false,
    controleEstoque:          false,
    cartaoFidelidade:         false,
    acessoAntecipado:         false,
    checklistPedidos:         true,
  },
  elite: {
    cortadorPaineis:          true,
    downloadMateriais:        'ilimitado',
    contratosPoMes:           'ilimitado',
    contratoPersonalizado:    true,
    eventosPorMes:            'ilimitado',
    calculadora:              true,
    salvarKits:               true,
    lancarKitsCatalogo:       true,
    catalogo:                 true,
    catalogoInteligente:      true,
    gestorPedidos:            true,
    comunidade:               true,
    lancarPaineisComunidade:  true,
    listaClientes:            true,
    gerenciarClientes:        true,
    financeiro:               true,
    controleEstoque:          true,
    cartaoFidelidade:         true,
    acessoAntecipado:         true,
    checklistPedidos:         true,
  },
  admin: {
    cortadorPaineis:          true,
    downloadMateriais:        'ilimitado',
    contratosPoMes:           'ilimitado',
    contratoPersonalizado:    true,
    eventosPorMes:            'ilimitado',
    calculadora:              true,
    salvarKits:               true,
    lancarKitsCatalogo:       true,
    catalogo:                 true,
    catalogoInteligente:      true,
    gestorPedidos:            true,
    comunidade:               true,
    lancarPaineisComunidade:  true,
    listaClientes:            true,
    gerenciarClientes:        true,
    financeiro:               true,
    controleEstoque:          true,
    cartaoFidelidade:         true,
    acessoAntecipado:         true,
    checklistPedidos:         true,
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
  if (status === 'active' || status === 'ativo' || status === 'cancelando') {
    if (planoNorm === 'iniciante') return 'iniciante'
    if (planoNorm === 'avancado')  return 'avancado'
    if (planoNorm === 'elite')     return 'elite'
  }
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > new Date() : false
  if (status === 'trial' && trialAtivo) return 'trial'
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
  return true
}

export function getDiasRestantesTrial(trialExpiraEm: string | null): number {
  if (!trialExpiraEm) return 0
  const diff = new Date(trialExpiraEm).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const NOMES_PLANO: Record<PlanoId, string> = {
  free:      'Grátis',
  trial:     'Teste grátis',
  iniciante: 'Iniciante',
  avancado:  'Avançado',
  elite:     'Elite',
  admin:     'Admin',
}

export const PLANO_MINIMO: Record<keyof LimitesPlano, PlanoId | null> = {
  cortadorPaineis:          null,
  downloadMateriais:        null,
  contratosPoMes:           null,
  contratoPersonalizado:    'elite',
  eventosPorMes:            null,
  calculadora:              'iniciante',
  salvarKits:               'iniciante',
  lancarKitsCatalogo:       'avancado',
  catalogo:                 'avancado',
  catalogoInteligente:      'avancado',
  gestorPedidos:            'avancado',
  comunidade:               'iniciante',
  lancarPaineisComunidade:  'iniciante',
  listaClientes:            null,
  gerenciarClientes:        'avancado',
  financeiro:               'elite',
  controleEstoque:          'elite',
  cartaoFidelidade:         'elite',
  acessoAntecipado:         'elite',
  checklistPedidos:         'avancado',
}

export const PRECOS: Record<PlanoId, string | null> = {
  free:      null,
  trial:     null,
  iniciante: 'R$ 19,90/mês',
  avancado:  'R$ 34,90/mês',
  elite:     'R$ 54,90/mês',
  admin:     null,
}