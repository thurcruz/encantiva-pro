'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react'
import type { ColecaoComContagem } from './page'

interface Props {
  colecoes: ColecaoComContagem[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#ffffff0d', border: '1px solid #ffffff18',
  borderRadius: '10px', padding: '10px 14px', color: '#fff',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#ffffff55', marginBottom: '5px',
  letterSpacing: '1px', textTransform: 'uppercase',
}

export default function GerenciarColecoes({ colecoes: inicial }: Props) {
  const supabase = createClient()
  const [lista, setLista] = useState<ColecaoComContagem[]>(inicial)
  const [criando, setCriando] = useState(false)
  const [salvandoNova, setSalvandoNova] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [deletandoId, setDeletandoId] = useState<string | null>(null)

  // Form nova coleção
  const [novoNome, setNovoNome] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novaOrdem, setNovaOrdem] = useState('0')

  // Form edição
  const [editNome, setEditNome] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editOrdem, setEditOrdem] = useState('0')
  const [editAtivo, setEditAtivo] = useState(true)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  function abrirEdicao(col: ColecaoComContagem) {
    setEditandoId(col.id)
    setEditNome(col.nome)
    setEditDescricao(col.descricao ?? '')
    setEditOrdem(String(col.ordem))
    setEditAtivo(col.ativo)
  }

  function cancelarEdicao() {
    setEditandoId(null)
  }

  async function criarColecao() {
    if (!novoNome.trim()) return
    setSalvandoNova(true)
    const { data, error } = await supabase.from('colecoes').insert({
      nome: novoNome.trim(),
      descricao: novaDescricao.trim() || null,
      ordem: parseInt(novaOrdem) || 0,
      ativo: true,
    }).select().single()

    if (!error && data) {
      setLista(prev => [...prev, { ...data, total_materiais: 0 }].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)))
      setNovoNome(''); setNovaDescricao(''); setNovaOrdem('0')
      setCriando(false)
    } else {
      alert('Erro ao criar coleção: ' + error?.message)
    }
    setSalvandoNova(false)
  }

  async function salvarEdicao() {
    if (!editandoId || !editNome.trim()) return
    setSalvandoEdicao(true)
    const { error } = await supabase.from('colecoes').update({
      nome: editNome.trim(),
      descricao: editDescricao.trim() || null,
      ordem: parseInt(editOrdem) || 0,
      ativo: editAtivo,
    }).eq('id', editandoId)

    if (!error) {
      setLista(prev => prev.map(c =>
        c.id === editandoId
          ? { ...c, nome: editNome.trim(), descricao: editDescricao.trim() || null, ordem: parseInt(editOrdem) || 0, ativo: editAtivo }
          : c
      ).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)))
      setEditandoId(null)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
    setSalvandoEdicao(false)
  }

  async function deletarColecao(id: string) {
    const col = lista.find(c => c.id === id)
    if (!col) return
    if (!confirm(`Excluir a coleção "${col.nome}"? Os materiais não serão excluídos.`)) return
    setDeletandoId(id)
    const { error } = await supabase.from('colecoes').delete().eq('id', id)
    if (!error) {
      setLista(prev => prev.filter(c => c.id !== id))
    } else {
      alert('Erro ao excluir: ' + error.message)
    }
    setDeletandoId(null)
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Botão criar */}
      {!criando && (
        <button onClick={() => setCriando(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '12px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginBottom: '24px' }}>
          <Plus size={16} /> Nova coleção
        </button>
      )}

      {/* Form nova coleção */}
      {criando && (
        <div style={{ background: '#ffffff08', border: '1px solid #9900ff44', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#fff', margin: '0 0 16px' }}>
            Nova coleção
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Nome *</label>
              <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
                placeholder="Ex: Festa Junina 2025" style={inputStyle} autoFocus />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Descrição</label>
              <input value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)}
                placeholder="Descrição opcional..." style={inputStyle} />
            </div>
            <div>
              <label style={lbl}>Ordem</label>
              <input type="number" value={novaOrdem} onChange={e => setNovaOrdem(e.target.value)}
                style={{ ...inputStyle, width: '100px' }} min={0} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setCriando(false); setNovoNome(''); setNovaDescricao(''); setNovaOrdem('0') }}
              style={{ background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '10px', padding: '10px 18px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={criarColecao} disabled={salvandoNova || !novoNome.trim()}
              style={{ background: (!novoNome.trim() || salvandoNova) ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: (!novoNome.trim() || salvandoNova) ? 'not-allowed' : 'pointer' }}>
              {salvandoNova ? 'Criando...' : 'Criar coleção'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de coleções */}
      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#ffffff05', borderRadius: '16px', border: '1px solid #ffffff10' }}>
          <Layers size={32} style={{ color: '#ffffff22', marginBottom: '12px' }} />
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#ffffff33', margin: '0 0 6px' }}>
            Nenhuma coleção criada ainda
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff22', margin: 0 }}>
            Crie a primeira coleção para organizar seus materiais
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lista.map(col => (
            <div key={col.id}
              style={{ background: '#ffffff08', border: `1px solid ${editandoId === col.id ? '#9900ff44' : '#ffffff12'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

              {editandoId === col.id ? (
                /* Form de edição */
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lbl}>Nome *</label>
                      <input value={editNome} onChange={e => setEditNome(e.target.value)} style={inputStyle} autoFocus />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lbl}>Descrição</label>
                      <input value={editDescricao} onChange={e => setEditDescricao(e.target.value)}
                        placeholder="Descrição opcional..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={lbl}>Ordem</label>
                      <input type="number" value={editOrdem} onChange={e => setEditOrdem(e.target.value)}
                        style={{ ...inputStyle, width: '100px' }} min={0} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button type="button" onClick={() => setEditAtivo(!editAtivo)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: editAtivo ? '#00ff8815' : '#ffffff08', border: `1px solid ${editAtivo ? '#00ff8844' : '#ffffff18'}`, borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', color: editAtivo ? '#00ff88' : '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600 }}>
                        <div style={{ width: 28, height: 16, borderRadius: '999px', background: editAtivo ? '#00ff88' : '#ffffff18', position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: editAtivo ? 15 : 3, transition: 'left .2s' }} />
                        </div>
                        {editAtivo ? 'Ativa' : 'Inativa'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={cancelarEdicao}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: '9px', padding: '8px 14px', color: '#ffffff66', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                      <X size={13} /> Cancelar
                    </button>
                    <button onClick={salvarEdicao} disabled={salvandoEdicao || !editNome.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: (!editNome.trim() || salvandoEdicao) ? '#ffffff22' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '9px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: (!editNome.trim() || salvandoEdicao) ? 'not-allowed' : 'pointer' }}>
                      <Check size={13} /> {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Linha normal */
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                  {/* Ordem */}
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: '#ffffff08', border: '1px solid #ffffff12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: '#ffffff44' }}>
                      {col.ordem}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: col.descricao ? '2px' : 0 }}>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: col.ativo ? '#fff' : '#ffffff44' }}>
                        {col.nome}
                      </span>
                      {!col.ativo && (
                        <span style={{ background: '#ffffff10', color: '#ffffff33', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px' }}>
                          Inativa
                        </span>
                      )}
                    </div>
                    {col.descricao && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {col.descricao}
                      </p>
                    )}
                  </div>

                  {/* Contagem */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#9900ff' }}>
                      {col.total_materiais}
                    </span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', marginLeft: '4px' }}>
                      material{col.total_materiais !== 1 ? 'is' : ''}
                    </span>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => abrirEdicao(col)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#ffffff0d', border: '1px solid #ffffff18', borderRadius: '8px', color: '#ffffff66', cursor: 'pointer' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deletarColecao(col.id)} disabled={deletandoId === col.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: '#ef444410', border: '1px solid #ef444430', borderRadius: '8px', color: '#ef4444', cursor: deletandoId === col.id ? 'not-allowed' : 'pointer', opacity: deletandoId === col.id ? 0.5 : 1 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
