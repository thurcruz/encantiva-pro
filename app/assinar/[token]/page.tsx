import { createClient } from '@/lib/supabase/server'
import PaginaAssinar from './PaginaAssinar'

export default async function AssinarContrato({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: contrato } = await supabase
    .from('contratos')
    .select('*')
    .eq('token_assinatura', token)
    .single()

  if (!contrato) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#140033',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>❌</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '20px' }}>
            Contrato não encontrado
          </p>
        </div>
      </div>
    )
  }

  return <PaginaAssinar contrato={contrato} />
}