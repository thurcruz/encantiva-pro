'use client'

import { useState } from 'react'
import { Lock, Check, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type PlanoMinimo = 'iniciante' | 'avancado' | 'elite'
type PlanoId = 'free' | 'trial' | 'iniciante' | 'avancado' | 'elite' | 'admin'

interface UsoMensal {
  label: string
  usado: number
  limite: number
  unidade?: string
}

interface Props {
  titulo: string
  descricao: string
  planoMinimo: PlanoMinimo
  icone: string
  planoAtual?: PlanoId
  usoMensal?: UsoMensal[]
}

const INFO_PLANO: Record<PlanoMinimo, { nome: string; preco: string; beneficios: string[] }> = {
  iniciante: {
    nome: 'Iniciante',
    preco: 'R$ 19,90/mes',
    beneficios: [
      'Materiais ilimitados',
      'Calculadora de precificacao',
      'Salvar kits + catalogo',
      'Comunidade Encantiva',
    ],
  },
  avancado: {
    nome: 'Avancado',
    preco: 'R$ 34,90/mes',
    beneficios: [
      'Contratos ilimitados',
      'Lista de clientes',
      'Catalogo inteligente',
      'Gestor de pedidos',
      'Agenda ilimitada',
    ],
  },
  elite: {
    nome: 'Elite',
    preco: 'R$ 54,90/mes',
    beneficios: [
      'Dashboard financeiro',
      'Controle de estoque',
      'Cartao fidelidade',
      'Acesso antecipado',
    ],
  },
}

const RECURSOS_FREE = [
  'Cortador de paineis',
  'Ate 10 materiais/mes',
  'Ate 5 contratos/mes',
  'Ate 5 eventos na agenda/mes',
]

function BarraUso({ label, usado, limite, unidade = '' }: UsoMensal) {
  const pct = Math.min(100, (usado / limite) * 100)
  const cor = pct >= 100 ? '#dc2626' : pct >= 70 ? '#f59e0b' : '#10b981'
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: pct >= 100 ? '#dc2626' : '#00000055', fontWeight: pct >= 100 ? 700 : 400 }}>
          {usado}/{limite}{unidade && ` ${unidade}`}
        </span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '999px', transition: 'width .4s' }} />
      </div>
      {pct >= 100 && (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#dc2626', margin: '4px 0 0', fontWeight: 600 }}>
          Limite atingido — reseta no inicio do proximo mes
        </p>
      )}
    </div>
  )
}

export default function ModuloBloqueado({ titulo, descricao, planoMinimo, icone, planoAtual, usoMensal }: Props) {
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
            <h1 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: 0 }}>{titulo}</h1>
            <p style={{ color: '#00000055', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>{descricao}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 40px' }}>

        {/* Uso mensal — aparece antes do bloqueio quando tem dados */}
        {usoMensal && usoMensal.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <TrendingUp size={16} style={{ color: '#9900ff' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: 0 }}>
                Seu uso este mes
              </p>
            </div>
            {usoMensal.map((u, i) => <BarraUso key={i} {...u} />)}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000033', margin: 0 }}>
              Os limites reiniciam todo dia 1 do mes.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>

          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', border: '1px solid rgba(255,51,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '36px' }}>
            {icone}
          </div>

          {isFree ? (
            <>
              <div style={{ background: '#f5f0ff', border: '1px solid #e9d5ff', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} style={{ color: '#7700ff' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#7700ff', letterSpacing: '0.5px' }}>PLANO GRATIS</span>
              </div>

              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: '0 0 12px' }}>
                {titulo} nao esta no plano gratis
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#00000066', margin: '0 0 32px', maxWidth: '500px', lineHeight: 1.7 }}>
                Faca upgrade a partir do plano <strong>{info.nome}</strong> para acessar esta funcionalidade.
              </p>

              {/* O que voce tem no free */}
              <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '24px', maxWidth: '400px', width: '100%', textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#00000033', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  No plano gratis voce tem
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

              <Link href="/planos" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '18px 48px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,51,204,0.25)', marginBottom: '12px', textDecoration: 'none' }}>
                Ver planos e precos
              </Link>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000033', margin: 0 }}>
                Pagamento seguro - Cancele quando quiser
              </p>
            </>
          ) : (
            <>
              <div style={{ background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', border: '1px solid rgba(255,51,204,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} style={{ color: '#9900ff' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#9900ff', letterSpacing: '0.5px' }}>
                  PLANO {info.nome.toUpperCase()} OU SUPERIOR
                </span>
              </div>

              <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '28px', color: '#140033', letterSpacing: '-1px', margin: '0 0 12px' }}>
                {titulo} e premium
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#00000066', margin: '0 0 40px', maxWidth: '500px', lineHeight: 1.7 }}>
                Disponivel a partir do plano <strong>{info.nome}</strong>.
              </p>

              <div style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '28px', marginBottom: '24px', maxWidth: '400px', width: '100%', textAlign: 'left' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#00000033', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  No plano {info.nome} voce tambem tem
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
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044' }}>/mes</span>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 600, margin: 0 }}>
                  Teste gratis por 7 dias
                </p>
              </div>

              <Link href="/planos" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '14px', padding: '18px 48px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 12px 40px rgba(255,51,204,0.25)', marginBottom: '12px', textDecoration: 'none' }}>
                Fazer upgrade agora
              </Link>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000033', margin: 0 }}>
                Pagamento seguro - Cancele quando quiser
              </p>
            </>
          )}
        </div>
      </div>

      {popupAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPopupAberto(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <Link href="/planos" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
              Ver planos
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}