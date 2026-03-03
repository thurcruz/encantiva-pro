import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PainelCriador from './PainelCriador'

export default async function PaginaPaineis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, expira_em, trial_expira_em')
    .eq('usuario_id', user.id)
    .single()

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const agora = new Date()
  const trialAtivo = assinatura?.trial_expira_em
    ? new Date(assinatura.trial_expira_em) > agora : false
  const assinaturaAtiva = isAdmin || trialAtivo ||
    (assinatura?.status === 'ativo' && (!assinatura.expira_em || new Date(assinatura.expira_em) > agora))

  if (!assinaturaAtiva) redirect('/materiais')

  const { data: paineis } = await supabase
    .from('paineis')
    .select('*')
    .eq('usuario_id', user.id)
    .order('criado_em', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Criador de Painéis
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              Transforme sua imagem em um painel 50×50cm pronto para imprimir
            </p>
          </div>
        </div>
      </div>
      <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 40px' }}>
        <PainelCriador usuarioId={user.id} paineis={paineis ?? []} />
      </div>
    </div>
  )
}