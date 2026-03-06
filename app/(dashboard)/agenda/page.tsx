import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgendaCliente from './AgendaCliente'

export default async function PaginaAgenda() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, catalogo_temas(nome), catalogo_kits(nome)')
    .eq('usuario_id', user.id)
    .order('data_evento', { ascending: true })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Agenda
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Seus eventos e pedidos organizados por data
            </p>
          </div>
        </div>
      </div>
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <AgendaCliente pedidos={pedidos ?? []} />
      </div>
    </div>
  )
}