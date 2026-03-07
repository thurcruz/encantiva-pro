import { createClient } from '@/lib/supabase/server'
import CortadorPublico from './CortadorPublico'
import { BookOpen, Calendar, DollarSign, Users, Scissors, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Cortador de Painéis Grátis — Encantiva',
  description: 'Transforme qualquer imagem em um painel 50×50cm dividido em 6 folhas A4, pronto para imprimir. Grátis, sem baixar nada.',
}

const MODULOS = [
  {
    icon: Scissors,
    titulo: 'Cortador de Painéis',
    desc: 'Corte qualquer imagem em 6 folhas A4 para montar um painel 50×50cm.',
    tag: 'Você está aqui ✨',
    destaque: true,
  },
  {
    icon: BookOpen,
    titulo: 'Catálogo Digital',
    desc: 'Monte um catálogo bonito dos seus produtos e compartilhe com clientes.',
    tag: 'Gratuito',
    destaque: false,
  },
  {
    icon: Calendar,
    titulo: 'Agenda de Pedidos',
    desc: 'Organize encomendas, datas de entrega e status de cada pedido.',
    tag: 'Gratuito',
    destaque: false,
  },
  {
    icon: DollarSign,
    titulo: 'Controle Financeiro',
    desc: 'Acompanhe receitas, despesas e o lucro do seu negócio.',
    tag: 'Gratuito',
    destaque: false,
  },
  {
    icon: Users,
    titulo: 'Comunidade',
    desc: 'Baixe painéis prontos feitos por outras artesãs da Encantiva.',
    tag: 'Premium',
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
        borderBottom: '1px solid #eeeeee', padding: '20px 40px',
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
          }}>
            Entrar na Encantiva
          </a>
        )}
      </div>

      {/* Cortador */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 40px 0' }}>
        <CortadorPublico usuarioLogado={!!user} usuarioId={user?.id ?? null} />
      </div>

      {/* Seção de funcionalidades — rodapé */}
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        padding: '8px 40px 60px',
      }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: 0 }}>{m.titulo}</p>
                    <span style={{
                      background: m.destaque ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : m.tag === 'Premium' ? '#f5f0ff' : '#e8f5e9',
                      color: m.destaque ? '#fff' : m.tag === 'Premium' ? '#9900ff' : '#2e7d32',
                      fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
                      padding: '2px 8px', borderRadius: '20px',
                    }}>
                      {m.tag}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <a href="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: '14px', padding: '16px',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px',
            textDecoration: 'none', boxShadow: '0 8px 32px rgba(255,51,204,0.3)',
          }}>
            Criar conta grátis e explorar tudo <ArrowRight size={16} />
          </a>

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000033', textAlign: 'center', margin: '12px 0 0 0' }}>
            Sem cartão de crédito • Acesso imediato • Plano gratuito disponível
          </p>
        </div>
      </div>

    </div>
  )
}