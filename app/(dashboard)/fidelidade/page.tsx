import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '../componentes/PageHeader'
import ModuloBloqueado from '../../components/ModuloBloqueado'
import FidelidadeManager from './FidelidadeManager'

const BETA_EMAILS = ['encantivafestas@gmail.com']

export default async function PaginaFidelidade() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isBeta = BETA_EMAILS.includes(user.email ?? '')

  if (!isAdmin && !isBeta) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
        <PageHeader titulo="Fidelidade" subtitulo="Cartoes de fidelidade para suas clientes" />
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
          <ModuloBloqueado
            titulo="Cartao Fidelidade"
            descricao="Crie cartoes de fidelidade virtuais para suas clientes acumularem pontos e ganharem premios."
            planoMinimo="elite"
            icone="🎁"
          />
        </div>
      </div>
    )
  }

  const [{ data: cartoes }, { data: participantes }] = await Promise.all([
    supabase.from('fidelidade_cartoes').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
    supabase.from('fidelidade_clientes').select('*, fidelidade_cartoes(nome)').eq('usuario_id', user.id).order('criado_em', { ascending: false }),
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Fidelidade" subtitulo="Cartoes de fidelidade para suas clientes" />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <FidelidadeManager
          usuarioId={user.id}
          cartoesIniciais={cartoes ?? []}
          participantesIniciais={participantes ?? []}
        />
      </div>
    </div>
  )
}