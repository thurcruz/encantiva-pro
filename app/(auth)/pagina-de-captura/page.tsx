import Link from 'next/link'
import Image from 'next/image'

const WHATSAPP_LINK = 'https://chat.whatsapp.com/LRqQ4Gnlw0740Zup1aPLQh?mode=hq1tcla'
const CORTADOR_LINK = '/cortador-de-paineis'

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 1.41.37 2.74 1.01 3.89L0 16l4.22-1.01A8 8 0 1 0 8 0zm3.52 9.6c-.19-.1-1.13-.56-1.31-.62-.17-.06-.3-.1-.43.1-.13.19-.5.62-.61.75-.11.13-.23.14-.42.05-.19-.1-.81-.3-1.54-.95-.57-.51-.95-1.13-1.06-1.32-.11-.19-.01-.29.08-.38.09-.09.19-.23.29-.34.1-.11.13-.19.19-.32.06-.13.03-.24-.02-.34-.05-.1-.43-1.04-.59-1.42-.15-.37-.31-.32-.43-.33h-.36c-.13 0-.34.05-.51.24-.17.19-.67.65-.67 1.59 0 .94.68 1.84.78 1.97.1.13 1.35 2.06 3.27 2.89.46.2.82.32 1.1.41.46.14.88.12 1.21.07.37-.05 1.13-.46 1.29-.9.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23z"/>
  </svg>
)
const ScissorsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="4.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/>
    <path d="M6.5 4.5L14 8M6.5 11.5L14 8" strokeLinecap="round"/>
  </svg>
)
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const InstagramIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="1" width="10" height="10" rx="3"/>
    <circle cx="6" cy="6" r="2.5"/>
    <circle cx="9" cy="3" r=".6" fill="currentColor" stroke="none"/>
  </svg>
)

