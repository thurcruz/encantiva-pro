import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioEditar from './FormularioEditar'

export default async function PaginaEditarMaterial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const [
    { data: material },
    { data: temas },
    { data: tipos },
    { data: formatos },
  ] = await Promise.all([
    supabase.from('materiais').select('*, temas(*), tipos_peca(*), formatos(*)').eq('id', id).single(),
    supabase.from('temas').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
  ])

  if (!material) redirect('/admin/materiais')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{
          width: '4px', height: '32px', borderRadius: '4px',
          background: 'linear-gradient(180deg, #ff33cc, #9900ff)',
          flexShrink: 0,
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
            Editar Material
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
            {material.titulo}
          </p>
        </div>
      </div>

      <FormularioEditar
        material={material}
        temas={temas ?? []}
        tipos={tipos ?? []}
        formatos={formatos ?? []}
      />
    </div>
  )
}