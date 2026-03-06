import { createClient } from '@/lib/supabase/server'
import PaginaPlanos from './PaginaPlanos'

export default async function PaginaPlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let planoAtual: string | null = null
  let statusAtual: string | null = null

  if (user) {
    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('plano, status, trial_expira_em')
      .eq('usuario_id', user.id)
      .single()

    if (assinatura) {
      const agora = new Date()
      const trialAtivo = assinatura.trial_expira_em && new Date(assinatura.trial_expira_em) > agora
      const assinaturaAtiva = assinatura.status === 'ativo' || assinatura.status === 'cancelando'

      if (assinaturaAtiva || trialAtivo) {
        planoAtual = assinatura.plano ?? null
      }
      statusAtual = assinatura.status ?? null
    }
  }

  return <PaginaPlanos planoAtual={planoAtual} statusAtual={statusAtual} logado={!!user} />
}