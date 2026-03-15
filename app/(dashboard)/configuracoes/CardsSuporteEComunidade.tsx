'use client'

const secaoLabel: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px',
  margin: '0 0 10px 2px',
}

interface CardLink {
  href: string
  icone: React.ReactNode
  iconeBg: string
  titulo: string
  descricao: string
  badge: string
  badgeBg: string
  badgeColor: string
  hoverBorder: string
  hoverShadow: string
}

function CardLink({ href, icone, iconeBg, titulo, descricao, badge, badgeBg, badgeColor, hoverBorder, hoverShadow }: CardLink) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div
        style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '16px', height: '100%', boxSizing: 'border-box', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}
        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = hoverBorder; d.style.boxShadow = hoverShadow }}
        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#e8e8ec'; d.style.boxShadow = 'none' }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '9px', background: iconeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          {icone}
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#111827', margin: '0 0 2px' }}>{titulo}</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '0 0 8px' }}>{descricao}</p>
        <span style={{ display: 'inline-block', background: badgeBg, color: badgeColor, borderRadius: '999px', padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700 }}>
          {badge}
        </span>
      </div>
    </a>
  )
}

const IcoWA = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
)
const IcoEmail = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#ff33cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="16" height="12" rx="2"/><path d="M1 6l8 5 8-5"/></svg>
)
const IcoInsta = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none"/></svg>
)

export default function CardsSuporteEComunidade() {
  return (
    <>
      {/* ── Suporte ── */}
      <section>
        <p style={secaoLabel}>Suporte</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <CardLink
            href="https://wa.me/21979758341"
            icone={<IcoWA />}
            iconeBg="#f0fdf4"
            titulo="Suporte humanizado"
            descricao="Tire dúvidas pelo WhatsApp"
            badge="Contato →"
            badgeBg="#f0fdf4"
            badgeColor="#16a34a"
            hoverBorder="#25D366"
            hoverShadow="0 4px 16px rgba(37,211,102,0.12)"
          />
          <CardLink
            href="mailto:suporte@encantivapro.com.br"
            icone={<IcoEmail />}
            iconeBg="#fff0fb"
            titulo="E-mail"
            descricao="suporte@encantivapro.com.br"
            badge="Enviar →"
            badgeBg="#fff0fb"
            badgeColor="#ff33cc"
            hoverBorder="#ff33cc"
            hoverShadow="0 4px 16px rgba(255,51,204,0.1)"
          />
        </div>
      </section>

      {/* ── Comunidade ── */}
      <section>
        <p style={secaoLabel}>Comunidade</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <CardLink
            href="https://chat.whatsapp.com/JlAmZ4ix3B5K42fJi2c6Vo"
            icone={<IcoWA />}
            iconeBg="#f0fdf4"
            titulo="Grupo"
            descricao="Comunidade Encantiva"
            badge="Entrar →"
            badgeBg="#f0fdf4"
            badgeColor="#16a34a"
            hoverBorder="#25D366"
            hoverShadow="0 4px 12px rgba(37,211,102,0.1)"
          />
          <CardLink
            href="https://instagram.com/encantivapro"
            icone={<IcoInsta />}
            iconeBg="#fff0f5"
            titulo="Instagram"
            descricao="@encantivapro"
            badge="Seguir →"
            badgeBg="#fff0f5"
            badgeColor="#E1306C"
            hoverBorder="#E1306C"
            hoverShadow="0 4px 12px rgba(225,48,108,0.1)"
          />
          <CardLink
            href="https://instagram.com/gisasbarbs"
            icone={<IcoInsta />}
            iconeBg="#fff0f5"
            titulo="Criadora"
            descricao="@gisasbarbs"
            badge="Seguir →"
            badgeBg="#fff0f5"
            badgeColor="#E1306C"
            hoverBorder="#E1306C"
            hoverShadow="0 4px 12px rgba(225,48,108,0.1)"
          />
        </div>
      </section>
    </>
  )
}