import { createClient } from '@supabase/supabase-js'
import FluxoPedido from './FluxoPedido'

export default async function PaginaPedido({ params }: { params: Promise<{ usuarioId: string }> }) {
  const { usuarioId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: temas }, { data: kits }, { data: adicionais }, { data: perfil }] = await Promise.all([
    supabase.from('catalogo_temas').select('*').eq('usuario_id', usuarioId).eq('ativo', true).order('nome'),
    supabase.from('catalogo_kits').select('*').eq('usuario_id', usuarioId).order('nome'),
    supabase.from('adicionais').select('*').eq('usuario_id', usuarioId).order('nome'),
    supabase.from('perfis').select('nome_loja, telefone').eq('id', usuarioId).single(),
  ])

  return (
    <FluxoPedido
      usuarioId={usuarioId}
      temas={temas ?? []}
      kits={kits ?? []}
      adicionais={adicionais ?? []}
      nomeLoja={perfil?.nome_loja ?? null}
      telefone={perfil?.telefone ?? null}
    />
  )
}