import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import BuscaClientes from './BuscaClientes'

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const { busca } = await searchParams
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

  let query = supabase
    .from('clientes')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nome', { ascending: true })

  if (busca) query = query.ilike('nome', `%${busca}%`)

  const { data: clientes } = await query

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
                Clientes
              </h1>
              <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
                {clientes?.length ?? 0} clientes cadastrados
              </p>
            </div>
          </div>
          <Link href="/clientes/novo" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: '12px', padding: '12px 20px',
            color: '#fff', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
          }}>
            <Plus size={16} />
            Novo Cliente
          </Link>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>

        {/* Busca */}
        <BuscaClientes buscaInicial={busca ?? ''} />

        {/* Lista */}
        {clientes && clientes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {clientes.map(cliente => {
              const aniversarioHoje = cliente.data_aniversario
                ? new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) ===
                  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : false

              return (
               <div key={cliente.id} style={{
  background: aniversarioHoje ? 'linear-gradient(135deg, #fff5fd, #fff)' : '#fff',
  border: `1px solid ${aniversarioHoje ? '#ff33cc33' : '#eeeeee'}`,
  borderRadius: '16px', padding: '20px 24px',
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: '16px',
}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)',
                      border: '1px solid #ff33cc22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif', fontWeight: 700,
                      fontSize: '18px', color: '#9900ff',
                    }}>
                      {cliente.nome[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>
                          {cliente.nome}
                        </h3>
                        {aniversarioHoje && (
                          <span style={{ fontSize: '16px' }}>🎂</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {cliente.telefone && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055' }}>
                            📱 {cliente.telefone}
                          </span>
                        )}
                        {cliente.email && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055' }}>
                            ✉️ {cliente.email}
                          </span>
                        )}
                        {cliente.data_aniversario && (
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055' }}>
                            🎂 {new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/clientes/${cliente.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                    borderRadius: '10px', padding: '10px 16px',
                    color: '#fff', fontFamily: 'Inter, sans-serif',
                    fontWeight: 600, fontSize: '13px', textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    Ver perfil
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>👥</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#00000044', marginBottom: '8px' }}>
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            {!busca && (
              <Link href="/clientes/novo" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ff33cc', textDecoration: 'none' }}>
                Cadastrar o primeiro cliente
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}