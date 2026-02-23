import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormularioPerfil from './FormularioPerfil'

export default async function PaginaConfiguracoes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Configurações
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Dados da sua loja para contratos
            </p>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 40px' }}>
        <FormularioPerfil usuarioId={user.id} perfil={perfil} />
      </div>
    </div>
  )
}