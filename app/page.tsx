import Link from 'next/link'
import Image from 'next/image'
import { Check, Scissors, FileText, Calculator, ShoppingBag, Users, TrendingUp, CalendarDays, LayoutTemplate, Lock, Sparkles, ArrowRight, Star } from 'lucide-react'

export const metadata = {
  title: 'Encantiva Pro — Plataforma para Decoradoras e Buffeteiras',
  description: 'Organize sua empresa de festas com catálogo, contratos, financeiro e muito mais.',
}

const planos = [
  {
    id: 'iniciante',
    nome: 'Iniciante',
    preco: '24,90',
    descricao: 'Para quem está começando',
    destaque: false,
    beneficios: ['Catálogo de temas e kits', 'Calculadora de preços', '10 contratos por mês', 'Suporte por e-mail'],
  },
  {
    id: 'avancado',
    nome: 'Avançado',
    preco: '54,90',
    descricao: 'O mais popular ✨',
    destaque: true,
    beneficios: ['Tudo do Iniciante', 'Contratos ilimitados', 'Criador de painéis', 'Suporte prioritário'],
  },
  {
    id: 'elite',
    nome: 'Elite',
    preco: '94,00',
    descricao: 'Para quem quer o máximo',
    destaque: false,
    beneficios: ['Tudo do Avançado', 'Acesso antecipado', 'Suporte VIP', 'Recursos exclusivos'],
  },
]

const funcionalidades = [
  { icon: <Scissors size={22} />, nome: 'Cortador de Painéis', desc: 'Corte painéis com precisão profissional. Gratuito para sempre.', gratis: true },
  { icon: <Calculator size={22} />, nome: 'Calculadora de Preços', desc: 'Calcule o preço ideal para cada festa com margem de lucro.', gratis: false },
  { icon: <ShoppingBag size={22} />, nome: 'Catálogo Digital', desc: 'Crie seu catálogo com temas, kits e adicionais para seus clientes.', gratis: false },
  { icon: <FileText size={22} />, nome: 'Contratos Automáticos', desc: 'Gere contratos profissionais em segundos com seus dados.', gratis: false },
  { icon: <Users size={22} />, nome: 'Gestão de Clientes', desc: 'Cadastre e acompanhe todos os seus clientes em um só lugar.', gratis: false },
  { icon: <CalendarDays size={22} />, nome: 'Agenda de Eventos', desc: 'Visualize todos os seus eventos no calendário com alertas.', gratis: false },
  { icon: <TrendingUp size={22} />, nome: 'Painel Financeiro', desc: 'Acompanhe sua receita, pedidos e projeções financeiras.', gratis: false },
  { icon: <LayoutTemplate size={22} />, nome: 'Criador de Painéis', desc: 'Crie artes e layouts prontos para impressão profissional.', gratis: false },
]

