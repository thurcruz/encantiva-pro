import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import BotaoAssinarClient from './BotaoAssinarClient'
import BotaoAssinarPublico from './BotaoAssinarPublico'
import { getDiasRestantesTrial } from '@/lib/planos'

export const dynamic = 'force-dynamic'

function CheckIcon({ cor }: { cor: string }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <circle cx="7" cy="7" r="7" fill={cor} fillOpacity="0.12" />
      <path d="M4.5 7l2 2 3-3" stroke={cor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PLANOS = [
  {
    id: 'free',
    nome: 'Grátis',
    preco: null,
    descricao: 'Para começar',
    destaque: false,
    beneficios: [
      'Cortador de painéis',
      '5 materiais por mês',
      '5 contratos por mês',
      '5 eventos na agenda por mês',
      'Lista de clientes (somente leitura)',
    ],
  },
  {
    id: 'iniciante',
    nome: 'Iniciante',
    preco: '19,90',
    descricao: 'Para quem vive de festa',
    destaque: false,
    beneficios: [
      'Tudo do Plano Grátis',
      'Materiais Ilimitados',
      'Lançar e Baixar Materiais da Comunidade',
      '10 contratos por mês',
      '10 eventos na agenda por mês',
      'Calculadora de precificação',
    ],
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    preco: '34,90',
    descricao: 'O mais completo',
    destaque: true,
    beneficios: [
      'Tudo do Iniciante',
      'Contratos ilimitados',
      'Eventos na Agenda ilimitada',
      'Gerenciar clientes',
      'Lançar kits no Catálogo',
      'Catálogo Inteligente',
      'Gestor de Pedidos',
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
      'Controle de Acervo',
      'Cartão fidelidade (Em Breve)',
      'Contrato personalizado (Em breve)',
      'Acesso antecipado a novidades',
    ],
  },
]

const ORDEM_PLANOS = ['free', 'iniciante', 'avancado', 'elite']

export default async function PaginaPlanos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── VERSÃO AUTENTICADA ──────────────────────────────────
  if (user) {
    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('plano, status, trial_expira_em')
      .eq('usuario_id', user.id)
      .single()

    const planoAtivo    = assinatura?.status === 'active' || assinatura?.status === 'ativo' ? assinatura.plano : null
    const isTrial       = assinatura?.status === 'trial'
    const diasRestantes = getDiasRestantesTrial(assinatura?.trial_expira_em ?? null)
    const indiceAtivo   = ORDEM_PLANOS.indexOf(planoAtivo ?? 'free')

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>

        <div style={{ borderBottom: '1px solid #eeeeee', padding: '24px 40px', backgroundColor: '#fff' }} className="page-header">
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 32, borderRadius: 4, background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
            <div>
              <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 28, color: '#140033', letterSpacing: '-1px', margin: 0 }}>
                Meu Plano
              </h1>
              <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: 14, margin: 0 }}>
                Faça upgrade, downgrade ou gerencie sua assinatura
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 80px' }}>

          {isTrial && (
            <div style={{ background: 'linear-gradient(135deg, rgba(255,51,204,0.06), rgba(153,0,255,0.06))', border: '1px solid rgba(153,0,255,0.18)', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#9900ff', margin: 0 }}>
                  Você está no período de teste grátis
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: 0 }}>
                  {diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'} — assine agora para não perder o acesso
                </p>
              </div>
            </div>
          )}

          {planoAtivo && (
            <div style={{ background: '#f0fff8', border: '1px solid #00cc6622', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00aa55', flexShrink: 0 }} />
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#007744', margin: 0 }}>
                    Plano {PLANOS.find(p => p.id === planoAtivo)?.nome} ativo
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: 0 }}>
                    Para cancelar ou ver detalhes, acesse o gerenciador
                  </p>
                </div>
              </div>
              <Link href="/gerenciar-plano" style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#007744', textDecoration: 'none', border: '1.5px solid #00cc6633', borderRadius: 999, padding: '7px 16px', whiteSpace: 'nowrap' }}>
                Gerenciar assinatura →
              </Link>
            </div>
          )}

          <div className="planos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {PLANOS.map((p) => {
              const isAtivo     = planoAtivo === p.id
              const indice      = ORDEM_PLANOS.indexOf(p.id)
              const isUpgrade   = indice > indiceAtivo && planoAtivo !== null
              const isDowngrade = indice < indiceAtivo && planoAtivo !== null
              const checkCor    = isAtivo ? '#00aa55' : '#9900ff'

              return (
                <div key={p.id} style={{
                  background: '#fff',
                  border: isAtivo
                    ? '2px solid #00cc6633'
                    : p.destaque
                    ? '2px solid #ff33cc33'
                    : '1.5px solid #e8e8ec',
                  borderRadius: 20,
                  padding: '28px 22px 22px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isAtivo
                    ? '0 8px 32px rgba(0,204,102,0.08)'
                    : p.destaque
                    ? '0 8px 32px rgba(255,51,204,0.10)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  opacity: isDowngrade ? 0.72 : 1,
                }}>
                  {!isAtivo && p.destaque && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: 999, padding: '4px 14px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                      Mais popular
                    </div>
                  )}
                  {isAtivo && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#00aa55', borderRadius: 999, padding: '4px 14px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                      Plano atual
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: p.destaque ? '#ff33cc' : '#9900ff', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 4px 0' }}>
                      {p.nome}
                    </p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: 0 }}>
                      {p.descricao}
                    </p>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    {p.preco ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#140033', marginRight: 2 }}>R$</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 900, color: '#140033', letterSpacing: '-1.5px', lineHeight: '1' }}>
                          {p.preco.split(',')[0]}
                        </span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#140033' }}>,{p.preco.split(',')[1]}</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#00000033', marginLeft: 3 }}>/mês</span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 900, color: '#140033', letterSpacing: '-1px' }}>
                        Grátis
                      </span>
                    )}
                  </div>

                  <div style={{ height: 1, background: '#f0f0f4', marginBottom: 18 }} />

                  <ul style={{ listStyle: 'none', margin: '0 0 20px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                    {p.beneficios.map((b) => (
                      <li key={b} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#140033cc', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: '1.4' }}>
                        <CheckIcon cor={checkCor} />
                        {b}
                      </li>
                    ))}
                  </ul>

                  {isAtivo ? (
                    <div style={{ textAlign: 'center', padding: '11px', background: '#f0fff8', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#007744', border: '1.5px solid #00cc6622' }}>
                      Plano atual
                    </div>
                  ) : p.id === 'free' ? (
                    <Link href="/gerenciar-plano" style={{ display: 'block', textAlign: 'center', padding: '11px', background: '#f5f5f7', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#00000055', textDecoration: 'none' }}>
                      {planoAtivo ? 'Cancelar assinatura' : 'Plano atual'}
                    </Link>
                  ) : (
                    <div>
                      {isDowngrade && (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#cc7700', textAlign: 'center', margin: '0 0 8px 0' }}>
                          Downgrade — você perderá recursos
                        </p>
                      )}
                      {isUpgrade && (
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#9900ff', textAlign: 'center', margin: '0 0 8px 0', fontWeight: 600 }}>
                          Fazer upgrade
                        </p>
                      )}
                      <BotaoAssinarClient planoId={p.id} destaque={p.destaque} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000033', textAlign: 'center', marginTop: 28 }}>
            Pagamento seguro via Pix ou cartão — Sem fidelidade — Cancele quando quiser
          </p>
        </div>

        <style>{`
          .page-header { padding: 24px 16px !important; }
          @media (min-width: 640px) { .page-header { padding: 24px 40px !important; } }
          @media (max-width: 900px) { .planos-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 540px) { .planos-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    )
  }

  // ── VERSÃO PÚBLICA ──────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>

      <div style={{ borderBottom: '1px solid #eeeeee', padding: '18px 24px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="/enc_logo_mono.png" width={160} height={20} alt="Encantiva Pro" />
          <Link href="/login" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#140033', textDecoration: 'none', border: '1.5px solid #e8e8ec', borderRadius: 999, padding: '8px 18px' }}>
            Já tenho conta
          </Link>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '52px 24px 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, rgba(255,51,204,0.07), rgba(153,0,255,0.07))', border: '1px solid rgba(153,0,255,0.15)', borderRadius: 999, padding: '6px 18px', marginBottom: 22 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #ff33cc, #9900ff)' }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#9900ff' }}>7 dias grátis em qualquer plano pago</span>
        </div>
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(26px, 5vw, 40px)', color: '#140033', letterSpacing: '-1.5px', margin: '0 0 12px 0' }}>
          Escolha seu plano
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#00000055', margin: 0 }}>
          Sem burocracia. Sem fidelidade. Cancele quando quiser.
        </p>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>
        <div className="planos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {PLANOS.map((p) => (
            <div key={p.id} style={{
              background: '#fff',
              border: p.destaque ? '2px solid #ff33cc33' : '1.5px solid #e8e8ec',
              borderRadius: 20,
              padding: '28px 22px 22px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: p.destaque ? '0 8px 32px rgba(255,51,204,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              {p.destaque && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: 999, padding: '4px 14px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                  Mais popular
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: p.destaque ? '#ff33cc' : '#9900ff', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 4px 0' }}>
                  {p.nome}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000055', margin: 0 }}>
                  {p.descricao}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                {p.preco ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#140033', marginRight: 2 }}>R$</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 900, color: '#140033', letterSpacing: '-1.5px', lineHeight: '1' }}>
                      {p.preco.split(',')[0]}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, color: '#140033' }}>,{p.preco.split(',')[1]}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#00000033', marginLeft: 3 }}>/mês</span>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 900, color: '#140033', letterSpacing: '-1px' }}>
                    Grátis
                  </span>
                )}
              </div>

              <div style={{ height: 1, background: '#f0f0f4', marginBottom: 18 }} />

              <ul style={{ listStyle: 'none', margin: '0 0 24px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                {p.beneficios.map((b) => (
                  <li key={b} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#140033cc', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: '1.4' }}>
                    <CheckIcon cor="#9900ff" />
                    {b}
                  </li>
                ))}
              </ul>

              {p.id === 'free' ? (
                <Link href="/cadastro" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#f5f5f7', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#140033', textDecoration: 'none' }}>
                  Começar grátis
                </Link>
              ) : (
                <BotaoAssinarPublico planoId={p.id} destaque={p.destaque} nomePlano={p.nome} />
              )}
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000033', textAlign: 'center', marginTop: 32 }}>
          Pagamento seguro via Pix ou cartão — Sem fidelidade — Cancele quando quiser
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) { .planos-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .planos-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
