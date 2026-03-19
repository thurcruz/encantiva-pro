import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContratoDetalhes from './ContratoDetalhes'

export default async function PaginaContrato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contrato }, { data: perfil }, { data: clientes }] = await Promise.all([
    supabase.from('contratos').select('*').eq('id', id).single(),
    supabase.from('perfis').select('nome_loja, cpf_cnpj, telefone, endereco, assinatura_loja').eq('id', user.id).single(),
    supabase.from('clientes').select('id, nome, telefone, email').eq('usuario_id', user.id).order('nome'),
  ])

  if (!contrato || contrato.usuario_id !== user.id) redirect('/contratos')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '24px 32px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: '#ff33cc', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#111827', margin: 0 }}>
              {contrato.cliente_nome ?? 'Contrato'}
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              {new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {contrato.evento_local ? ` · ${contrato.evento_local}` : ''}
            </p>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 32px 80px' }}>
        <ContratoDetalhes
          contrato={contrato}
          perfil={perfil ?? null}
          usuarioId={user.id}
          clientesIniciais={clientes ?? []}
        />
      </div>
    </div>
  )
}