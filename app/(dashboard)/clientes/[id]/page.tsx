import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClienteDetalhes from './ClienteDetalhes'

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (!cliente) redirect('/clientes')

  // Busca contratos do cliente pelo nome
  const { data: contratos } = await supabase
    .from('contratos')
    .select('*')
    .eq('usuario_id', user.id)
    .ilike('cliente_nome', `%${cliente.nome}%`)
    .order('criado_em', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              {cliente.nome}
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Cliente desde {new Date(cliente.criado_em).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
      <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 40px' }}>
        <ClienteDetalhes cliente={cliente} contratos={contratos ?? []} usuarioId={user.id} />
      </div>
    </div>
  )
}