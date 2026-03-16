import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPlanoId, getLimites } from '@/lib/planos'

// Limites de pedidos por plano
const LIMITES_PEDIDOS: Record<string, number | 'ilimitado'> = {
  free:      0,
  trial:     5,
  iniciante: 'ilimitado',
  avancado:  'ilimitado',
  elite:     'ilimitado',
  admin:     'ilimitado',
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // ── Verificar limite de pedidos do plano ──────────────
    const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!isAdmin) {
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('status, plano, trial_expira_em, is_beta')
        .eq('usuario_id', user.id)
        .single()

      const isBeta = assinatura?.is_beta === true
      const planoId = getPlanoId(
        assinatura?.status ?? null,
        assinatura?.plano ?? null,
        assinatura?.trial_expira_em ?? null,
        isAdmin,
      )

      if (!isBeta) {
        const limite = LIMITES_PEDIDOS[planoId] ?? 0

        if (limite === 0) {
          return NextResponse.json(
            { error: 'limite_atingido', planoMinimo: 'iniciante' },
            { status: 403 }
          )
        }

        if (limite !== 'ilimitado') {
          // Conta pedidos existentes
          const { count } = await supabase
            .from('pedidos')
            .select('id', { count: 'exact', head: true })
            .eq('usuario_id', user.id)

          if ((count ?? 0) >= limite) {
            return NextResponse.json(
              { error: 'limite_atingido', limite, planoMinimo: 'iniciante' },
              { status: 403 }
            )
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────

    const body = await request.json()
    const { nome_cliente, data_evento, valor_total, status, tema_id, kit_id, forma_pagamento, observacoes } = body

    if (!nome_cliente?.trim()) return NextResponse.json({ error: 'Nome do cliente obrigatório' }, { status: 400 })
    if (!data_evento) return NextResponse.json({ error: 'Data do evento obrigatória' }, { status: 400 })
    if (valor_total === undefined || isNaN(Number(valor_total))) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: user.id,
        nome_cliente: nome_cliente.trim(),
        data_evento,
        valor_total: Number(valor_total),
        status: status ?? 'pendente',
        tema_id: tema_id ?? null,
        catalogo_kit_id: kit_id ?? null,
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