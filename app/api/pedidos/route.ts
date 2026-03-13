import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome_cliente, data_evento, valor_total, status, tema_id, kit_id, forma_pagamento, observacoes } = body

    if (!nome_cliente?.trim()) return NextResponse.json({ error: 'Nome do cliente obrigatório' }, { status: 400 })
    if (!data_evento) return NextResponse.json({ error: 'Data do evento obrigatória' }, { status: 400 })
    if (valor_total === undefined || isNaN(Number(valor_total))) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: user.id,          // sempre da sessão, nunca do body
        nome_cliente: nome_cliente.trim(),
        data_evento,
        valor_total: Number(valor_total),
        status: status ?? 'pendente',
        tema_id: tema_id ?? null,
        kit_id: kit_id ?? null,
        forma_pagamento: forma_pagamento ?? null,
        observacoes: observacoes ?? null,
      })
      .select('*, catalogo_temas(nome), catalogo_kits(nome)')
      .single()

    if (error) {
      console.error('[POST /api/pedidos]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pedidos] erro inesperado', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('pedidos')
      .select('*, catalogo_temas(nome), catalogo_kits(nome)')
      .eq('usuario_id', user.id)
      .order('data_evento', { ascending: true })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/pedidos]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}