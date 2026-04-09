import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Layers } from 'lucide-react'
import TabelaMateriais from './componentes/TabelaMateriais'
import type { Material } from '@/types/database'

export default async function PaginaListaMateriais() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const [
    { data: materiais },
    { data: matColecoes },
    { data: colecoes },
  ] = await Promise.all([
    supabase.from('materiais').select('*, temas(*), tipos_peca(*), formatos(*)').eq('ativo', true).order('criado_em', { ascending: false }),
    supabase.from('materiais_colecoes').select('material_id, colecao_id, colecoes(id, nome)'),
    supabase.from('colecoes').select('id, nome').eq('ativo', true).order('nome'),
  ])

  // Build map: material_id -> colecoes[]
  const colecoesPorMaterial: Record<string, { id: string; nome: string }[]> = {}
  for (const rel of (matColecoes ?? [])) {
    const c = (rel as unknown as { material_id: string; colecao_id: string; colecoes: { id: string; nome: string } | null }).colecoes
    if (c) {
      if (!colecoesPorMaterial[rel.material_id]) colecoesPorMaterial[rel.material_id] = []
      colecoesPorMaterial[rel.material_id].push(c)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              Materiais
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              {materiais?.length ?? 0} materiais cadastrados
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/admin/colecoes" style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '12px', padding: '11px 18px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
            <Layers size={15} />
            Gerenciar coleções
          </Link>
          <Link href="/admin/materiais/novo" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '12px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
            <Plus size={16} />
            Novo Material
          </Link>
        </div>
      </div>

      <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', overflow: 'hidden' }}>
        {materiais && materiais.length > 0 ? (
          <TabelaMateriais
            materiais={materiais as unknown as Material[]}
            colecoesPorMaterial={colecoesPorMaterial}
            todasColecoes={(colecoes ?? []) as { id: string; nome: string }[]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>📦</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#ffffff44', marginBottom: '8px' }}>
              Nenhum material cadastrado ainda
            </p>
            <Link href="/admin/materiais/novo" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ff33cc', textDecoration: 'none' }}>
              Adicionar o primeiro
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}