import Link from 'next/link'
import Image from 'next/image'
import BotaoAssinarPublico from './BotaoAssinarPublico'

export const dynamic = 'force-dynamic'

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

export default function PaginaPlanosPublica() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '20px 24px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Image src="/enc_logo_mono.png" width={160} height={20} alt="Encantiva Pro" />
          <Link
            href="/login"
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
              color: '#140033', textDecoration: 'none',
              border: '1.5px solid #e5e5e5', borderRadius: 999,
              padding: '8px 18px',
            }}
          >
            Já tenho conta
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 24px 32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, rgba(255,51,204,0.08), rgba(153,0,255,0.08))',
          border: '1px solid rgba(255,51,204,0.2)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 14 }}>🎉</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#9900ff' }}>
            7 dias grátis em qualquer plano pago
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 42px)',
          color: '#140033', letterSpacing: '-1.5px', margin: '0 0 12px 0',
        }}>
          Escolha seu plano
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#00000055', margin: 0 }}>
          Cancele quando quiser. Sem burocracia. Sem fidelidade.
        </p>
      </div>

      {/* Grid de planos */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 60px' }}>
        <div
          className="planos-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {PLANOS.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: `2px solid ${p.destaque ? '#ff33cc44' : '#eeeeee'}`,
                borderRadius: 20,
                padding: 24,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: p.destaque
                  ? '0 8px 32px rgba(255,51,204,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              {/* Badge popular */}
              {p.destaque && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                  borderRadius: 999, padding: '4px 14px',
                  fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#fff',
                  whiteSpace: 'nowrap',
                }}>
                  Mais popular
                </div>
              )}

              {/* Nome e descrição */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#9900ff', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                  {p.nome}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#00000066', margin: 0 }}>
                  {p.descricao}
                </p>
              </div>

              {/* Preço */}
              <div style={{ marginBottom: 20 }}>
                {p.preco ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#140033' }}>R$</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 32, fontWeight: 900, color: '#140033', letterSpacing: '-1px' }}>
                      {p.preco.split(',')[0]}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#140033' }}>
                      ,{p.preco.split(',')[1]}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000044', marginLeft: 2 }}>/mês</span>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 900, color: '#140033' }}>Grátis</span>
                )}
              </div>

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
                <Link
                  href="/cadastro"
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px',
                    background: '#f5f5f5', borderRadius: 12,
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#140033',
                    textDecoration: 'none',
                  }}
                >
                  Começar grátis
                </Link>
              ) : (
                <BotaoAssinarPublico planoId={p.id} destaque={p.destaque} nomePlano={p.nome} />
              )}
            </div>
          ))}
        </div>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#00000033', textAlign: 'center', marginTop: 32 }}>
          Pagamento seguro via Pix ou cartão de crédito • Sem fidelidade • Cancele quando quiser
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) { .planos-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .planos-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}