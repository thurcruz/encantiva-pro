import { createClient } from '@/lib/supabase/server'
import CortadorPublico from './CortadorPublico'
import { BookOpen, Calendar, DollarSign, Users, Scissors } from 'lucide-react'

export const metadata = {
  title: 'Cortador de Painéis Grátis — Encantiva',
  description: 'Transforme qualquer imagem em um painel 50×50cm dividido em 6 folhas A4, pronto para imprimir. Grátis, sem baixar nada.',
}

const WHATSAPP_LINK = 'https://chat.whatsapp.com/LRqQ4Gnlw0740Zup1aPLQh?mode=hq1tcla'

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 1.41.37 2.74 1.01 3.89L0 16l4.22-1.01A8 8 0 1 0 8 0zm3.52 9.6c-.19-.1-1.13-.56-1.31-.62-.17-.06-.3-.1-.43.1-.13.19-.5.62-.61.75-.11.13-.23.14-.42.05-.19-.1-.81-.3-1.54-.95-.57-.51-.95-1.13-1.06-1.32-.11-.19-.01-.29.08-.38.09-.09.19-.23.29-.34.1-.11.13-.19.19-.32.06-.13.03-.24-.02-.34-.05-.1-.43-1.04-.59-1.42-.15-.37-.31-.32-.43-.33h-.36c-.13 0-.34.05-.51.24-.17.19-.67.65-.67 1.59 0 .94.68 1.84.78 1.97.1.13 1.35 2.06 3.27 2.89.46.2.82.32 1.1.41.46.14.88.12 1.21.07.37-.05 1.13-.46 1.29-.9.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23z"/>
  </svg>
)

const MODULOS = [
  {
    icon: Scissors,
    titulo: 'Cortador de Painéis',
    desc: 'Corte qualquer imagem em 6 folhas A4 para montar um painel 50×50cm.',
    tag: 'Você está aqui',
    destaque: true,
  },
  {
    icon: BookOpen,
    titulo: 'Catálogo Digital',
    desc: 'Monte um catálogo bonito dos seus produtos e compartilhe com clientes.',
    tag: 'Teste grátis',
    destaque: false,
  },
  {
    icon: Calendar,
    titulo: 'Agenda de Pedidos',
    desc: 'Organize encomendas, datas de entrega e status de cada pedido.',
    tag: 'Teste grátis',
    destaque: false,
  },
  {
    icon: DollarSign,
    titulo: 'Controle Financeiro',
    desc: 'Acompanhe receitas, despesas e o lucro do seu negócio.',
    tag: 'Teste grátis',
    destaque: false,
  },
  {
    icon: Users,
    titulo: 'Comunidade',
    desc: 'Baixe painéis prontos feitos por outras artesãs da Encantiva.',
    tag: 'Conheça',
    destaque: false,
  },
]

export default async function PaginaCortadorPublico() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid #eeeeee', padding: '16px 20px',
        backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '22px', color: '#140033', letterSpacing: '-0.5px', margin: 0 }}>
              Cortador de Painéis
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '13px', margin: 0 }}>
              Transforme sua imagem em 6 folhas A4 prontas para imprimir
            </p>
          </div>
        </div>

        {!user && (
          <a href="/login" style={{
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: '10px', padding: '10px 20px',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700,
            fontSize: '13px', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(255,51,204,0.25)',
            whiteSpace: 'nowrap',
          }}>
            Entrar na Encantiva
          </a>
        )}
      </div>

      {/* Cortador */}
      <div className="cortador-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <CortadorPublico usuarioLogado={!!user} usuarioId={user?.id ?? null} />
      </div>

      {/* Seção de funcionalidades — rodapé */}
      <div className="cortador-footer" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          background: '#fff', border: '1px solid #eeeeee',
          borderRadius: '24px', padding: '32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ff33cc', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              Plataforma completa para artesãs
            </p>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#140033', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              O Cortador é só uma das ferramentas
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>
              A Encantiva foi feita para organizar e crescer o seu negócio de festas
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {MODULOS.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: m.destaque ? 'linear-gradient(135deg, #fff5fd, #f5f0ff)' : '#fafafa',
                border: `1px solid ${m.destaque ? '#ff33cc33' : '#eeeeee'}`,
                borderRadius: '14px', padding: '16px 20px',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: m.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff',
                  border: m.destaque ? 'none' : '1px solid #e5e5e5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: m.destaque ? '0 4px 12px rgba(255,51,204,0.3)' : 'none',
                }}>
                  <m.icon size={20} style={{ color: m.destaque ? '#fff' : '#9900ff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 4px 0' }}>{m.titulo}</p>
                  <span style={{
                    display: 'inline-block',
                    background: m.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : m.tag === 'Premium' ? '#f5f0ff' : '#e8f5e9',
                    color: m.destaque ? '#fff' : m.tag === 'Premium' ? '#9900ff' : '#2e7d32',
                    fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: '20px', marginBottom: '4px',
                  }}>
                    {m.tag}
                  </span>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso de lançamento */}
          <div style={{
            background: 'linear-gradient(135deg, #f7f0ff, #fff5fd)',
            border: '1px solid #e5d0ff',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{ fontSize: '28px', flexShrink: 0 }}>🚀</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '14px', color: '#1a0040', margin: '0 0 4px 0' }}>
                Plataforma em lançamento — entre no grupo!
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7755aa', margin: 0, lineHeight: 1.5 }}>
                Seja a primeira a testar, participe do sorteio ao vivo e receba novidades em primeira mão.
              </p>
            </div>
          </div>

          <a href={WHATSAPP_LINK} target="_blank" rel="noopener" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            borderRadius: '64px', padding: '16px',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
            marginBottom: '10px',
          }}>
            <WhatsAppIcon />
            Entrar no grupo de lançamento
          </a>

        </div>
      </div>

      <style>{`
        .cortador-content { padding: 24px 16px 0; }
        .cortador-footer { padding: 8px 16px 40px; }
        @media (min-width: 640px) {
          .cortador-content { padding: 32px 40px 0; }
          .cortador-footer { padding: 8px 40px 60px; }
        }
      `}</style>
    </div>
  )
}