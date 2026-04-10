import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PageHeader from '../componentes/PageHeader'
import CopiarLinkAfiliado from './CopiarLinkAfiliado'

export default async function PaginaAfiliados() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: afiliado } = await admin
    .from('afiliados')
    .select('*')
    .eq('email', user.email)
    .eq('ativo', true)
    .single()

  // Usuário não é afiliado
  if (!afiliado) {
    return (
      <div>
        <PageHeader titulo="Programa de Afiliados" />
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '32px', margin: '0 0 16px' }}>
              {/* star icon inline svg */}
            </p>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#140033', margin: '0 0 12px' }}>
              Voce nao e afiliado ainda
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#666', margin: '0 0 28px', lineHeight: 1.6 }}>
              Entre em contato pelo WhatsApp para fazer parte do nosso programa de afiliados e comecar a ganhar comissoes indicando a Encantiva Pro.
            </p>
            <a
              href="https://wa.me/5521979758341?text=Quero%20me%20tornar%20afiliada%20da%20Encantiva%20Pro"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25d366', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none' }}
            >
              Entrar em contato no WhatsApp
            </a>
          </div>
        </div>
      </div>
    )
  }

  const [
    { data: conversoes },
    { data: cliques },
  ] = await Promise.all([
    admin.from('afiliados_conversoes').select('*').eq('afiliado_id', afiliado.id).order('criado_em', { ascending: false }),
    admin.from('afiliados_cliques').select('id').eq('afiliado_id', afiliado.id),
  ])

  const totalCliques    = cliques?.length ?? 0
  const totalConversoes = conversoes?.length ?? 0
  const totalGanhos     = (conversoes ?? []).filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.comissao), 0)
  const totalPendente   = (conversoes ?? []).filter(c => c.status === 'pending').reduce((acc, c) => acc + Number(c.comissao), 0)
  const taxaConversao   = totalCliques > 0 ? ((totalConversoes / totalCliques) * 100).toFixed(1) : '0.0'

  const temWallet = !!afiliado.asaas_wallet_id
  const link = `encantivapro.com.br/r/${afiliado.codigo}`

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  const stats = [
    { label: 'Cliques no link',  valor: String(totalCliques),           cor: '#9900ff' },
    { label: 'Conversoes',       valor: String(totalConversoes),        cor: '#ff33cc' },
    { label: 'Ganhos pagos',     valor: formatBRL(totalGanhos),         cor: '#00ff88' },
    { label: 'A receber',        valor: formatBRL(totalPendente),       cor: '#ffcc00' },
  ]

  return (
    <div>
      <PageHeader titulo="Programa de Afiliados" />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Card do link */}
        <div style={{ background: 'linear-gradient(135deg, #140033, #2d0060)', borderRadius: '20px', padding: '32px', marginBottom: '24px', border: '1px solid rgba(153,0,255,0.3)' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#ffffff55', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Seu link de afiliada
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#ff33cc', margin: '0 0 20px', wordBreak: 'break-all' }}>
            {link}
          </p>
          <CopiarLinkAfiliado link={`https://${link}`} />
        </div>

        {/* Cards de stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', margin: '0 0 8px' }}>{s.label}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '24px', color: '#140033', margin: 0, letterSpacing: '-0.5px' }}>
                {s.valor}
              </p>
            </div>
          ))}
        </div>

        {/* Card info */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Taxa de conversao</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#140033', margin: 0 }}>{taxaConversao}%</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Comissao</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#140033', margin: 0 }}>{afiliado.comissao_pct}%</p>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', margin: '0 0 4px' }}>Pagamento</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', margin: 0, color: temWallet ? '#00a854' : '#666' }}>
              {temWallet ? 'Automatico via Asaas' : 'Manual via PIX'}
            </p>
          </div>
        </div>

        {/* Histórico */}
        {(conversoes ?? []).length > 0 && (
          <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: 0 }}>
                Historico de comissoes
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {['Data', 'Plano', 'Valor venda', 'Sua comissao', 'Status'].map(h => (
                      <th key={h} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '12px 16px', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(conversoes ?? []).map(cv => (
                    <tr key={cv.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#666' }}>
                        {new Date(cv.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#333', textTransform: 'capitalize' }}>
                        {cv.plano}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#333' }}>
                        {formatBRL(Number(cv.valor_total))}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700, color: cv.status === 'pago' ? '#00a854' : '#f0a500' }}>
                        {formatBRL(Number(cv.comissao))}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: cv.status === 'pago' ? '#00a854' : '#f0a500', background: cv.status === 'pago' ? '#e6f9f0' : '#fff8e6', borderRadius: '6px', padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {cv.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
