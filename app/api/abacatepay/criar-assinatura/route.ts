import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, email, nome, taxId } = await req.json()

    if (!planId || !userId || !email) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: perfil } = await supabase
      .from('perfis')
      .select('nome_loja, cpf_cnpj, telefone')
      .eq('id', userId)
      .single()

    const precos: Record<string, number> = {
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_INICIANTE ?? '']: 2490,
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_AVANCADO ?? '']: 5490,
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_ELITE ?? '']: 9400,
    }

    const nomes: Record<string, string> = {
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_INICIANTE ?? '']: 'Plano Iniciante',
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_AVANCADO ?? '']: 'Plano Avançado',
      [process.env.NEXT_PUBLIC_ABACATEPAY_PLAN_ELITE ?? '']: 'Plano Elite',
    }

    const preco = precos[planId]
    const nomePlano = nomes[planId]

    if (!preco) {
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })
    }

    // Garante que o taxId tem só números (sem pontos, traços, barras)
    const taxIdLimpo = (taxId ?? perfil?.cpf_cnpj ?? '').replace(/\D/g, '')

    console.log('[criar-assinatura] taxId recebido:', taxId)
    console.log('[criar-assinatura] taxId do perfil:', perfil?.cpf_cnpj)
    console.log('[criar-assinatura] taxId limpo enviado:', taxIdLimpo)

    if (!taxIdLimpo || (taxIdLimpo.length !== 11 && taxIdLimpo.length !== 14)) {
      return NextResponse.json({ error: 'CPF ou CNPJ inválido. Acesse seu perfil e atualize.' }, { status: 400 })
    }

    const billingRes = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACATEPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        frequency: 'MULTIPLE_PAYMENTS',
        methods: ['PIX'],
        products: [
          {
            externalId: planId,
            name: nomePlano,
            description: `Assinatura mensal ${nomePlano} - Encantiva`,
            quantity: 1,
            price: preco,
          },
        ],
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/planos/sucesso`,
        completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/planos/sucesso`,
        customer: {
          name: perfil?.nome_loja ?? nome,
          email,
          cellphone: (perfil?.telefone ?? '11999999999').replace(/\D/g, ''),
          taxId: taxIdLimpo,
        },
        metadata: { userId },
      }),
    })

    const billingData = await billingRes.json()

    console.log('[criar-assinatura] AbacatePay response:', JSON.stringify(billingData))

    if (!billingRes.ok) {
      console.error('[criar-assinatura] AbacatePay error:', JSON.stringify(billingData))
      return NextResponse.json({ error: JSON.stringify(billingData) }, { status: 500 })
    }

    const checkoutUrl: string =
      billingData.data?.url ??
      billingData.url

    if (!checkoutUrl) {
      console.error('[criar-assinatura] Sem checkoutUrl:', JSON.stringify(billingData))
      return NextResponse.json({ error: 'URL de checkout não retornada.' }, { status: 500 })
    }

    await supabase.from('assinaturas').upsert(
      {
        usuario_id: userId,
        abacatepay_subscription_id: billingData.data?.id ?? null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'usuario_id' }
    )

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('[criar-assinatura] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}