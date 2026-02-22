import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioMaterial from '../componentes/FormularioMaterial'

export default async function PaginaNovoMaterial() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const [
    { data: temas },
    { data: tipos },
    { data: formatos },
    { data: categorias },
  ] = await Promise.all([
    supabase.from('temas').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
    supabase.from('categorias').select('*').eq('ativo', true).order('nome'),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>
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
            Novo Material
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
            Faça o upload de um novo material para download
          </p>
        </div>
      </div>

      <FormularioMaterial
        temas={temas ?? []}
        tipos={tipos ?? []}
        formatos={formatos ?? []}
        categorias={categorias ?? []}
      />
    </div>
  )
}