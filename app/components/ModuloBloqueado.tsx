'use client'

import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import PopupUpgrade from './PopupUpgrade'

type PlanoMinimo = 'iniciante' | 'avancado' | 'elite'

interface Props {
  titulo: string
  descricao: string
  planoMinimo: PlanoMinimo
  icone: string
  planoAtual?: 'free' | 'trial' | 'iniciante' | 'avancado' | 'elite' | 'admin'
}

const INFO_PLANO: Record<PlanoMinimo, { nome: string; preco: string; beneficios: string[] }> = {
  iniciante: {
    nome: 'Iniciante',
    preco: 'R$ 24,90/mês',
    beneficios: [
      'Biblioteca de materiais',
      'Calculadora de precificação',
      'Criar e salvar kits',
      'Catálogo de kits',
    ],
  },
  avancado: {
    nome: 'Avançado',
    preco: 'R$ 54,90/mês',
    beneficios: [
      'Contratos digitais',
      'Lista de clientes',
      'Gestor de pedidos',
      'Agenda de festas',
      'Configuração da loja',
    ],
  },
  elite: {
    nome: 'Elite',
    preco: 'R$ 94,00/mês',
    beneficios: [
      'Controle de estoque',
      'Financeiro completo',
      'Dashboard de vendas',
      'Tema mais vendido',
      'Cartão de fidelidade',
    ],
  },
}

const RECURSOS_FREE = [
  'Cortador de painéis',
  'Até 10 downloads de materiais',
  'Até 5 contratos por mês',
  'Até 5 eventos por mês',
]

export default function ModuloBloqueado({ titulo, descricao, planoMinimo, icone, planoAtual }: Props) {
  const [popupAberto, setPopupAberto] = useState(false)
  const info = INFO_PLANO[planoMinimo]
  const isFree = planoAtual === 'free'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #eeeeee', padding: '32px 40px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #ff33cc, #9900ff)' }} />
          <div>
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>
              {titulo}
            </h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
              {descricao}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>

          {/* Ícone */}
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', border: '1px solid rgba(255,51,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '36px' }}>
            {icone}
          </div>

          {isFree ? (
            // ── Tela plano free ─────────────────────────────
            <>
              <div style={{ background: '#f5f0ff', border: '1px solid #e9d5ff', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} style={{ color: '#7700ff' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#7700ff', letterSpacing: '0.5px' }}>
                  PLANO GRÁTIS
                </span>
              </div>

              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: '0 0 12px' }}>
                {titulo} não está no plano grátis
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#00000066', margin: '0 0 32px', maxWidth: '500px', lineHeight: 1.7 }}>
                Você está no plano gratuito. Para acessar {titulo.toLowerCase()}, faça upgrade a partir do plano <strong>{info.nome}</strong>.
              </p>

              {/* O que você tem no free */}
              <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '24px', maxWidth: '400px', width: '100%', textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#00000033', letterSpacing: '1.5px', textTransform: 'uppercase' as const, margin: '0 0 16px' }}>
                  No plano grátis você tem
                </p>
                {RECURSOS_FREE.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < RECURSOS_FREE.length - 1 ? '12px' : 0 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: '#f5f0ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} style={{ color: '#7700ff' }} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{b}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPopupAberto(true)}
                style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '18px 48px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,51,204,0.25)', marginBottom: '12px' }}
              >
                Ver planos e preços →
              </button>

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000033', margin: 0 }}>
                🔒 Pagamento seguro · Cancele quando quiser
              </p>
            </>
          ) : (
            // ── Tela plano pago insuficiente ─────────────────
            <>
              <div style={{ background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', border: '1px solid rgba(255,51,204,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} style={{ color: '#9900ff' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#9900ff', letterSpacing: '0.5px' }}>
                  PLANO {info.nome.toUpperCase()} OU SUPERIOR
                </span>
              </div>

              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: '0 0 12px' }}>
                {titulo} é premium
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#00000066', margin: '0 0 40px', maxWidth: '500px', lineHeight: 1.7 }}>
                {descricao} Disponível a partir do plano <strong>{info.nome}</strong>.
              </p>

              <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '28px', marginBottom: '32px', maxWidth: '400px', width: '100%', textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#00000033', letterSpacing: '1.5px', textTransform: 'uppercase' as const, margin: '0 0 16px' }}>
                  No plano {info.nome} você também tem
                </p>
                {info.beneficios.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < info.beneficios.length - 1 ? '12px' : 0 }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #ff33cc, #9900ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} style={{ color: '#fff' }} />
                    </div>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{b}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '40px', color: '#140033', letterSpacing: '-1.5px' }}>
                    {info.preco.split('/')[0]}
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044' }}>/mês</span>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 600, margin: 0 }}>
                  Teste grátis por 7 dias
                </p>
              </div>

              <button
                onClick={() => setPopupAberto(true)}
                style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '18px 48px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,51,204,0.25)', marginBottom: '12px' }}
              >
                Fazer upgrade agora →
              </button>

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000033', margin: 0 }}>
                🔒 Pagamento seguro · Cancele quando quiser
              </p>
            </>
          )}
        </div>
      </div>

      <PopupUpgrade
        aberto={popupAberto}
        onFechar={() => setPopupAberto(false)}
        recurso={titulo}
        descricao={`${descricao} Disponível a partir do plano ${info.nome}.`}
        isFree={isFree}
      />
    </div>
  )
}