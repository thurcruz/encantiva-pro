import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TabelaUsuarios from './TabelaUsuarios'

export default async function PaginaUsuarios() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) redirect('/login')

  const admin = createAdminClient()

  // Busca todos os usuários do auth
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })

  // Busca todas as assinaturas
  const { data: assinaturas } = await supabase
    .from('assinaturas')
    .select('*')
    .order('criado_em', { ascending: false })

  // Busca perfis para nome da loja
  const { data: perfis } = await supabase
    .from('perfis')
    .select('id, nome_loja')

  // Monta lista combinada
  const lista = (authUsers?.users ?? []).map(u => {
    const assinatura = assinaturas?.filter(a => a.usuario_id === u.id) ?? []
    const perfil = perfis?.find(p => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? u.id,
      nome_loja: perfil?.nome_loja ?? null,
      criado_em: u.created_at,
      assinaturas: assinatura,
    }
  }).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())

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
              {lista.length} cadastrados
            </p>
          </div>
        </div>
        <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '8px 16px', color: '#ffffff88', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          ← Painel Admin
        </a>
      </div>

      <TabelaUsuarios usuarios={lista as never} />
    </div>
  )
}