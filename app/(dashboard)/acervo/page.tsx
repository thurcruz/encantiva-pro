import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcervoCliente from './AcervoCliente'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaAcervo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: acervo, error } = await supabase
    .from('acervo')
    .select('id, usuario_id, nome, custo, unidade, foto_url')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  if (error) console.error('[Acervo] erro ao buscar:', error.message)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Acervo" subtitulo="Itens que você possui para montar seus kits e orçamentos" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 100px' }}>
        <AcervoCliente usuarioId={user.id} acervoInicial={acervo ?? []} />
      </div>
    </div>
  )
}