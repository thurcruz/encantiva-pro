import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Calculadora from './Calculadora'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaCalculadora() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca acervo do usuário (só aparece se tiver itens cadastrados)
  const { data: acervo } = await supabase
    .from('acervo')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Calculadora" subtitulo="Calcule o preço ideal para seus kits" />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 24px 100px' }}>
        <Calculadora acervo={acervo ?? []} />
      </div>
    </div>
  )
}