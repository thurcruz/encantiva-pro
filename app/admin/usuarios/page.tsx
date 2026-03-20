import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TabelaUsuarios from './TabelaUsuarios'

export default async function PaginaUsuarios() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const { data: usuarios } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      role,
      criado_em,
      assinaturas (
        id,
        plano,
        status,
        expira_em,
        trial_expira_em,
        is_beta,
        asaas_subscription_id,
        asaas_customer_id,
        criado_em,
        atualizado_em
      )
    `)
    .order('criado_em', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#140033', padding: '40px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              Usuários
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff55', margin: 0 }}>
              {usuarios?.length ?? 0} cadastrados
            </p>
          </div>
        </div>
        <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '8px 16px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          ← Painel Admin
        </a>
      </div>

      <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', overflow: 'hidden' }}>
        <TabelaUsuarios usuarios={(usuarios ?? []) as never} />
      </div>
    </div>
  )
}