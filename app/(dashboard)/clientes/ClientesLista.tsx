'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye } from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  data_aniversario: string | null
  criado_em: string
}

interface Props {
  clientes: Cliente[]
  usuarioId: string
  buscaInicial: string
  somenteLeitura?: boolean
}

const IconSearch = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3 3"/></svg>
const IconX     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l7 7M10 3L3 10"/></svg>
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconUser  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="4.5" r="2.5"/><path d="M2 12c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/></svg>
const IconCake  = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="5.5" width="10" height="5.5" rx="1"/><path d="M3.5 5.5V4M6 5.5V4M8.5 5.5V4"/></svg>
const IconChev  = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 4-4 4"/></svg>

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#fafafa',
  border: '1px solid #e8e8ec', borderRadius: '10px', padding: '10px 12px',
  color: '#111827', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
  fontWeight: 600, color: '#9ca3af', marginBottom: '5px',
  letterSpacing: '0.5px', textTransform: 'uppercase',
}

function ModalNovoCliente({ usuarioId, onClose, onSalvo }: {
  usuarioId: string
  onClose: () => void
  onSalvo: (c: Cliente) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', data_aniversario: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function salvar() {
    if (!form.nome.trim()) return setErro('Nome é obrigatório')
    setSalvando(true); setErro('')
    try {
      const { data, error } = await supabase.from('clientes').insert({
        usuario_id: usuarioId,
        nome: form.nome.trim(),
        telefone: form.telefone || null,
        email: form.email || null,
        data_aniversario: form.data_aniversario || null,
      }).select('id, nome, telefone, email, data_aniversario, criado_em').single()
      if (error) { setErro('Erro ao salvar: ' + error.message); return }
      onSalvo(data as Cliente)
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 32px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px 24px 0 0' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#111827', margin: 0 }}>Novo cliente</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>Preencha os dados básicos</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e8e8ec', background: '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}><IconX /></button>
        </div>
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input style={inputStyle} placeholder="Nome do cliente" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus onKeyDown={e => e.key === 'Enter' && salvar()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input style={inputStyle} placeholder="(00) 00000-0000" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input type="email" style={inputStyle} placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Aniversário</label>
            <input type="date" style={inputStyle} value={form.data_aniversario} onChange={e => setForm(f => ({ ...f, data_aniversario: e.target.value }))} />
          </div>
          {erro && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{erro}</p>}
          <button onClick={salvar} disabled={salvando} style={{ width: '100%', padding: '14px', background: salvando ? '#f0f0f0' : '#ff33cc', border: 'none', borderRadius: '999px', color: salvando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer' }}>
            {salvando ? 'Salvando...' : 'Cadastrar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientesLista({ clientes: clientesIniciais, usuarioId, buscaInicial, somenteLeitura = false }: Props) {
  const [clientes, setClientes] = useState(clientesIniciais)
  const [busca, setBusca] = useState(buscaInicial)
  const [modalAberto, setModalAberto] = useState(false)
  const router = useRouter()

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const clientesFiltrados = busca.trim()
    ? clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))
    : clientes

  return (
    <div>
      {/* Banner somente leitura */}
      {somenteLeitura && (
        <div style={{ background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={14} style={{ color: '#d97706', flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#92400e', margin: 0 }}>
              <strong>Somente leitura</strong> — você vê os clientes dos seus contratos. Faça upgrade para o plano <strong>Avançado</strong> para gerenciar.
            </p>
          </div>
          <a href="/planos" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap', textDecoration: 'none', border: '1px solid #fcd34d', borderRadius: '999px', padding: '4px 12px', background: '#fff' }}>
            Ver planos →
          </a>
        </div>
      )}

      {/* Barra de ações */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><IconSearch /></span>
          <input
            style={{ ...inputStyle, paddingLeft: '36px', paddingRight: busca ? '36px' : '12px' }}
            placeholder="Buscar cliente pelo nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <IconX />
            </button>
          )}
        </div>
        {!somenteLeitura && (
          <button onClick={() => setModalAberto(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '10px 18px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>
            <IconPlus /> Novo cliente
          </button>
        )}
      </div>

      {/* Lista */}
      {clientesFiltrados.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {clientesFiltrados.map(cliente => {
            const aniversarioHoje = cliente.data_aniversario
              ? new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) === hoje
              : false

            return (
              <div
                key={cliente.id}
                onClick={() => !somenteLeitura && router.push(`/clientes/${cliente.id}`)}
                style={{ background: aniversarioHoje ? '#fff5fd' : '#fff', border: `1px solid ${aniversarioHoje ? '#ffd6f5' : '#e8e8ec'}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: somenteLeitura ? 'default' : 'pointer', transition: 'border-color .15s' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff0fb', border: '1px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#ff33cc' }}>
                    {cliente.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cliente.nome}
                    </p>
                    {aniversarioHoje && (
                      <span style={{ background: '#fff0fb', border: '1px solid #ffd6f5', borderRadius: '999px', padding: '1px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#ff33cc', flexShrink: 0 }}>
                        Aniversário hoje
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {cliente.telefone && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af' }}>{cliente.telefone}</span>}
                    {cliente.email && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.email}</span>}
                    {cliente.data_aniversario && !aniversarioHoje && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#d1d5db' }}>
                        <IconCake />
                        {new Date(cliente.data_aniversario + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                {!somenteLeitura && <span style={{ color: '#d1d5db', flexShrink: 0 }}><IconChev /></span>}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e8e8ec', borderRadius: '16px', textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f9f9f9', border: '1px solid #e8e8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#d1d5db' }}>
            <IconUser />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#374151', margin: '0 0 4px' }}>
            {busca ? 'Nenhum cliente encontrado' : somenteLeitura ? 'Nenhum cliente nos contratos' : 'Nenhum cliente ainda'}
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>
            {busca ? 'Tente buscar por outro nome' : somenteLeitura ? 'Os clientes dos seus contratos aparecerão aqui' : 'Cadastre seu primeiro cliente'}
          </p>
          {!busca && !somenteLeitura && (
            <button onClick={() => setModalAberto(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '10px 20px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              <IconPlus /> Cadastrar cliente
            </button>
          )}
        </div>
      )}

      {/* Modal — só abre se não for somente leitura */}
      {modalAberto && !somenteLeitura && (
        <ModalNovoCliente
          usuarioId={usuarioId}
          onClose={() => setModalAberto(false)}
          onSalvo={c => setClientes(p => [...p, c].sort((a, b) => a.nome.localeCompare(b.nome)))}
        />
      )}
    </div>
  )
}