import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FluxoPedido from './FluxoPedido'

export default async function PaginaPedido({ params }: { params: Promise<{ usuarioId: string }> }) {
  const { usuarioId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: temas }, { data: kits }, { data: adicionais }] = await Promise.all([
    supabase.from('catalogo_temas').select('*').eq('usuario_id', usuarioId).eq('ativo', true),
    supabase.from('catalogo_kits').select('*').eq('usuario_id', usuarioId),
    supabase.from('adicionais').select('*').eq('usuario_id', usuarioId),
  ])

  // Só retorna 404 se não tiver nenhum tema
if (!temas || temas.length === 0) return notFound()
    
  return (
    <FluxoPedido
      usuarioId={usuarioId}
      temas={temas}
      kits={kits ?? []}
      adicionais={adicionais ?? []}
    />
  )
}