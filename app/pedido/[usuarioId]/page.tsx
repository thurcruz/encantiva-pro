import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FluxoPedido from './FluxoPedido'

export default async function PaginaPedido({ params }: { params: { usuarioId: string } }) {
  const supabase = await createClient()

  const [{ data: temas }, { data: kits }, { data: adicionais }] = await Promise.all([
    supabase.from('catalogo_temas').select('*').eq('usuario_id', params.usuarioId).eq('ativo', true),
    supabase.from('catalogo_kits').select('*').eq('usuario_id', params.usuarioId),
    supabase.from('adicionais').select('*').eq('usuario_id', params.usuarioId),
  ])

  if (!temas || temas.length === 0) return notFound()

  return (
    <FluxoPedido
      usuarioId={params.usuarioId}
      temas={temas}
      kits={kits ?? []}
      adicionais={adicionais ?? []}
    />
  )
}