// lib/planos.ts

export type PlanoId = 'free' | 'iniciante' | 'avancado' | 'elite' | 'admin'

export interface LimitesPlano {
  // Painéis
  cortesPoMes: number | 'ilimitado'

  // Iniciante
  bibliotecaMateriais: boolean
  calculadoraPrecificacao: boolean
  criarSalvarKits: boolean
  catalogoKits: boolean

  // Avançado
  enviarKitContrato: boolean
  contratosDigitais: boolean
  listaClientes: boolean
  gestorPedidos: boolean
  agendaFestas: boolean
  configuracaoLoja: boolean

  // Elite
  controleEstoque: boolean
  rastreamentoPecas: boolean
  financeiro: boolean
  dashboardVendas: boolean
  temaMaisVendido: boolean
  cartaoFidelidade: boolean
}

export const LIMITES: Record<PlanoId, LimitesPlano> = {
  free: {
    cortesPoMes: 10,
    bibliotecaMateriais: false,
    calculadoraPrecificacao: false,
    criarSalvarKits: false,
    catalogoKits: false,
    enviarKitContrato: false,
    contratosDigitais: false,
    listaClientes: false,
    gestorPedidos: false,
    agendaFestas: false,
    configuracaoLoja: false,
    controleEstoque: false,
    rastreamentoPecas: false,
    financeiro: false,
    dashboardVendas: false,
    temaMaisVendido: false,
    cartaoFidelidade: false,
  },
  iniciante: {
    cortesPoMes: 'ilimitado',
    bibliotecaMateriais: true,
    calculadoraPrecificacao: true,
    criarSalvarKits: true,
    catalogoKits: true,
    enviarKitContrato: false,
    contratosDigitais: false,
    listaClientes: false,
    gestorPedidos: false,
    agendaFestas: false,
    configuracaoLoja: false,
    controleEstoque: false,
    rastreamentoPecas: false,
    financeiro: false,
    dashboardVendas: false,
    temaMaisVendido: false,
    cartaoFidelidade: false,
  },
  avancado: {
    cortesPoMes: 'ilimitado',
    bibliotecaMateriais: true,
    calculadoraPrecificacao: true,
    criarSalvarKits: true,
    catalogoKits: true,
    enviarKitContrato: true,
    contratosDigitais: true,
    listaClientes: true,
    gestorPedidos: true,
    agendaFestas: true,
    configuracaoLoja: true,
    controleEstoque: false,
    rastreamentoPecas: false,
    financeiro: false,
    dashboardVendas: false,
    temaMaisVendido: false,
    cartaoFidelidade: false,
  },
  elite: {
    cortesPoMes: 'ilimitado',
    bibliotecaMateriais: true,
    calculadoraPrecificacao: true,
    criarSalvarKits: true,
    catalogoKits: true,
    enviarKitContrato: true,
    contratosDigitais: true,
    listaClientes: true,
    gestorPedidos: true,
    agendaFestas: true,
    configuracaoLoja: true,
    controleEstoque: true,
    rastreamentoPecas: true,
    financeiro: true,
    dashboardVendas: true,
    temaMaisVendido: true,
    cartaoFidelidade: true,
  },
  admin: {
    cortesPoMes: 'ilimitado',
    bibliotecaMateriais: true,
    calculadoraPrecificacao: true,
    criarSalvarKits: true,
    catalogoKits: true,
    enviarKitContrato: true,
    contratosDigitais: true,
    listaClientes: true,
    gestorPedidos: true,
    agendaFestas: true,
    configuracaoLoja: true,
    controleEstoque: true,
    rastreamentoPecas: true,
    financeiro: true,
    dashboardVendas: true,
    temaMaisVendido: true,
    cartaoFidelidade: true,
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
  if (status === 'ativo' || status === 'cancelando') {
    if (planoNorm === 'iniciante') return 'iniciante'
    if (planoNorm === 'avancado') return 'avancado'
    if (planoNorm === 'elite') return 'elite'
  }
  // Trial expirado ou sem plano = free
  const trialAtivo = trialExpiraEm ? new Date(trialExpiraEm) > new Date() : false
  if (trialAtivo) return 'free' // trial tem os mesmos limites do free
  return 'free'
}

export function getLimites(planoId: PlanoId): LimitesPlano {
  return LIMITES[planoId] ?? LIMITES.free
}

export const NOMES_PLANO: Record<PlanoId, string> = {
  free: 'Gratuito',
  iniciante: 'Iniciante',
  avancado: 'Avançado',
  elite: 'Elite',
  admin: 'Admin',
}

// Qual plano mínimo libera cada feature (para o popup de upgrade)
export const PLANO_MINIMO: Record<keyof LimitesPlano, PlanoId | null> = {
  cortesPoMes: null, // sempre disponível
  bibliotecaMateriais: 'iniciante',
  calculadoraPrecificacao: 'iniciante',
  criarSalvarKits: 'iniciante',
  catalogoKits: 'iniciante',
  enviarKitContrato: 'avancado',
  contratosDigitais: 'avancado',
  listaClientes: 'avancado',
  gestorPedidos: 'avancado',
  agendaFestas: 'avancado',
  configuracaoLoja: 'avancado',
  controleEstoque: 'elite',
  rastreamentoPecas: 'elite',
  financeiro: 'elite',
  dashboardVendas: 'elite',
  temaMaisVendido: 'elite',
  cartaoFidelidade: 'elite',
}

export const PRECOS: Record<PlanoId, string | null> = {
  free: null,
  iniciante: 'R$ 24,90/mês',
  avancado: 'R$ 54,90/mês',
  elite: 'R$ 94,00/mês',
  admin: null,
}