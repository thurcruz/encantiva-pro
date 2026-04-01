'use client'

import Link from 'next/link'
import { Lock, Check, Zap, Shield, Crown, ArrowRight } from 'lucide-react'

type PlanoMinimo = 'iniciante' | 'avancado' | 'elite'
type PlanoId = 'free' | 'trial' | 'iniciante' | 'avancado' | 'elite' | 'admin'

interface Props {
  titulo: string
  descricao: string
  planoMinimo: PlanoMinimo
  icone: string
  planoAtual?: PlanoId
}

const INFO: Record<PlanoMinimo, {
  nome: string
  preco: string
  cor: string
  icone: React.ReactNode
  beneficios: string[]
  tudo_anterior?: string
}> = {
  iniciante: {
    nome: 'Iniciante',
    preco: 'R$ 19,90',
    cor: '#00cc88',
    icone: <Zap size={16} />,
    beneficios: [
      'Downloads ilimitados de materiais',
      'Calculadora de precificação',
      'Salvar kits na calculadora',
      'Comunidade — baixar e publicar painéis',
      '10 contratos e 10 eventos/mês',
    ],
  },
  avancado: {
    nome: 'Avançado',
    preco: 'R$ 34,90',
    cor: '#0099ff',
    icone: <Shield size={16} />,
    tudo_anterior: 'Tudo do Iniciante, mais:',
    beneficios: [
      'Contratos ilimitados',
      'Agenda ilimitada',
      'Catálogo inteligente + gestor de pedidos',
      'Lista de clientes completa (CRUD)',
      'Lançar kits direto para o catálogo',
    ],
  },
  elite: {
    nome: 'Elite',
    preco: 'R$ 54,90',
    cor: '#ff33cc',
    icone: <Crown size={16} />,
    tudo_anterior: 'Tudo do Avançado, mais:',
    beneficios: [
      'Dashboard financeiro',
      'Controle de acervo',
      'Cartão fidelidade para clientes',
      'Contratos personalizados',
      'Acesso antecipado a novidades',
    ],
  },
}

const RECURSOS_FREE = [
  '5 downloads de materiais/mês',
  '5 contratos/mês',
  '5 eventos na agenda/mês',
  'Cortador de painéis ilimitado',
  'Lista de clientes (somente leitura)',
]

export default function ModuloBloqueado({ titulo, descricao, planoMinimo, icone, planoAtual }: Props) {
  const info = INFO[planoMinimo]
  const isFree = !planoAtual || planoAtual === 'free'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f6f8' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #e8e8ec', padding: '28px 32px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', color: '#140033', letterSpacing: '-0.5px', margin: 0 }}>{titulo}</h1>
            <p style={{ color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontSize: '13px', margin: 0 }}>{descricao}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Card esquerdo — o que você tem / o que está bloqueado */}
        <div>
          {/* Ícone e título */}
          <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '20px', padding: '32px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #fff0fb, #f5f0ff)', border: '1px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>
              {icone}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: '999px', padding: '5px 14px', marginBottom: '16px' }}>
              <Lock size={12} style={{ color: '#dc2626' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#dc2626', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Bloqueado no seu plano
              </span>
            </div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              {titulo} requer o plano {info.nome}
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              Faça upgrade para desbloquear esta e outras funcionalidades.
            </p>
          </div>

          {/* O que você tem no free */}
          {isFree && (
            <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', padding: '24px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1.2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                No plano Grátis você tem
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {RECURSOS_FREE.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, background: '#f5f0ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={10} style={{ color: '#7700ff' }} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#374151' }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card direito — plano de destino */}
        <div style={{ background: '#fff', border: `2px solid ${info.cor}33`, borderRadius: '20px', padding: '32px', position: 'relative', overflow: 'hidden' }}>

          {/* Faixa de destaque */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${info.cor}, ${info.cor}88)` }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${info.cor}15`, border: `1px solid ${info.cor}33`, borderRadius: '999px', padding: '5px 14px', marginBottom: '20px', color: info.cor }}>
            {info.icone}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
              PLANO {info.nome.toUpperCase()}
            </span>
          </div>

          {info.tudo_anterior && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: '0 0 12px', fontWeight: 600 }}>
              {info.tudo_anterior}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {info.beneficios.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: `${info.cor}20`, border: `1px solid ${info.cor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={11} style={{ color: info.cor }} />
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Preço */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#140033', letterSpacing: '-1.5px' }}>
                {info.preco}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#9ca3af' }}>/mês</span>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#10b981', fontWeight: 600, margin: 0 }}>
              ✓ 7 dias grátis para testar
            </p>
          </div>

          <Link href="/planos"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: `linear-gradient(135deg, ${info.cor}, ${info.cor}bb)`, border: 'none', borderRadius: '12px', padding: '15px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: `0 8px 24px ${info.cor}33`, marginBottom: '10px' }}>
            Fazer upgrade agora <ArrowRight size={16} />
          </Link>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
            Pagamento seguro · Cancele quando quiser
          </p>
        </div>
      </div>

      {/* Mobile: stack */}
      <style>{`
        @media (max-width: 768px) {
          .modulo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}