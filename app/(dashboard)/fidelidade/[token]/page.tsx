import { createClient } from '@/lib/supabase/server'
import PaginaFidelidadeCliente from './PaginaFidelidadeCliente'

export default async function FidelidadePublica({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: cartao } = await supabase
    .from('fidelidade_cartoes')
    .select('*')
    .eq('id', token)
    .eq('ativo', true)
    .single()

  if (!cartao) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎁</p>
          <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', margin: '0 0 8px' }}>Cartao nao encontrado</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#9ca3af', margin: 0 }}>Este cartao nao existe ou foi desativado.</p>
        </div>
      </div>
    )
  }

  return <PaginaFidelidadeCliente cartao={cartao} />
}