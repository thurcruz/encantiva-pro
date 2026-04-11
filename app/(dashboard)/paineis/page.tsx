import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PainelCriador from './PainelCriador'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaPaineis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: paineis },
    { data: likesPaineis },
    { data: likesMateriais },
  ] = await Promise.all([
    supabase.from('paineis').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('paineis_comunidade_likes').select('painel_id').eq('usuario_id', user.id),
    supabase.from('materiais_comunidade_likes').select('material_id').eq('usuario_id', user.id),
  ])

  const likesIniciais        = (likesPaineis ?? []).map((l: { painel_id: string }) => l.painel_id)
  const likesMaterialsIniciais = (likesMateriais ?? []).map((l: { material_id: string }) => l.material_id)

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
          likesIniciais={likesIniciais}
          likesMaterialsIniciais={likesMaterialsIniciais}
        />
      </div>
    </div>
  )
}