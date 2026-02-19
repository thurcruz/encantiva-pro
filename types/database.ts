export type Tema = {
  id: string
  nome: string
  slug: string
  url_imagem_capa: string | null
  ativo: boolean
  criado_em: string
}

export type TipoPeca = {
  id: string
  nome: string
  slug: string
  criado_em: string
}

export type Formato = {
  id: string
  nome: string
  criado_em: string
}

export type Material = {
  id: string
  titulo: string
  descricao: string | null
  tema_id: string | null
  tipo_peca_id: string | null
  formato_id: string | null
  url_arquivo: string
  url_imagem_preview: string | null
  total_downloads: number
  premium: boolean
  ativo: boolean
  criado_em: string
  // joins
  temas?: Tema
  tipos_peca?: TipoPeca
  formatos?: Formato
}

export type Assinatura = {
  id: string
  usuario_id: string
  plano: string
  status: 'ativo' | 'expirado' | 'cancelado'
  expira_em: string | null
  criado_em: string
}

export type HistoricoDownload = {
  id: string
  usuario_id: string
  material_id: string
  baixado_em: string
}