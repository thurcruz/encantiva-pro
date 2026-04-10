import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function slugCodigo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8)
}

async function verificarAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) return null
  return user
}

// POST — criar afiliado
export async function POST(req: NextRequest) {
  const user = await verificarAdmin(req)
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 403 })

  const { nome, email, codigo, comissao_pct, asaas_wallet_id } = await req.json()

  if (!nome || !email || !codigo) {
    return NextResponse.json({ erro: 'Nome, email e código são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('afiliados')
    .insert({
      nome,
      email,
      codigo: codigo.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
      comissao_pct: comissao_pct ?? 30,
      asaas_wallet_id: asaas_wallet_id || null,
      ativo: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ erro: 'Email ou código já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ afiliado: data })
}

// PATCH — atualizar afiliado (walletId, ativo, comissao_pct)
export async function PATCH(req: NextRequest) {
  const user = await verificarAdmin(req)
  if (!user) return NextResponse.json({ erro: 'Não autorizado' }, { status: 403 })

  const { id, ...campos } = await req.json()
  if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 })

  const permitidos = ['ativo', 'asaas_wallet_id', 'comissao_pct']
  const patch: Record<string, unknown> = {}
  for (const key of permitidos) {
    if (key in campos) patch[key] = campos[key]
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('afiliados')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ afiliado: data })
}
