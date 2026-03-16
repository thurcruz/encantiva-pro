'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'

export default function PaginaPagamentoSucesso() {
  const supabase = createClient()
  const [nomePlano, setNomePlano] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    async function verificar() {
      // Aguarda um breve momento para o webhook processar
      await new Promise(r => setTimeout(r, 2000))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setVerificando(false); return }

      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('plano, status')
        .eq('usuario_id', user.id)
        .single()

      if (assinatura?.plano) {
        const nomes: Record<string, string> = {
          iniciante: 'Iniciante',
          avancado: 'Avançado',
          elite: 'Elite',
        }
        setNomePlano(nomes[assinatura.plano] ?? assinatura.plano)
      }

      setVerificando(false)
    }

    verificar()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fdf0ff 0%, #f9f5ff 50%, #fff5fd 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <Image src="/enc_logo_mono.png" width={160} height={20} alt="Encantiva Pro" />
      </div>

      {/* Card de sucesso */}
      <div style={{
        background: '#fff', borderRadius: 28,
        padding: '48px 40px', maxWidth: 480, width: '100%',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(153,0,255,0.1), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,51,204,0.12)',
      }}>

        {/* Ícone animado */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,51,204,0.12), rgba(153,0,255,0.12))',
          border: '2px solid rgba(255,51,204,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, margin: '0 auto 24px',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          🎉
        </div>

        <h1 style={{
          fontWeight: 900, fontSize: 28, color: '#140033',
          letterSpacing: '-1px', margin: '0 0 12px 0',
        }}>
          Pagamento confirmado!
        </h1>

        <p style={{ fontSize: 15, color: '#00000066', margin: '0 0 8px 0', lineHeight: 1.6 }}>
          {verificando
            ? 'Estamos ativando seu plano...'
            : nomePlano
              ? <>Seu plano <strong style={{ color: '#9900ff' }}>{nomePlano}</strong> está ativo. Bem-vinda à Encantiva Pro! ✨</>
              : 'Seu plano está sendo ativado. Pode levar alguns instantes.'}
        </p>

        {!verificando && (
          <p style={{ fontSize: 13, color: '#00000044', margin: '0 0 32px 0' }}>
            Você receberá um e-mail de confirmação em breve.
          </p>
        )}

        {verificando && (
          <div style={{ margin: '16px 0 32px' }}>
            <div style={{
              display: 'inline-flex', gap: 6, alignItems: 'center',
              color: '#9900ff', fontSize: 13, fontWeight: 600,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid #9900ff33',
                borderTopColor: '#9900ff',
                animation: 'spin 0.8s linear infinite',
              }} />
              Ativando seu acesso...
            </div>
          </div>
        )}

        {/* Separador */}
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, transparent, #e5e5e5, transparent)',
          margin: '0 0 28px 0',
        }} />

        {/* Benefícios rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'left' }}>
          {[
            '🎀 Acervo de materiais para decoração',
            '📋 Contratos digitais com assinatura',
            '🧮 Calculadora de precificação',
            '📅 Agenda de eventos organizada',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14 }}>{item.split(' ')[0]}</span>
              <span style={{ fontSize: 13, color: '#140033' }}>{item.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <Link
          href="/inicio"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            borderRadius: 14, padding: '16px 32px',
            color: '#fff', fontWeight: 800, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(255,51,204,0.35)',
            letterSpacing: '-0.3px',
          }}
        >
          Abrir meu dashboard →
        </Link>

        <p style={{ fontSize: 12, color: '#00000033', margin: '16px 0 0 0' }}>
          Dúvidas? Fale com a gente no suporte.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}