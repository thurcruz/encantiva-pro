import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcervoCliente from './AcervoCliente'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaAcervo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca acervo com variantes
  const { data: acervoRaw } = await supabase
    .from('acervo')
    .select('*, acervo_variantes(*)')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  const acervo = (acervoRaw ?? []).map(item => ({
    ...item,
    variantes: item.acervo_variantes ?? [],
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Acervo" subtitulo="Itens que você possui, com variantes e quantidades" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 100px' }}>
        <AcervoCliente usuarioId={user.id} acervoInicial={acervo} />
      </div>
    </div>
  )
}