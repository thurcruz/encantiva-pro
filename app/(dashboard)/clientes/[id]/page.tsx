import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '../../componentes/PageHeader'
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

  const [{ data: pedidosRaw }, { data: contratos }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('id, data_evento, valor_total, status, forma_pagamento, catalogo_temas!left(nome), catalogo_kits!left(nome)')
      .eq('usuario_id', user.id)
      .eq('cliente_id', id)
      .order('data_evento', { ascending: false }),
    supabase
      .from('contratos')
      .select('id, evento_data, evento_local, valor_total, status, itens')
      .eq('usuario_id', user.id)
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false }),
  ])

  // Normaliza joins que o Supabase retorna como array para objeto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidos = (pedidosRaw ?? []).map((p: any) => ({
    ...p,
    catalogo_temas: Array.isArray(p.catalogo_temas) ? (p.catalogo_temas[0] ?? null) : p.catalogo_temas,
    catalogo_kits:  Array.isArray(p.catalogo_kits)  ? (p.catalogo_kits[0]  ?? null) : p.catalogo_kits,
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader titulo={cliente.nome} subtitulo={`Cliente desde ${new Date(cliente.criado_em).toLocaleDateString('pt-BR')}`} />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <ClienteDetalhes
          cliente={cliente}
          pedidos={pedidos ?? []}
          contratos={contratos ?? []}
          usuarioId={user.id}
        />
      </div>
    </div>
  )
}