const depoimentos = [
  { nome: 'Ana Clara', cidade: 'São Paulo, SP', texto: 'Organizei meu negócio do zero com a plataforma. Os contratos automáticos me salvam horas toda semana!', estrelas: 5 },
  { nome: 'Fernanda Lima', cidade: 'Belo Horizonte, MG', texto: 'O cortador de painéis é incrível e de graça! Depois assinei o plano e não me arrependi nem um dia.', estrelas: 5 },
  { nome: 'Juliana Souza', cidade: 'Curitiba, PR', texto: 'Meu catálogo digital ficou lindo e meus clientes adoram receber o link. Vale cada centavo.', estrelas: 5 },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#06000f', color: '#fff', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 40px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,0,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="/enc_logotipo.svg" width={160} height={28} alt="Encantiva" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: '#ffffff88', textDecoration: 'none', padding: '8px 16px' }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '10px', padding: '10px 20px' }}>
            Teste grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(153,0,255,0.18) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '30%', left: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,51,204,0.12) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,0,255,0.1) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,51,204,0.1)', border: '1px solid rgba(255,51,204,0.25)', borderRadius: '99px', padding: '6px 16px', marginBottom: '32px' }}>
            <Sparkles size={13} style={{ color: '#ff33cc' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: '#ff33cc', letterSpacing: '0.5px' }}>7 dias grátis · Sem cartão necessário</span>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900, fontSize: 'clamp(42px, 7vw, 82px)', lineHeight: 1.05, letterSpacing: '-2px', margin: '0 0 24px 0' }}>
            Organize suas festas<br />
            <span style={{ background: 'linear-gradient(135deg, #ff33cc, #cc66ff, #9900ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              com elegância
            </span>
          </h1>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(16px, 2vw, 20px)', color: '#ffffff77', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 48px' }}>
            A plataforma completa para buffeteiras e decoradoras. Catálogo, contratos, financeiro e muito mais em um só lugar.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cadastro" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '14px', padding: '18px 36px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '16px', textDecoration: 'none', boxShadow: '0 16px 48px rgba(255,51,204,0.35)' }}>
              Teste grátis por 7 dias <ArrowRight size={18} />
            </Link>
            <Link href="/cortador" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '18px 36px', color: '#ffffffcc', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '16px', textDecoration: 'none' }}>
              <Scissors size={18} /> Cortador grátis
            </Link>
          </div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff33', marginTop: '24px' }}>
            Mais de 500 decoradoras já usam a plataforma 🎉
          </p>
        </div>
      </section>

      {/* ── CORTADOR DESTAQUE ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, rgba(255,51,204,0.06), rgba(153,0,255,0.06))', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,220,120,0.1)', border: '1px solid rgba(0,220,120,0.25)', borderRadius: '99px', padding: '5px 14px', marginBottom: '20px' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', fontWeight: 700, color: '#00dc78', letterSpacing: '1px', textTransform: 'uppercase' as const }}>100% gratuito</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.15, letterSpacing: '-1px', margin: '0 0 16px 0' }}>
              Cortador de Painéis<br />sem custo algum
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '16px', color: '#ffffff66', lineHeight: 1.7, margin: '0 0 28px 0' }}>
              Use o cortador profissional de painéis decorativos sem precisar pagar nada. Crie sua conta e comece agora.
            </p>
            <Link href="/cortador" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #00cc88, #0066ff)', borderRadius: '12px', padding: '14px 28px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
              <Scissors size={16} /> Usar cortador grátis
            </Link>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Corte preciso em medidas personalizadas', 'Vários formatos de painel', 'Resultado pronto para impressão', 'Sem marca d\'água', 'Sem limite de uso'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #00cc88, #0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ffffffcc' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
              Tudo que sua empresa precisa
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: '#ffffff55', margin: 0 }}>
              Ferramentas pensadas para quem vive de festa
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {funcionalidades.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${f.gratis ? 'rgba(0,220,120,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '16px', padding: '24px', position: 'relative' }}>
                {f.gratis ? (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,220,120,0.15)', borderRadius: '6px', padding: '3px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 700, color: '#00dc78', letterSpacing: '0.5px' }}>
                    GRÁTIS
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <Lock size={13} style={{ color: '#ffffff33' }} />
                  </div>
                )}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: f.gratis ? 'linear-gradient(135deg, #00cc8822, #0066ff22)' : 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: f.gratis ? '#00cc88' : '#cc66ff' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 8px 0' }}>{f.nome}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff55', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
              Planos para cada fase
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: '#ffffff55', margin: 0 }}>
              Comece grátis. Cresça quando precisar.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {planos.map(plano => (
              <div key={plano.id} style={{ flex: '1 1 280px', maxWidth: '320px', background: plano.destaque ? 'linear-gradient(160deg, rgba(255,51,204,0.1), rgba(153,0,255,0.1))' : 'rgba(255,255,255,0.04)', border: plano.destaque ? '1.5px solid rgba(255,51,204,0.35)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px', position: 'relative', boxShadow: plano.destaque ? '0 32px 80px rgba(255,51,204,0.12)' : 'none' }}>
                {plano.destaque && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '99px', padding: '6px 18px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '11px', color: '#fff', whiteSpace: 'nowrap' as const, letterSpacing: '0.5px' }}>
                    ✨ MAIS POPULAR
                  </div>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '11px', color: '#ffffff44', letterSpacing: '2px', textTransform: 'uppercase' as const, margin: '0 0 12px 0' }}>{plano.nome}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '40px', color: '#fff', letterSpacing: '-1.5px' }}>R$ {plano.preco}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff44' }}>/mês</span>
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: plano.destaque ? '#ff33cc' : '#ffffff33', margin: '0 0 28px 0' }}>{plano.descricao}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {plano.beneficios.map((b, bi) => (
                    <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: plano.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={10} style={{ color: '#fff' }} />
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ffffffbb' }}>{b}</span>
                    </div>
                  ))}
                </div>
                <Link href="/cadastro" style={{ display: 'block', textAlign: 'center' as const, background: plano.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : 'rgba(255,255,255,0.07)', border: plano.destaque ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                  Começar agora
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center' as const, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#ffffff33', marginTop: '32px' }}>
            Todos os planos incluem 7 dias grátis · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px', margin: '0 0 16px 0' }}>
              Quem já usa ama
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {depoimentos.map((d, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                  {Array.from({ length: d.estrelas }).map((_, j) => (
                    <Star key={j} size={14} fill="#ff33cc" style={{ color: '#ff33cc' }} />
                  ))}
                </div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#ffffffcc', lineHeight: 1.7, margin: '0 0 20px 0' }}>
                  &ldquo;{d.texto}&rdquo;
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 2px 0' }}>{d.nome}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#ffffff44', margin: 0 }}>{d.cidade}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(153,0,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' as const, position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 20px 0' }}>
            Comece a crescer<br />
            <span style={{ background: 'linear-gradient(135deg, #ff33cc, #cc66ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>hoje mesmo</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', color: '#ffffff55', margin: '0 0 40px 0', lineHeight: 1.6 }}>
            7 dias grátis, sem cartão. Cancele quando quiser.
          </p>
          <Link href="/cadastro" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '14px', padding: '20px 44px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '17px', textDecoration: 'none', boxShadow: '0 20px 60px rgba(255,51,204,0.4)' }}>
            Criar conta grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '16px', maxWidth: '1000px', margin: '0 auto' }}>
        <Image src="/enc_logotipo.svg" width={120} height={20} alt="Encantiva" style={{ opacity: 0.5 }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff22', margin: 0 }}>
          © {new Date().getFullYear()} Encantiva · encantivafestas.com.br
        </p>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/login" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff33', textDecoration: 'none' }}>Entrar</Link>
          <Link href="/cadastro" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff33', textDecoration: 'none' }}>Cadastro</Link>
          <Link href="/planos" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#ffffff33', textDecoration: 'none' }}>Planos</Link>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}