import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import GerenciarColecoes from './GerenciarColecoes'

export interface ColecaoComContagem {
  id: string
  nome: string
  descricao: string | null
  capa_url: string | null
  ordem: number
  ativo: boolean
  criado_em: string
  total_materiais: number
}

export default async function PaginaColecoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const [
    { data: colecoes },
    { data: relacoes },
  ] = await Promise.all([
    supabase.from('colecoes').select('*').order('ordem').order('nome'),
    supabase.from('materiais_colecoes').select('colecao_id'),
  ])

  const contagemMap: Record<string, number> = {}
  for (const rel of (relacoes ?? [])) {
    contagemMap[rel.colecao_id] = (contagemMap[rel.colecao_id] ?? 0) + 1
  }

  const colecoesComContagem: ColecaoComContagem[] = (colecoes ?? []).map(c => ({
    ...c,
    total_materiais: contagemMap[c.id] ?? 0,
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link href="/admin/materiais"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '13px', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Materiais
        </Link>
        <div style={{ width: '1px', height: '20px', background: '#ffffff18' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              Coleções
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              {colecoesComContagem.length} coleções criadas
            </p>
          </div>
        </div>
      </div>

      <GerenciarColecoes colecoes={colecoesComContagem} />
    </div>
  )
}
