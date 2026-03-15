import Image from 'next/image'
import Link from 'next/link'

const funcionalidades = [
  { icone: '✂️', nome: 'Cortador de Painéis', desc: 'Corte painéis com precisão profissional.', gratis: true },
  { icone: '💰', nome: 'Calculadora de Preços', desc: 'Calcule o preço ideal para cada kit com margem de lucro real.' },
  { icone: '🛍️', nome: 'Catálogo Digital', desc: 'Crie seu catálogo com temas, kits e adicionais para suas clientes.' },
  { icone: '📄', nome: 'Contratos Automáticos', desc: 'Gere contratos profissionais em segundos com seus dados.' },
  { icone: '👥', nome: 'Gestão de Clientes', desc: 'Cadastre e acompanhe todas as suas clientes em um só lugar.' },
  { icone: '📅', nome: 'Agenda de Eventos', desc: 'Visualize todos os eventos no calendário com alertas de prazo.' },
  { icone: '📊', nome: 'Painel Financeiro', desc: 'Acompanhe sua receita, pedidos e projeções do mês.' },
  { icone: '🎨', nome: 'Criador de Painéis', desc: 'Crie artes e layouts prontos para impressão profissional.' },
]

const planos = [
  {
    id: 'iniciante', nome: 'Iniciante', preco: '19,90',
    beneficios: ['Cortador de painéis ilimitado', 'Calculadora de preços', 'Catálogo de kits', 'Criar e salvar kits'],
  },
  {
    id: 'avancado', nome: 'Avançado', preco: '34,90', destaque: true,
    beneficios: ['Tudo do Iniciante', 'Contratos digitais', 'Lista de clientes', 'Agenda de festas', 'Gestor de pedidos'],
  },
  {
    id: 'elite', nome: 'Elite', preco: '54,90',
    beneficios: ['Tudo do Avançado', 'Controle de estoque', 'Financeiro completo', 'Dashboard de vendas', 'Cartão de fidelidade'],
  },
]

const depoimentos = [
  { nome: 'Ana Clara', cidade: 'São Paulo, SP', texto: 'A calculadora de preços me ajudou a cobrar o que realmente vale. Nunca mais trabalhei no prejuízo!', estrelas: 5 },
  { nome: 'Fernanda Lima', cidade: 'Belo Horizonte, MG', texto: 'O cortador de painéis é incrível e de graça. Depois assinei o plano e não me arrependi nem um dia.', estrelas: 5 },
  { nome: 'Juliana Souza', cidade: 'Curitiba, PR', texto: 'Meu catálogo digital ficou lindo e minhas clientes adoram receber o link. Vale cada centavo.', estrelas: 5 },
  { nome: 'Mariana Costa', cidade: 'Rio de Janeiro, RJ', texto: 'A agenda com alertas me salvou de perder uma data. Organização completa num só lugar!', estrelas: 5 },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f6f6f8', color: '#111827', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(246,246,248,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #e8e8ec', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/enc_logo_mono.png" width={200} height={24} alt="Encantiva Pro" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/login" style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textDecoration: 'none', padding: '8px 14px' }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#ff33cc', borderRadius: '999px', padding: '9px 18px' }}>
            Teste grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#ff33cc', marginBottom: '24px' }}>
          🧪 7 dias grátis — sem cartão de crédito
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>
          O negócio da sua festa
          <br />
          <span style={{ color: '#ff33cc' }}>organizado de verdade</span>
        </h1>

        <p style={{ fontSize: '17px', color: '#6b7280', lineHeight: 1.6, margin: '0 0 36px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          Calculadora de preços, contratos, agenda, catálogo digital e muito mais. Tudo que uma decoradora profissional precisa em um só lugar.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/cadastro" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ff33cc', color: '#fff', borderRadius: '999px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}>
            Começar grátis →
          </Link>
          <Link href="/cortador-de-paineis" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#374151', borderRadius: '999px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, textDecoration: 'none', border: '1.5px solid #e8e8ec' }}>
            ✂️ Cortador grátis
          </Link>
        </div>

      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            Tudo que você precisa
          </h2>
          <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>Em um só lugar, do início ao fim</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {funcionalidades.map(f => (
            <div key={f.nome} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '20px', position: 'relative' }}>
              {f.gratis && (
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                  Grátis
                </span>
              )}
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>{f.icone}</span>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{f.nome}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ background: '#fff', borderTop: '1px solid #e8e8ec', borderBottom: '1px solid #e8e8ec', padding: '72px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#140033', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Planos simples e justos
            </h2>
            <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>Cancele quando quiser. Sem fidelidade.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {planos.map(p => (
              <div key={p.id} style={{ background: p.destaque ? '#140033' : '#fafafa', border: `1.5px solid ${p.destaque ? '#ff33cc' : '#e8e8ec'}`, borderRadius: '20px', padding: '28px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {p.destaque && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ff33cc', borderRadius: '999px', padding: '4px 16px', fontSize: '11px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
                    Mais popular
                  </div>
                )}

                <p style={{ fontSize: '14px', fontWeight: 700, color: p.destaque ? '#fff' : '#374151', margin: '0 0 4px' }}>{p.nome}</p>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: p.destaque ? '#fff' : '#140033', letterSpacing: '-1px' }}>R$ {p.preco}</span>
                  <span style={{ fontSize: '13px', color: p.destaque ? '#ffffff66' : '#9ca3af' }}>/mês</span>
                </div>

                <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {p.beneficios.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: p.destaque ? '#ffffffcc' : '#374151' }}>
                      <span style={{ color: '#ff33cc', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>

                <Link href="/cadastro" style={{ display: 'block', textAlign: 'center', background: p.destaque ? '#ff33cc' : 'transparent', color: p.destaque ? '#fff' : '#ff33cc', border: `1.5px solid ${p.destaque ? 'transparent' : '#ff33cc'}`, borderRadius: '999px', padding: '12px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                  Começar agora
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '24px' }}>
            Teste 7 dias grátis em qualquer plano. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#140033', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            O que as decoradoras dizem
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {depoimentos.map(d => (
            <div key={d.nome} style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                {[...Array(d.estrelas)].map((_, i) => <span key={i} style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>)}
              </div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: '0 0 14px' }}>&ldquo;{d.texto}&rdquo;</p>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#140033', margin: '0 0 1px' }}>{d.nome}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{d.cidade}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#140033', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px' }}>
            Pronta para organizar
            <br />
            <span style={{ color: '#ff33cc' }}>seu negócio?</span>
          </h2>
          <p style={{ fontSize: '15px', color: '#ffffff9a', margin: '0 0 32px', lineHeight: 1.6 }}>
            Comece grátis agora. Sem cartão, sem compromisso. 7 dias com acesso completo ao plano Elite.
          </p>
          <Link href="/cadastro" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ff33cc', color: '#fff', borderRadius: '999px', padding: '16px 36px', fontSize: '16px', fontWeight: 700, textDecoration: 'none' }}>
            Criar conta grátis →
          </Link>
          <p style={{ fontSize: '12px', color: '#ffffff86', margin: '16px 0 0' }}>
            Cancele quando quiser · Sem fidelidade · Suporte incluso
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0b001b', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#ffffff83', margin: 0 }}>
          © 2026 Encantiva Pro · Todos os direitos reservados
        </p>
      </footer>

      <style>{`
        @media (max-width: 480px) {
          nav { padding: 0 16px !important; }
        }
      `}</style>
    </div>
  )
}