const prizes = [
  {
    place: '1°', bg: 'linear-gradient(135deg, #ff33cc, #9900ff)',
    title: '1 ano de Encantiva Pro + Mesa Cavalete',
    desc: 'Acesso completo à plataforma por 12 meses e uma linda mesa cavalete para suas festas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5L8 2z" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    place: '2°', bg: '#7700ff',
    title: '1 ano de Encantiva Pro',
    desc: 'Acesso completo à plataforma por 12 meses',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="7" width="12" height="8" rx="1.5"/>
        <path d="M8 7V3m0 0C8 3 6 1 4.5 2S4 5 8 7m0-4c0 0 2-2 3.5-1S12 5 8 7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    place: '3°', bg: '#bb55ff',
    title: 'Kit Boleira na cor que preferir',
    desc: 'Um kit boleira personalizado na sua cor favorita para arrasar nas festas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        <ellipse cx="8" cy="5" rx="5" ry="3"/>
        <path d="M3 5v6c0 1.66 2.24 3 5 3s5-1.34 5-3V5"/>
        <path d="M8 2V1M8 2c0 0-1.5-1-3 0" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const features = [
  { name: 'Cortador de Painéis', desc: 'Divide painéis em folhas prontas para impressão automaticamente', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="4.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/><path d="M6.5 4.5L14 8M6.5 11.5L14 8" strokeLinecap="round"/></svg> },
  { name: 'Calculadora de Preços', desc: 'Descubra o preço certo e nunca mais saia no prejuízo', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M5 10.5h4M8 5.5h3" strokeLinecap="round"/></svg> },
  { name: 'Catálogo Digital', desc: 'Compartilhe um link para clientes escolherem tema e kit', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 7h6M5 9.5h4" strokeLinecap="round"/><circle cx="12.5" cy="12.5" r="3" fill="white" stroke="currentColor"/><path d="M11.5 12.5h2M12.5 11.5v2" strokeLinecap="round"/></svg> },
  { name: 'Contratos Digitais', desc: 'Gere e assine contratos pelo celular em segundos', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" strokeLinecap="round"/></svg> },
  { name: 'Agenda de Eventos', desc: 'Calendário com alertas para festas nos próximos dias', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12" strokeLinecap="round"/><path d="M6 2v4M10 2v4" strokeLinecap="round"/><circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none"/></svg> },
  { name: 'Financeiro & Metas', desc: 'Acompanhe faturamento e defina metas mensais', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 11l3.5-4 3 3 2.5-3.5L14 10" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { name: 'Controle de Estoque', desc: 'Saiba onde cada peça está em cada data de evento', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5.5 5V4a2.5 2.5 0 0 1 5 0v1" strokeLinecap="round"/><circle cx="8" cy="9.5" r="1.5" fill="currentColor" stroke="none"/></svg> },
  { name: 'Cartão de Fidelidade', desc: 'Pontos para clientes que contratam e indicam novas clientes', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
]

export default function PaginaDeCaptura() {
  return (
    <div style={{ background: '#ffffff', color: '#1a0040', fontFamily: "'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .badge-dot { animation: blink 2s infinite; }
        .live-dot  { animation: blink 1.2s infinite; }
        .btn-solid:hover  { background: linear-gradient(135deg, #e600b8, #7700ee) !important; transform: translateY(-2px); box-shadow: 0 6px 28px rgba(255,51,204,0.45) !important; }
        .btn-outline:hover { background: #f7f0ff !important; transform: translateY(-2px); }
        .ig-link:hover { border-color: #ff33cc !important; background: #fff0fb !important; }
        .feat:hover { border-color: rgba(255,51,204,0.3) !important; box-shadow: 0 4px 20px rgba(255,51,204,0.07); }
        .btn-solid, .btn-outline { transition: background .2s, transform .15s, box-shadow .2s; }
        .ig-link { transition: border-color .2s, background .2s; }
        .feat { transition: border-color .2s, box-shadow .2s; }
        @media (max-width: 500px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-h1 { font-size: 2.1rem !important; }
          .social-row { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 64px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 700px 500px at 50% -80px, rgba(255,51,204,0.06), transparent), radial-gradient(ellipse 400px 300px at 80% 60%, rgba(153,0,255,0.04), transparent)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <Image src="/enc_logo_mono.png" width={200} height={24} alt="Encantiva Pro" />
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff0fb', color: '#cc0099', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '7px 16px', borderRadius: 99, border: '1px solid #ffccee', marginBottom: 32 }}>
          <span className="badge-dot" style={{ width: 6, height: 6, background: '#ff33cc', borderRadius: '50%', display: 'inline-block' }} />
          Lançamento em breve
        </div>

        {/* H1 */}
        <h1 className="hero-h1" style={{ fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#1a0040', maxWidth: 660, marginBottom: 20 }}>
          O sistema completo para<br />quem <em style={{ fontStyle: 'normal', color: '#ff33cc' }}>trabalha com festa</em>
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#7755aa', fontWeight: 400, maxWidth: 420, lineHeight: 1.65, marginBottom: 16 }}>
          Precificação, catálogo, contratos, agenda e financeiro — tudo para profissionais de festas em um só lugar.
        </p>

        {/* Data */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#ff33cc', marginBottom: 36 }}>
          <CalendarIcon />
          14 de março de 2025
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <Link
            href={WHATSAPP_LINK} target="_blank" rel="noopener"
            className="btn-solid"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg, #ff33cc, #9900ff)', color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, padding: '17px 28px', borderRadius: 99, textDecoration: 'none', border: 'none', boxShadow: '0 2px 20px rgba(255,51,204,0.3), 0 1px 4px rgba(153,0,255,0.2)', letterSpacing: '-0.2px' }}
          >
            <WhatsAppIcon />
            Entrar no grupo de lançamento
          </Link>
          <Link
            href={CORTADOR_LINK}
            className="btn-outline"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', color: '#7700ff', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, padding: '15px 28px', borderRadius: 99, border: '1.5px solid #7700ff', textDecoration: 'none', letterSpacing: '-0.2px' }}
          >
            <ScissorsIcon />
            Experimentar o cortador grátis
          </Link>
        </div>

        {/* Instagram */}
        <div className="social-row" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <span style={{ fontSize: 12, color: '#b89fd4', fontWeight: 500 }}>Nos acompanhe</span>
          {[
            { href: 'https://instagram.com/encantivapro', label: '@encantivapro' },
            { href: 'https://instagram.com/gisasbarbs', label: '@gisasbarbs' },
          ].map((ig) => (
            <Link key={ig.label} href={ig.href} target="_blank" className="ig-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#ff33cc', textDecoration: 'none', padding: '5px 12px', borderRadius: 99, border: '1px solid #ffccee', background: '#fff0fb' }}>
              <InstagramIcon />
              {ig.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── DIVISOR ── */}
      <Divisor />

      {/* ── LIVE / SORTEIO ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#ff33cc', marginBottom: 8, display: 'block' }}>
            Evento especial de lançamento
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#1a0040', marginBottom: 8 }}>
            Live com <em style={{ fontStyle: 'normal', color: '#ff33cc' }}>sorteio</em> ao vivo
          </h2>
          <p style={{ fontSize: 14, color: '#7755aa', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            No dia do lançamento faremos uma live no Instagram com sorteio de prêmios para quem estiver no grupo.
          </p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #fff0fb, #f7f0ff)', border: '1px solid #ffccee', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Badge live */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ffccee', borderRadius: 99, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#cc0099', width: 'fit-content' }}>
            <span className="live-dot" style={{ width: 7, height: 7, background: '#ff3333', borderRadius: '50%', display: 'inline-block' }} />
            Live · 14 de março
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prizes.map((p) => (
              <div key={p.place} style={{ background: '#fff', border: '1px solid #f0dcff', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: p.bg, color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {p.place}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0040', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: '#7755aa' }}>{p.desc}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff33cc' }}>
                  {p.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DIVISOR ── */}
      <Divisor style={{ marginTop: 56 }} />

      {/* ── FEATURES ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#ff33cc', marginBottom: 8 }}>O que vem aí</p>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#1a0040' }}>Funcionalidades do sistema</h2>
        </div>

        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {features.map((f) => (
            <div key={f.name} className="feat" style={{ background: '#fff', border: '1px solid #f0dcff', borderRadius: 14, padding: '16px 15px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff0fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ff33cc' }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0040', marginBottom: 3 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#7755aa', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function Divisor({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', height: 1, background: 'linear-gradient(90deg, transparent, #ffccee, #e5d0ff, transparent)', ...style }} />
  )
}