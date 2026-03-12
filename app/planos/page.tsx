import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BotaoAssinarClient from './BotaoAssinarClient'
import { getDiasRestantesTrial } from '@/lib/planos'

const PLANOS = [
  {
    id: 'free',
    nome: 'Grátis',
    preco: null,
    descricao: 'Para quem está começando',
    destaque: false,
    beneficios: [
      'Cortador de painéis',
      'Até 10 materiais/mês',
      'Até 5 contratos/mês',
      'Até 5 eventos na agenda/mês',
    ],
  },
  {
    id: 'iniciante',
    nome: 'Iniciante',
    preco: '19,90',
    descricao: 'Para quem vive de festa',
    destaque: false,
    beneficios: [
      'Tudo do Grátis',
      'Materiais ilimitados',
      'Até 15 contratos/mês',
      'Calculadora de precificação',
      'Salvar kits + catálogo',
      'Comunidade Encantiva',
      'Lançar painéis na comunidade',
    ],
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    preco: '34,90',
    descricao: 'O mais popular ✨',
    destaque: true,
    beneficios: [
      'Tudo do Iniciante',
      'Contratos ilimitados',
      'Lista de clientes',
      'Catálogo inteligente',
      'Gestor de pedidos',
      'Agenda ilimitada',
      'Checklist de pedidos',
    ],
  },
  {
    id: 'elite',
    nome: 'Elite',
    preco: '54,90',
    descricao: 'Para quem quer o máximo',
    destaque: false,
    beneficios: [
      'Tudo do Avançado',
      'Dashboard financeiro',
      'Controle de estoque',
      'Cartão fidelidade',
      'Acesso antecipado a novidades',
    ],
  },
]

export default async function PaginaPlanos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('plano, status, trial_expira_em')
    .eq('usuario_id', user.id)
    .single()

  const planoAtivo = assinatura?.status === 'active' ? assinatura.plano : null
  const isTrial = assinatura?.status === 'trial'
  const diasRestantes = getDiasRestantesTrial(assinatura?.trial_expira_em ?? null)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              Escolha seu plano
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: 14, margin: 0 }}>
              Cancele quando quiser. Sem burocracia.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Banner plano ativo */}
        {planoAtivo && (
          <div style={{
            background: '#e8f5e9', border: '1px solid #a5d6a7',
            borderRadius: 12, padding: '14px 20px', marginBottom: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#2e7d32',
          }}>
            <span>✅ Você já tem o plano <strong>{PLANOS.find(p => p.id === planoAtivo)?.nome}</strong> ativo.</span>
            <Link href="/gerenciar-plano" style={{ color: '#2e7d32', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}>
              Gerenciar
            </Link>
          </div>
        )}

        {/* Banner trial */}
        {isTrial && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,51,204,0.08), rgba(153,0,255,0.08))',
            border: '1px solid rgba(255,51,204,0.2)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#9900ff',
          }}>
            <span>🎉 Você está no <strong>período de teste</strong> — {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}. Assine agora para não perder o acesso!</span>
          </div>
        )}

        {/* Grid de planos */}
        <div className="planos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {PLANOS.map((p) => (
            <div key={p.id} style={{
              background: '#fff',
              border: `2px solid ${p.destaque ? '#ff33cc44' : '#eeeeee'}`,
              borderRadius: 20,
              padding: 24,
              position: 'relative',
              boxShadow: p.destaque ? '0 8px 32px rgba(255,51,204,0.1)' : 'none',
              display: 'flex',
              flexDirection: 'column',
            }}>

              {/* Badge mais popular */}
              {p.destaque && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                  borderRadius: 99, padding: '4px 16px',
                  fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff',
                  whiteSpace: 'nowrap',
                }}>
                  Mais popular
                </div>
              )}

              {/* Nome e descrição */}
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 17, color: '#140033', margin: '0 0 4px 0' }}>
                {p.nome}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: '0 0 16px 0' }}>
                {p.descricao}
              </p>

              {/* Preço */}
              <div style={{ marginBottom: 20 }}>
                {p.preco ? (
                  <>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, color: '#140033' }}>
                      R$ {p.preco}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000055' }}>/mês</span>
                  </>
                ) : (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, color: '#140033' }}>
                    Grátis
                  </span>
                )}
              </div>

              {/* Aviso trial no card Grátis */}
              {p.id === 'free' && isTrial && (
                <div style={{
                  background: 'rgba(255,51,204,0.08)',
                  border: '1px solid rgba(255,51,204,0.2)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: 12,
                  fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#cc0099', fontWeight: 600,
                }}>
                  ⏳ Faltam {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} pro seu teste acabar
                </div>
              )}

              {/* Benefícios */}
              <ul style={{ listStyle: 'none', margin: '0 0 24px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {p.beneficios.map((b) => (
                  <li key={b} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#140033', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#9900ff', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* Botão */}
              {p.id === 'free' ? (
                <div style={{
                  textAlign: 'center', padding: 12,
                  background: '#f5f5f5', borderRadius: 12,
                  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#00000055',
                }}>
                  Plano gratuito
                </div>
              ) : planoAtivo === p.id ? (
                <div style={{
                  textAlign: 'center', padding: 12,
                  background: '#e8f5e9', borderRadius: 12,
                  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#2e7d32',
                }}>
                  ✅ Plano atual
                </div>
              ) : (
                <BotaoAssinarClient planoId={p.id} destaque={p.destaque} />
              )}

            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000033', textAlign: 'center', marginTop: 24 }}>
          Pagamento seguro via Pix ou cartão de crédito • Sem fidelidade • Cancele quando quiser
        </p>
      </div>

      <style>{`
        .page-header { padding: 24px 16px !important; }
        @media (min-width: 640px) { .page-header { padding: 32px 40px !important; } }
        @media (max-width: 900px) { .planos-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .planos-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}