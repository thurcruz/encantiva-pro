'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import BotaoDeletar from './BotaoDeletar'
import type { Material } from '@/types/database'

interface Props {
  materiais: Material[]
}

export default function TabelaMateriais({ materiais }: Props) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #ffffff12' }}>
          {['Material', 'Tema', 'Tipo', 'Downloads', 'Ações'].map(col => (
            <th key={col} style={{
              textAlign: 'left',
              padding: '14px 20px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              color: '#ffffff44',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: '#ffffff05',
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {materiais.map((material) => (
          <TabelaLinha key={material.id} material={material} />
        ))}
      </tbody>
    </table>
  )
}

function TabelaLinha({ material }: { material: Material }) {
  return (
    <tr
      style={{ borderBottom: '1px solid #ffffff08', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05'}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
    >
      <td style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {material.url_imagem_preview ? (
            <img
              src={material.url_imagem_preview}
              alt={material.titulo}
              style={{
                width: '40px', height: '40px',
                borderRadius: '8px', objectFit: 'cover',
                border: '1px solid #ffffff18',
              }}
            />
          ) : (
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #9900ff22, #ff33cc11)',
              border: '1px solid #ffffff12',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>
              🎪
            </div>
          )}
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '14px',
            color: '#fff',
          }}>
            {material.titulo}
          </span>
        </div>
      </td>

      <td style={{ padding: '16px 20px' }}>
        {(material.temas as { nome: string } | null)?.nome ? (
          <span style={{
            background: '#ff33cc22',
            border: '1px solid #ff33cc33',
            color: '#ff33cc',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '100px',
          }}>
            {(material.temas as { nome: string }).nome}
          </span>
        ) : (
          <span style={{ color: '#ffffff33', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>—</span>
        )}
      </td>

      <td style={{ padding: '16px 20px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66' }}>
          {(material.tipos_peca as { nome: string } | null)?.nome ?? '—'}
        </span>
      </td>

      <td style={{ padding: '16px 20px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#9900ff' }}>
          {material.total_downloads}
        </span>
      </td>

      <td style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href={`/admin/materiais/${material.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px',
              background: '#ffffff0d',
              border: '1px solid #ffffff18',
              borderRadius: '8px',
              color: '#ffffff88',
              textDecoration: 'none',
            }}
          >
            <Pencil size={14} />
          </Link>
          <BotaoDeletar id={material.id} titulo={material.titulo} />
        </div>
      </td>
    </tr>
  )
}