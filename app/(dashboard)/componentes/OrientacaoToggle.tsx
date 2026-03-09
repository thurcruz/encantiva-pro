// Componente reutilizável — coloque em app/componentes/OrientacaoToggle.tsx

type Orientacao = 'paisagem' | 'retrato'

interface Props {
  value: Orientacao
  onChange: (v: Orientacao) => void
}

export default function OrientacaoToggle({ value, onChange }: Props) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      background: '#f5f0ff', borderRadius: '12px', padding: '8px 14px',
      border: '1px solid #9900ff22',
    }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#00000066' }}>
        Folha:
      </span>

      {/* Botão Paisagem */}
      <button
        onClick={() => onChange('paisagem')}
        title="Paisagem — folha deitada (2×3)"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          background: value === 'paisagem' ? '#fff' : 'transparent',
          border: `1.5px solid ${value === 'paisagem' ? '#ff33cc' : 'transparent'}`,
          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
          boxShadow: value === 'paisagem' ? '0 2px 8px rgba(255,51,204,0.15)' : 'none',
          transition: 'all 0.18s',
        }}
      >
        {/* Ícone folha deitada */}
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <rect x="1" y="1" width="20" height="14" rx="2"
            stroke={value === 'paisagem' ? '#ff33cc' : '#aaaaaa'} strokeWidth="1.5" fill="none" />
          {/* Grade 2×3 dentro */}
          <line x1="11" y1="1" x2="11" y2="15" stroke={value === 'paisagem' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
          <line x1="1" y1="6" x2="21" y2="6" stroke={value === 'paisagem' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
          <line x1="1" y1="11" x2="21" y2="11" stroke={value === 'paisagem' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
        </svg>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: value === 'paisagem' ? '#ff33cc' : '#aaaaaa' }}>
          Paisagem
        </span>
      </button>

      {/* Botão Retrato */}
      <button
        onClick={() => onChange('retrato')}
        title="Retrato — folha em pé (3×2)"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          background: value === 'retrato' ? '#fff' : 'transparent',
          border: `1.5px solid ${value === 'retrato' ? '#ff33cc' : 'transparent'}`,
          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
          boxShadow: value === 'retrato' ? '0 2px 8px rgba(255,51,204,0.15)' : 'none',
          transition: 'all 0.18s',
        }}
      >
        {/* Ícone folha em pé */}
        <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
          <rect x="1" y="1" width="14" height="20" rx="2"
            stroke={value === 'retrato' ? '#ff33cc' : '#aaaaaa'} strokeWidth="1.5" fill="none" />
          {/* Grade 3×2 dentro */}
          <line x1="1" y1="11" x2="15" y2="11" stroke={value === 'retrato' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
          <line x1="6" y1="1" x2="6" y2="21" stroke={value === 'retrato' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
          <line x1="11" y1="1" x2="11" y2="21" stroke={value === 'retrato' ? '#ff33cc' : '#cccccc'} strokeWidth="0.8" />
        </svg>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: value === 'retrato' ? '#ff33cc' : '#aaaaaa' }}>
          Retrato
        </span>
      </button>
    </div>
  )
}