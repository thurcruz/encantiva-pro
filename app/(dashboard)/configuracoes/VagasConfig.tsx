'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VagaDia { id: string; data: string; vagas_total: number }
interface Props { usuarioId: string; vagasPadrao: number; vagasEspecificas: VagaDia[] }

const input: React.CSSProperties = {
  background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '10px',
  padding: '9px 12px', color: '#111827', fontFamily: 'Inter, sans-serif',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.6px', textTransform: 'uppercase' as const,
}

const IconPlus  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>
const IconTrash = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h8M4.5 3V2h3v1M3 3l.5 7h5l.5-7"/></svg>
const IconSave  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4.5L11 4.5V11a1 1 0 0 1-1 1z"/><path d="M7.5 12v-4H5v4M5 2v3h3"/></svg>

export default function VagasConfig({ usuarioId, vagasPadrao: vagasPadraoInicial, vagasEspecificas: vagasIniciais }: Props) {
  const supabase = createClient()
  const [vagasPadrao, setVagasPadrao] = useState(vagasPadraoInicial)
  const [vagas, setVagas] = useState<VagaDia[]>(vagasIniciais)
  const [novaData, setNovaData] = useState('')
  const [novasVagas, setNovasVagas] = useState('1')
  const [salvandoPadrao, setSalvandoPadrao] = useState(false)
  const [adicionando, setAdicionando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function salvarPadrao() {
    setSalvandoPadrao(true)
    await supabase.from('perfis').upsert({ id: usuarioId, vagas_padrao: vagasPadrao, atualizado_em: new Date().toISOString() })
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2000)
    setSalvandoPadrao(false)
  }

  async function adicionarVagaEspecifica() {
    if (!novaData || !novasVagas) return
    setAdicionando(true)
    const { data, error } = await supabase.from('vagas_dia').upsert({
      usuario_id: usuarioId, data: novaData, vagas_total: parseInt(novasVagas),
    }, { onConflict: 'usuario_id,data' }).select().single()
    if (!error && data) {
      setVagas(p => {
        const sem = p.filter(v => v.data !== novaData)
        return [...sem, data].sort((a, b) => a.data.localeCompare(b.data))
      })
      setNovaData('')
      setNovasVagas('1')
    }
    setAdicionando(false)
  }

  async function deletarVaga(id: string) {
    await supabase.from('vagas_dia').delete().eq('id', id)
    setVagas(p => p.filter(v => v.id !== id))
  }

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px', padding: '18px 20px' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 4px' }}>Vagas por dia</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '0 0 16px' }}>
        Controle quantos eventos aceita por dia. Clientes verão disponibilidade ao escolher a data.
      </p>

      {/* Padrão */}
      <div style={{ marginBottom: '16px' }}>
        <label style={lbl}>Vagas padrão (todos os dias)</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="number" min="0" max="20" value={vagasPadrao} onChange={e => setVagasPadrao(parseInt(e.target.value) || 0)}
            style={{ ...input, width: '80px' }} />
          <button onClick={salvarPadrao} disabled={salvandoPadrao}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: sucesso ? '#10b981' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '9px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            <IconSave /> {sucesso ? 'Salvo!' : salvandoPadrao ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9ca3af', margin: '4px 0 0' }}>
          Use 0 para bloquear todos os dias por padrão
        </p>
      </div>

      {/* Data específica */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginBottom: '14px' }}>
        <label style={lbl}>Exceção por data específica</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '8px', alignItems: 'end' }}>
          <div>
            <span style={{ ...lbl, marginBottom: '4px' }}>Data</span>
            <input type="date" min={hoje} value={novaData} onChange={e => setNovaData(e.target.value)} style={{ ...input, width: '100%' }} />
          </div>
          <div>
            <span style={{ ...lbl, marginBottom: '4px' }}>Vagas</span>
            <input type="number" min="0" max="20" value={novasVagas} onChange={e => setNovasVagas(e.target.value)} style={{ ...input, width: '100%' }} />
          </div>
          <button onClick={adicionarVagaEspecifica} disabled={adicionando || !novaData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: !novaData ? '#f3f4f6' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '9px 14px', color: !novaData ? '#9ca3af' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: !novaData ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            <IconPlus /> Adicionar
          </button>
        </div>
      </div>

      {/* Lista de exceções */}
      {vagas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ ...lbl, marginBottom: '6px' }}>Exceções cadastradas</p>
          {vagas.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: '10px', padding: '9px 12px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                {new Date(v.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: v.vagas_total === 0 ? '#ef4444' : '#10b981', background: v.vagas_total === 0 ? '#fef2f2' : '#f0fdf9', borderRadius: '999px', padding: '2px 10px' }}>
                  {v.vagas_total === 0 ? 'Bloqueado' : `${v.vagas_total} vaga${v.vagas_total !== 1 ? 's' : ''}`}
                </span>
                <button onClick={() => deletarVaga(v.id)} style={{ width: 26, height: 26, borderRadius: '999px', border: '1px solid #fecdd3', background: '#fff5f5', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}