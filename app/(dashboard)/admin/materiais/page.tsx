import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import TabelaMateriais from './componentes/TabelaMateriais'
import type { Material } from '@/types/database'

export default async function PaginaListaMateriais() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const { data: materiais } = await supabase
    .from('materiais')
    .select('*, temas(*), tipos_peca(*), formatos(*)')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '4px', height: '32px', borderRadius: '4px',
            background: 'linear-gradient(180deg, #ff33cc, #9900ff)',
          }} />
          <div>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '28px',
              color: '#fff',
              letterSpacing: '-1px',
              margin: 0,
            }}>
              Materiais
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              {materiais?.length ?? 0} materiais cadastrados
            </p>
          </div>
        </div>

        <Link href="/admin/materiais/novo" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
          borderRadius: '12px',
          padding: '12px 20px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: '14px',
          textDecoration: 'none',
        }}>
          <Plus size={16} />
          Novo Material
        </Link>
      </div>

      {/* Tabela */}
      <div style={{
        background: '#ffffff08',
        border: '1px solid #ffffff12',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {materiais && materiais.length > 0 ? (
          <TabelaMateriais materiais={materiais as unknown as Material[]} />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>📦</p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: '16px',
              color: '#ffffff44',
              marginBottom: '8px',
            }}>
              Nenhum material cadastrado ainda
            </p>
            <Link href="/admin/materiais/novo" style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#ff33cc',
              textDecoration: 'none',
            }}>
              Adicionar o primeiro
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}