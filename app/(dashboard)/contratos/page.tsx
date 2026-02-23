import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'

export default async function PaginaContratos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('status, expira_em')
    .eq('usuario_id', user.id)
    .single()

  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const assinaturaAtiva =
    isAdmin ||
    (assinatura?.status === 'ativo' &&
    (!assinatura.expira_em || new Date(assinatura.expira_em) > new Date()))

  if (!assinaturaAtiva) redirect('/materiais')

  const [{ data: contratos }, { data: perfil }] = await Promise.all([
    supabase.from('contratos').select('*').order('criado_em', { ascending: false }),
    supabase.from('perfis').select('*').eq('id', user.id).single(),
  ])

  const perfilIncompleto = !perfil?.nome_loja || !perfil?.cpf_cnpj || !perfil?.telefone

  const badgeStatus = (status: string) => {
    const map: Record<string, { label: string; cor: string; bg: string }> = {
      pendente: { label: 'Pendente', cor: '#cc8800', bg: '#fff8e6' },
      assinado: { label: 'Assinado', cor: '#00aa55', bg: '#e6fff2' },
      cancelado: { label: 'Cancelado', cor: '#cc0000', bg: '#fff0f0' },
    }
    return map[status] ?? map.pendente
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
                Contratos
              </h1>
              <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
                {contratos?.length ?? 0} contratos gerados
              </p>
            </div>
          </div>
          <Link href="/contratos/novo" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: '12px', padding: '12px 20px',
            color: '#fff', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
          }}>
            <Plus size={16} />
            Novo Contrato
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>

        {/* Aviso perfil incompleto */}
        {perfilIncompleto && (
          <div style={{
            background: '#fff8f0',
            border: '1px solid #ff33cc33',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={18} style={{ color: '#ff33cc', flexShrink: 0 }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', margin: 0 }}>
                <strong>Dados da loja incompletos.</strong> Preencha para que apareçam nos contratos.
              </p>
            </div>
            <Link href="/configuracoes" style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
              color: '#ff33cc', border: '1px solid #ff33cc55',
              borderRadius: '8px', padding: '8px 16px',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Ir para configurações
            </Link>
          </div>
        )}

        {/* Lista de contratos */}
        {contratos && contratos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contratos.map(contrato => {
              const badge = badgeStatus(contrato.status)
              return (
                <div key={contrato.id} style={{
                  background: '#fff',
                  border: '1px solid #eeeeee',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: 0 }}>
                        {contrato.cliente_nome || 'Cliente não preenchido'}
                      </h3>
                      <span style={{
                        background: badge.bg, color: badge.cor,
                        fontFamily: 'Inter, sans-serif', fontWeight: 700,
                        fontSize: '11px', padding: '3px 10px', borderRadius: '100px',
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>
                      📅 {new Date(contrato.evento_data).toLocaleDateString('pt-BR')}
                      {contrato.evento_local && ` · 📍 ${contrato.evento_local}`}
                      {` · 💰 R$ ${Number(contrato.valor_total).toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                  <Link href={`/contratos/${contrato.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                    borderRadius: '10px', padding: '10px 16px',
                    color: '#fff', fontFamily: 'Inter, sans-serif',
                    fontWeight: 600, fontSize: '13px', textDecoration: 'none',
                  }}>
                    Ver contrato
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#00000044', marginBottom: '8px' }}>
              Nenhum contrato ainda
            </p>
            <Link href="/contratos/novo" style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              color: '#ff33cc', textDecoration: 'none',
            }}>
              Criar o primeiro contrato
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}