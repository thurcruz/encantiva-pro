import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import BuscaClientes from './BuscaClientes'
import BannerBeta from '../componentes/BannerBeta'

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { busca } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, plano, trial_expira_em, is_beta')
    .eq('usuario_id', user.id)
    .single()

  const agora = new Date()
  const isBeta = assinatura?.is_beta === true
  const trialAtivo = assinatura?.status === 'trial' &&
    !!(assinatura?.trial_expira_em && new Date(assinatura.trial_expira_em) > agora)
  const assinaturaAtiva = isAdmin || isBeta || trialAtivo || assinatura?.status === 'active'

  if (!assinaturaAtiva) redirect('/materiais')

  let query = supabase
    .from('listaClientes')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  if (busca) query = query.ilike('nome', `%${busca}%`)

  const { data: clientes } = await query

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>

      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid #e8e8ec', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: '#ff33cc' }} />
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#111827', letterSpacing: '-0.5px', margin: 0 }}>
                Clientes
              </h1>
              <p style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', margin: 0 }}>
                {clientes?.length ?? 0} clientes cadastrados
              </p>
            </div>
          </div>
          <Link href="/clientes/novo" style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: '#ff33cc', borderRadius: '999px', padding: '10px 18px',
            color: '#fff', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, fontSize: '13px', textDecoration: 'none',
          }}>
            <Plus size={14} />
            Novo Cliente
          </Link>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 40px 80px' }}>

        {/* Banner beta */}
        <BannerBeta />

        <BuscaClientes buscaInicial={busca ?? ''} />

        {clientes && clientes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {clientes.map(cliente => {
              const aniversarioHoje = cliente.data_aniversario
                ? new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) ===
                  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : false

              return (
                <div key={cliente.id} style={{
                  background: aniversarioHoje ? '#fff5fd' : '#fff',
                  border: `1px solid ${aniversarioHoje ? '#ffd6f5' : '#e8e8ec'}`,
                  borderRadius: '14px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '999px', flexShrink: 0,
                      background: '#fff0fb', border: '1px solid #ffd6f5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif', fontWeight: 800,
                      fontSize: '16px', color: '#ff33cc',
                    }}>
                      {cliente.nome[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cliente.nome}
                        </p>
                        {aniversarioHoje && <span style={{ fontSize: '14px' }}>🎂</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {cliente.telefone && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>{cliente.telefone}</span>
                        )}
                        {cliente.email && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>{cliente.email}</span>
                        )}
                        {cliente.data_aniversario && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>
                            {new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/clientes/${cliente.id}`} style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: 'transparent', border: '1.5px solid #ff33cc',
                    borderRadius: '999px', padding: '7px 14px',
                    color: '#ff33cc', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    Ver perfil
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#374151', margin: '0 0 8px' }}>
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            {!busca && (
              <Link href="/clientes/novo" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', textDecoration: 'none', fontWeight: 600 }}>
                Cadastrar o primeiro cliente →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}