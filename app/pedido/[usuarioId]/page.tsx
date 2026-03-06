import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import FluxoPedido from './FluxoPedido'

export default async function PaginaPedido({ params }: { params: { usuarioId: string } }) {
  // Cliente público sem sessão — necessário para página acessada sem login
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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