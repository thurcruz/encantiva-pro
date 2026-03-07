import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PainelCriador from './PainelCriador'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaPaineis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: paineis } = await supabase
    .from('paineis')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <PageHeader
        titulo="Criador de Painéis"
        subtitulo="Transforme sua imagem em um painel 50×50cm pronto para imprimir"
        maxWidth="900px"
      />
      <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 40px' }}>
        <PainelCriador
          usuarioId={user.id}
          paineis={paineis ?? []}
          isAssinante={true}
        />
      </div>
    </div>
  )
}