import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioPerfil from './FormularioPerfil'
import CardsSuporteEComunidade from './CardsSuporteEComunidade'
import VagasConfig from './VagasConfig'
import PageHeader from '../componentes/PageHeader'

export default async function PaginaConfiguracoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: perfil }, { data: vagas }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase.from('vagas_dia').select('id, data, vagas_total').eq('usuario_id', user.id).gte('data', new Date().toISOString().split('T')[0]).order('data'),
  ])

  const secaoLabel: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px',
    margin: '0 0 10px 2px',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo="Configurações" subtitulo="Dados da sua loja, vagas e comunidade" />

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 24px 80px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        <section>
          <p style={secaoLabel}>Perfil da loja</p>
          <FormularioPerfil usuarioId={user.id} perfil={perfil} />
        </section>

        <section>
          <p style={secaoLabel}>Agenda e disponibilidade</p>
          <VagasConfig
            usuarioId={user.id}
            vagasPadrao={perfil?.vagas_padrao ?? 3}
            vagasEspecificas={vagas ?? []}
          />
        </section>

        <CardsSuporteEComunidade />

      </div>
    </div>
  )
}