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

  const [
    { data: pedidosRaw },
    { data: contratos },
    { data: pedidosOrfaosRaw },
    { data: contratosOrfaos },
  ] = await Promise.all([
    // Pedidos já vinculados a este cliente
    supabase
      .from('pedidos')
      .select('id, data_evento, valor_total, status, forma_pagamento, catalogo_temas!left(nome), catalogo_kits!left(nome)')
      .eq('usuario_id', user.id)
      .eq('cliente_id', id)
      .order('data_evento', { ascending: false }),

    // Contratos já vinculados a este cliente
    supabase
      .from('contratos')
      .select('id, evento_data, evento_local, valor_total, status, itens')
      .eq('usuario_id', user.id)
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false }),

    // Pedidos órfãos — mesmo nome, sem cliente_id
    supabase
      .from('pedidos')
      .select('id, nome_cliente, data_evento, valor_total, status')
      .eq('usuario_id', user.id)
      .is('cliente_id', null)
      .ilike('nome_cliente', `%${cliente.nome}%`),

    // Contratos órfãos — mesmo nome, sem cliente_id
    supabase
      .from('contratos')
      .select('id, cliente_nome, evento_data, valor_total, status')
      .eq('usuario_id', user.id)
      .is('cliente_id', null)
      .ilike('cliente_nome', `%${cliente.nome}%`),
  ])

  // Normaliza joins do Supabase (array → objeto)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidos = (pedidosRaw ?? []).map((p: any) => ({
    ...p,
    catalogo_temas: Array.isArray(p.catalogo_temas) ? (p.catalogo_temas[0] ?? null) : p.catalogo_temas,
    catalogo_kits:  Array.isArray(p.catalogo_kits)  ? (p.catalogo_kits[0]  ?? null) : p.catalogo_kits,
  }))

  // Normaliza órfãos de pedidos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidosOrfaos = (pedidosOrfaosRaw ?? []).map((p: any) => ({
    id: p.id,
    nome_cliente: p.nome_cliente,
    data_evento: p.data_evento,
    valor_total: p.valor_total,
    status: p.status,
  }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <PageHeader
        titulo={cliente.nome}
        subtitulo={`Cliente desde ${new Date(cliente.criado_em).toLocaleDateString('pt-BR')}`}
      />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <ClienteDetalhes
          cliente={cliente}
          pedidos={pedidos}
          contratos={contratos ?? []}
          pedidosOrfaos={pedidosOrfaos}
          contratosOrfaos={contratosOrfaos ?? []}
          usuarioId={user.id}
        />
      </div>
    </div>
  )
}