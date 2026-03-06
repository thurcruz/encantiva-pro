import Link from 'next/link'

export default function PaginaSucesso() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0018 0%, #140033 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255,51,204,0.2), rgba(153,0,255,0.2))',
          border: '1px solid rgba(255,51,204,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '40px', margin: '0 auto 28px',
        }}>
          🎉
        </div>
        <h1 style={{
          fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '34px',
          color: '#fff', margin: '0 0 14px 0', letterSpacing: '-1px',
        }}>
          Assinatura ativada!
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#ffffff66',
          margin: '0 0 36px 0', lineHeight: 1.6,
        }}>
          Seu pagamento foi confirmado e seu acesso completo à Encantiva está liberado. Bem-vinda(o)!
        </p>
        <Link href="/inicio" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
          borderRadius: '14px', padding: '16px 40px',
          color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px',
          textDecoration: 'none',
        }}>
          Ir para o painel →
        </Link>
      </div>
    </div>
  )
}