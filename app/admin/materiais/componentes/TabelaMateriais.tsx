'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pencil, Lock, Unlock } from 'lucide-react'
import BotaoDeletar from './BotaoDeletar'
import type { Material } from '@/types/database'

interface Props {
  materiais: Material[]
}

const IconChevUp   = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 8l4-4 4 4"/></svg>
const IconChevDown = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 4l4 4 4-4"/></svg>

type OrdemCol = 'codigo' | 'colecao' | 'titulo' | 'criado_em' | 'total_downloads'
type OrdemDir = 'asc' | 'desc'

// ── OrdemBtn fora do componente para evitar recriação a cada render ──
interface OrdemBtnProps {
  col: OrdemCol
  label: string
  ordem: OrdemCol
  dir: OrdemDir
  onToggle: (col: OrdemCol) => void
}

function OrdemBtn({ col, label, ordem, dir, onToggle }: OrdemBtnProps) {
  const ativo = ordem === col
  return (
    <button
      onClick={() => onToggle(col)}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: ativo ? '#ff33cc' : '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', padding: '14px 20px' }}
    >
      {label} {ativo ? (dir === 'asc' ? <IconChevUp /> : <IconChevDown />) : null}
    </button>
  )
}

export default function TabelaMateriais({ materiais: materiaisIniciais }: Props) {
  const [busca, setBusca] = useState('')
  const [filtroColecao, setFiltroColecao] = useState('')
  const [filtroTag, setFiltroTag] = useState('')
  const [ordem, setOrdem] = useState<OrdemCol>('criado_em')
  const [dir, setDir] = useState<OrdemDir>('desc')

  const colecoes = [...new Set(materiaisIniciais.map(m => (m as unknown as { colecao?: string }).colecao).filter(Boolean))].sort() as string[]
  const todasTags = [...new Set(materiaisIniciais.flatMap(m => (m as unknown as { tags?: string[] }).tags ?? []))].sort()

  function toggleOrdem(col: OrdemCol) {
    if (ordem === col) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setOrdem(col); setDir('asc') }
  }

  const materiais = materiaisIniciais
    .filter(m => {
      const mat = m as unknown as { codigo?: string; colecao?: string; tags?: string[]; titulo: string }
      if (busca && !mat.titulo.toLowerCase().includes(busca.toLowerCase()) &&
          !mat.codigo?.toLowerCase().includes(busca.toLowerCase()) &&
          !mat.colecao?.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroColecao && mat.colecao !== filtroColecao) return false
      if (filtroTag && !(mat.tags ?? []).includes(filtroTag)) return false
      return true
    })
    .sort((a, b) => {
      const ma = a as unknown as Record<string, unknown>
      const mb = b as unknown as Record<string, unknown>
      const va = (ma[ordem] ?? '') as string
      const vb = (mb[ordem] ?? '') as string
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por código, coleção ou título..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: '200px', background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none' }}
        />
        <select
          value={filtroColecao}
          onChange={e => setFiltroColecao(e.target.value)}
          style={{ background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '10px 14px', color: filtroColecao ? '#fff' : '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Todas as coleções</option>
          {colecoes.map(c => <option key={c} value={c} style={{ background: '#1a0044' }}>{c}</option>)}
        </select>
        <select
          value={filtroTag}
          onChange={e => setFiltroTag(e.target.value)}
          style={{ background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '10px', padding: '10px 14px', color: filtroTag ? '#fff' : '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Todas as tags</option>
          {todasTags.map(t => <option key={t} value={t} style={{ background: '#1a0044' }}>{t}</option>)}
        </select>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', alignSelf: 'center', whiteSpace: 'nowrap' }}>
          {materiais.length} material{materiais.length !== 1 ? 'is' : ''}
        </span>
      </div>

      <div style={{ background: '#ffffff08', border: '1px solid #ffffff12', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ffffff12' }}>
              <th style={{ background: '#ffffff05', padding: 0 }}>
                <OrdemBtn col="codigo" label="Código" ordem={ordem} dir={dir} onToggle={toggleOrdem} />
              </th>
              <th style={{ background: '#ffffff05', padding: 0 }}>
                <OrdemBtn col="colecao" label="Coleção" ordem={ordem} dir={dir} onToggle={toggleOrdem} />
              </th>
              <th style={{ background: '#ffffff05', padding: 0 }}>
                <OrdemBtn col="titulo" label="Título" ordem={ordem} dir={dir} onToggle={toggleOrdem} />
              </th>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase', background: '#ffffff05' }}>
                Tags
              </th>
              <th style={{ background: '#ffffff05', padding: 0 }}>
                <OrdemBtn col="total_downloads" label="Downloads" ordem={ordem} dir={dir} onToggle={toggleOrdem} />
              </th>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase', background: '#ffffff05' }}>
                Acesso
              </th>
              <th style={{ textAlign: 'left', padding: '14px 20px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#ffffff44', letterSpacing: '1px', textTransform: 'uppercase', background: '#ffffff05' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {materiais.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', fontFamily: 'Inter, sans-serif', color: '#ffffff33', fontSize: '14px' }}>
                  Nenhum material encontrado
                </td>
              </tr>
            ) : materiais.map(material => (
              <TabelaLinha key={material.id} material={material} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabelaLinha({ material }: { material: Material }) {
  const mat = material as unknown as { codigo?: string; colecao?: string; tags?: string[]; exclusivo?: boolean }

  return (
    <tr
      style={{ borderBottom: '1px solid #ffffff08', transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05'}
      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
    >
      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#ff33cc', letterSpacing: '1px', background: '#ff33cc15', padding: '3px 8px', borderRadius: '6px' }}>
          {mat.codigo ?? '—'}
        </span>
      </td>

      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>
          {mat.colecao ?? '—'}
        </span>
      </td>

      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {material.url_imagem_preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.url_imagem_preview} alt={material.titulo} style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover', border: '1px solid #ffffff18', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#ffffff0d', border: '1px solid #ffffff12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🎪</div>
          )}
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#fff' }}>{material.titulo}</span>
        </div>
      </td>

      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(mat.tags ?? []).slice(0, 3).map(tag => (
            <span key={tag} style={{ background: '#ffffff10', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px' }}>{tag}</span>
          ))}
          {(mat.tags ?? []).length > 3 && (
            <span style={{ background: '#ffffff10', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px' }}>+{(mat.tags ?? []).length - 3}</span>
          )}
        </div>
      </td>

      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#9900ff' }}>
          {material.total_downloads}
        </span>
      </td>

      <td style={{ padding: '14px 20px' }}>
        {mat.exclusivo ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ff33cc15', border: '1px solid #ff33cc33', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
            <Lock size={10} /> Exclusivo
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffffff0d', color: '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px' }}>
            <Unlock size={10} /> Gratuito
          </span>
        )}
      </td>

      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/admin/materiais/${material.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '8px', color: '#ffffff88', textDecoration: 'none' }}>
            <Pencil size={14} />
          </Link>
          <BotaoDeletar id={material.id} titulo={material.titulo} />
        </div>
      </td>
    </tr>
  )
}