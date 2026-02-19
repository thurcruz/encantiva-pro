import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioMaterial from '../componentes/FormularioMaterial'

export default async function PaginaNovoMaterial() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/materiais')

  const [{ data: temas }, { data: tipos }, { data: formatos }] = await Promise.all([
    supabase.from('temas').select('*').eq('ativo', true).order('nome'),
    supabase.from('tipos_peca').select('*').order('nome'),
    supabase.from('formatos').select('*').order('nome'),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Novo Material</h1>
        <p className="text-gray-500 mt-1">Faça o upload de um novo material para download</p>
      </div>

      <FormularioMaterial
        temas={temas ?? []}
        tipos={tipos ?? []}
        formatos={formatos ?? []}
      />
    </div>
  )
}