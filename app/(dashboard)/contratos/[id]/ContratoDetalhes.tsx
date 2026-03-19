'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// ── Ícones ───────────────────────────────────────────────
const IconCopy    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="8" height="8" rx="1.5"/><path d="M3.5 3.5V2A1 1 0 0 0 2.5 1h-1A1 1 0 0 0 .5 2v1a1 1 0 0 0 1 1h1"/></svg>
const IconCheck   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L11 3"/></svg>
const IconPrint   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4V2h7v2"/><rect x="1" y="4" width="11" height="6" rx="1.5"/><path d="M3 10v1h7v-1"/><circle cx="9.5" cy="7" r=".5" fill="currentColor"/></svg>
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 8h5l.5-8"/></svg>
const IconPen     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5l2.5 2.5-7 7H2v-2.5l7-7z"/></svg>
const IconEraser  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11h9M9 2L11.5 4.5 5.5 10.5 3 8l6-6z"/></svg>
const IconSearch  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5L12 12"/></svg>
const IconX       = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l8 8M10 2L2 10"/></svg>
const IconLink    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 7a3 3 0 0 0 4.2 0l1.2-1.2a3 3 0 0 0-4.2-4.2L5.5 2.8"/><path d="M7.5 6a3 3 0 0 0-4.2 0L2.1 7.2a3 3 0 0 0 4.2 4.2L7.5 10.2"/></svg>
const IconPlus    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6.5 2v9M2 6.5h9"/></svg>

interface Cliente { id: string; nome: string; telefone: string | null; email: string | null }

interface Perfil {
  nome_loja: string | null; cpf_cnpj: string | null; telefone: string | null
  endereco: string | null; assinatura_loja: string | null
}

interface Props {
  contrato: {
    id: string; cliente_id: string | null; cliente_nome: string | null; cliente_cpf: string | null
    cliente_telefone: string | null; cliente_email: string | null; cliente_endereco: string | null
    evento_data: string; evento_local: string | null; evento_horario: string | null
    itens: { id: number; descricao: string; quantidade: number; valor: number }[]
    valor_total: number; forma_pagamento: string | null; valor_sinal: number
    regras: string | null; status: string; token_assinatura: string
    assinado_em: string | null; assinatura_dados: string | null
  }
  perfil: Perfil | null
  usuarioId: string
  clientesIniciais: Cliente[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#fafafa',
  border: '1px solid #e8e8ec', borderRadius: '10px', padding: '10px 12px',
  color: '#111827', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
}
const lbl: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600,
  color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase',
  marginBottom: '3px', display: 'block',
}
const val: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 500,
}
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e8ec', borderRadius: '14px',
  padding: '18px 20px', marginBottom: '10px',
}

const STATUS = {
  pendente:  { label: 'Aguardando assinatura', color: '#d97706', bg: '#fffbf0' },
  assinado:  { label: 'Assinado',              color: '#059669', bg: '#f0fdf9' },
  cancelado: { label: 'Cancelado',             color: '#dc2626', bg: '#fef2f2' },
}

// ── Seção de vínculo de cliente ──────────────────────────
function SecaoVinculoCliente({
  contratoId, usuarioId, clienteIdAtual, clienteNomeAtual,
  clienteTelefone, clienteEmail, clienteEndereco,
  clientes: clientesIniciais,
  onVinculou,
}: {
  contratoId: string
  usuarioId: string
  clienteIdAtual: string | null
  clienteNomeAtual: string | null
  clienteTelefone: string | null
  clienteEmail: string | null
  clienteEndereco: string | null
  clientes: Cliente[]
  onVinculou: (clienteId: string, clienteNome: string) => void
}) {
  const supabase = createClient()
  const [clientes, setClientes] = useState(clientesIniciais)
  const [busca, setBusca] = useState('')
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [clienteSel, setClienteSel] = useState<Cliente | null>(
    clienteIdAtual ? clientesIniciais.find(c => c.id === clienteIdAtual) ?? null : null
  )
  const [vinculando, setVinculando] = useState(false)
  const [vinculado, setVinculado] = useState(!!clienteIdAtual)
  const [mostrarCriar, setMostrarCriar] = useState(false)

  // Form de criar novo cliente pré-preenchido com dados do contrato
  const [formNovo, setFormNovo] = useState({
    nome: clienteNomeAtual ?? '',
    telefone: clienteTelefone ?? '',
    email: clienteEmail ?? '',
    endereco: clienteEndereco ?? '',
  })
  const [criando, setCriando] = useState(false)
  const [erroCriar, setErroCriar] = useState('')

  const clientesFiltrados = useMemo(() =>
    busca.trim().length >= 1
      ? clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 6)
      : []
  , [busca, clientes])

  function selecionarCliente(c: Cliente) {
    setClienteSel(c)
    setBusca(c.nome)
    setMostrarSugestoes(false)
  }

  async function vincular() {
    if (!clienteSel) return
    setVinculando(true)
    const { error } = await supabase
      .from('contratos')
      .update({ cliente_id: clienteSel.id })
      .eq('id', contratoId)
    if (!error) {
      setVinculado(true)
      onVinculou(clienteSel.id, clienteSel.nome)
    }
    setVinculando(false)
  }

  async function criarEVincular() {
    if (!formNovo.nome.trim()) return setErroCriar('Nome é obrigatório')
    setCriando(true); setErroCriar('')
    try {
      // Cria o cliente
      const { data: novoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({
          usuario_id: usuarioId,
          nome: formNovo.nome.trim(),
          telefone: formNovo.telefone || null,
          email: formNovo.email || null,
          endereco: formNovo.endereco || null,
        })
        .select('id, nome, telefone, email')
        .single()

      if (errCliente || !novoCliente) {
        setErroCriar('Erro ao criar cliente: ' + (errCliente?.message ?? ''))
        return
      }

      // Vincula ao contrato
      await supabase
        .from('contratos')
        .update({ cliente_id: novoCliente.id })
        .eq('id', contratoId)

      setClientes(p => [...p, novoCliente as Cliente].sort((a, b) => a.nome.localeCompare(b.nome)))
      setClienteSel(novoCliente as Cliente)
      setBusca(novoCliente.nome)
      setVinculado(true)
      setMostrarCriar(false)
      onVinculou(novoCliente.id, novoCliente.nome)
    } finally {
      setCriando(false)
    }
  }

  if (vinculado && clienteSel) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ff33cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '12px', color: '#fff' }}>{clienteSel.nome.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>{clienteSel.nome}</p>
            {clienteSel.telefone && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', margin: 0 }}>{clienteSel.telefone}</p>}
          </div>
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#059669', background: '#dcfce7', borderRadius: '999px', padding: '3px 10px' }}>
          Vinculado
        </span>
      </div>
    )
  }

  return (
    <div>
      {/* Campo de busca mista */}
      {!mostrarCriar && (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', border: '1px solid #e8e8ec', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
            <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#9ca3af', flexShrink: 0 }}><IconSearch /></span>
            <input
              type="text"
              value={busca}
              onChange={e => { setBusca(e.target.value); setClienteSel(null); setMostrarSugestoes(true) }}
              onFocus={() => setMostrarSugestoes(true)}
              onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
              placeholder="Buscar cliente cadastrado..."
              style={{ ...inputStyle, border: 'none', background: 'transparent', flex: 1 }}
            />
            {busca && (
              <button onClick={() => { setBusca(''); setClienteSel(null) }} style={{ padding: '0 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <IconX />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {mostrarSugestoes && clientesFiltrados.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e8e8ec', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden', marginTop: '4px' }}>
              {clientesFiltrados.map(c => (
                <button key={c.id} type="button" onMouseDown={() => selecionarCliente(c)}
                  style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff0fb', border: '1px solid #ffd6f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '11px', color: '#ff33cc' }}>{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: '#111827', margin: 0 }}>{c.nome}</p>
                    {c.telefone && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{c.telefone}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Cliente selecionado + botão vincular */}
          {clienteSel && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={vincular} disabled={vinculando}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 16px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: vinculando ? 'not-allowed' : 'pointer', opacity: vinculando ? 0.7 : 1 }}>
                <IconLink /> {vinculando ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          )}

          {/* Botão criar novo */}
          <button onClick={() => setMostrarCriar(true)}
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed #e8e8ec', borderRadius: '999px', padding: '7px 14px', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <IconPlus /> Criar novo cliente com os dados do contrato
          </button>
        </div>
      )}

      {/* Form de criar novo cliente */}
      {mostrarCriar && (
        <div style={{ background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>Novo cliente</p>
            <button onClick={() => setMostrarCriar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}><IconX /></button>
          </div>
          <div>
            <label style={lbl}>Nome *</label>
            <input style={inputStyle} value={formNovo.nome} onChange={e => setFormNovo(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Telefone</label>
              <input style={inputStyle} value={formNovo.telefone} onChange={e => setFormNovo(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label style={lbl}>E-mail</label>
              <input type="email" style={inputStyle} value={formNovo.email} onChange={e => setFormNovo(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div>
            <label style={lbl}>Endereço</label>
            <input style={inputStyle} value={formNovo.endereco} onChange={e => setFormNovo(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro..." />
          </div>
          {erroCriar && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: 0 }}>{erroCriar}</p>}
          <button onClick={criarEVincular} disabled={criando}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: criando ? '#f0f0f0' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '11px', color: criando ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: criando ? 'not-allowed' : 'pointer' }}>
            <IconPlus /> {criando ? 'Criando...' : 'Criar cliente e vincular'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ContratoDetalhes({ contrato: contratoInicial, perfil, usuarioId, clientesIniciais }: Props) {
  const [contrato, setContrato] = useState(contratoInicial)
  const [copiado, setCopiado] = useState(false)
  const [confirmDeletar, setConfirmDeletar] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [assinaturaLocal, setAssinaturaLocal] = useState<string | null>(null)
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false)

  useEffect(() => {
    if (assinaturaLocal || contrato.assinatura_dados) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#e8e8ec'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, canvas.height - 30)
    ctx.lineTo(canvas.width - 20, canvas.height - 30)
    ctx.stroke()
    ctx.setLineDash([])
  }, [assinaturaLocal, contrato.assinatura_dados])

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function iniciarDesenho(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    setDesenhando(true)
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!desenhando) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
  }

  function finalizarDesenho() {
    if (!desenhando) return
    setDesenhando(false)
    setAssinaturaLocal(canvasRef.current!.toDataURL('image/png'))
  }

  function limparAssinatura() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#e8e8ec'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(20, canvas.height - 30); ctx.lineTo(canvas.width - 20, canvas.height - 30); ctx.stroke()
    ctx.setLineDash([]); setAssinaturaLocal(null)
  }

  async function salvarAssinatura() {
    if (!assinaturaLocal) return
    setSalvandoAssinatura(true)
    await supabase.from('contratos').update({ assinatura_dados: assinaturaLocal, assinado_em: new Date().toISOString(), status: 'assinado' }).eq('id', contrato.id)
    setSalvandoAssinatura(false)
    router.refresh()
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/assinar/${contrato.token_assinatura}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function deletarContrato() {
    setDeletando(true)
    await supabase.from('contratos').delete().eq('id', contrato.id)
    router.push('/contratos')
  }

  function imprimirContrato() {
    const dataEvento = new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')
    const dataAssinatura = contrato.assinado_em ? new Date(contrato.assinado_em).toLocaleString('pt-BR') : null
    const itensHtml = contrato.itens.map(item => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${item.descricao}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantidade}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right">R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700">R$ ${(item.quantidade * item.valor).toFixed(2).replace('.', ',')}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrato</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Times New Roman',serif;font-size:12pt;color:#111;padding:60px 80px;line-height:1.6}
    h1{font-size:18pt;text-align:center;text-transform:uppercase;letter-spacing:3px;margin-bottom:4px}.sub{text-align:center;font-size:11pt;color:#555;margin-bottom:28px}
    hr{border:none;border-top:2px solid #111;margin:6px 0 28px}.st{font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #111;padding-bottom:4px;margin:22px 0 12px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px 32px;margin-bottom:8px}.campo label{font-size:9pt;text-transform:uppercase;letter-spacing:0.5px;color:#777;display:block;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;margin-top:8px}thead td{padding:8px 12px;font-weight:bold;font-size:10pt;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ddd;background:#f5f5f5}
    .total td{padding:12px;border-top:2px solid #111;font-weight:bold;font-size:12pt}.regras{font-size:10pt;line-height:1.8;color:#333;white-space:pre-wrap}
    .sigs{margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:60px}.sig{text-align:center}.sig-line{border-top:1px solid #111;margin-top:60px;padding-top:8px;font-size:10pt}
    .sig-img{max-height:80px;margin-bottom:-20px}.footer{margin-top:40px;text-align:center;font-size:9pt;color:#888;border-top:1px solid #ddd;padding-top:12px}
    @media print{body{padding:40px 60px}@page{margin:0}}</style></head><body>
    ${perfil?.nome_loja ? `<div style="text-align:center;margin-bottom:20px"><h2 style="font-size:14pt">${perfil.nome_loja}</h2><p style="font-size:10pt;color:#555">${perfil.cpf_cnpj ?? ''}${perfil.telefone ? ` · ${perfil.telefone}` : ''}${perfil.endereco ? ` · ${perfil.endereco}` : ''}</p></div>` : ''}
    <h1>Contrato de Locação</h1><div class="sub">Locação de itens para eventos e festas</div><hr>
    <div class="st">Das Partes</div>
    <p style="margin-bottom:8px"><strong>LOCADOR:</strong> ${perfil?.nome_loja ?? '___________________________'}${perfil?.cpf_cnpj ? `, CPF/CNPJ nº ${perfil.cpf_cnpj}` : ''}${perfil?.telefone ? `, tel. ${perfil.telefone}` : ''}${perfil?.endereco ? `, ${perfil.endereco}` : ''}.</p>
    <p><strong>LOCATÁRIO:</strong> ${contrato.cliente_nome || '___________________________'}${contrato.cliente_cpf ? `, CPF nº ${contrato.cliente_cpf}` : ''}${contrato.cliente_telefone ? `, tel. ${contrato.cliente_telefone}` : ''}${contrato.cliente_endereco ? `, ${contrato.cliente_endereco}` : ''}.</p>
    <div class="st">Do Evento</div>
    <div class="g2"><div class="campo"><label>Data</label><span>${dataEvento}</span></div>${contrato.evento_horario ? `<div class="campo"><label>Horário</label><span>${contrato.evento_horario}</span></div>` : ''}${contrato.evento_local ? `<div class="campo" style="grid-column:1/-1"><label>Local</label><span>${contrato.evento_local}</span></div>` : ''}</div>
    <div class="st">Dos Itens Locados</div>
    <table><thead><tr><td>Descrição</td><td style="text-align:center">Qtd</td><td style="text-align:right">Valor Unit.</td><td style="text-align:right">Total</td></tr></thead>
    <tbody>${itensHtml}</tbody><tr class="total"><td colspan="3">Total</td><td style="text-align:right">R$ ${Number(contrato.valor_total).toFixed(2).replace('.', ',')}</td></tr></table>
    <div class="st">Do Pagamento</div>
    <div class="g2">${contrato.forma_pagamento ? `<div class="campo"><label>Forma</label><span>${contrato.forma_pagamento}</span></div>` : ''}${Number(contrato.valor_sinal) > 0 ? `<div class="campo"><label>Sinal</label><span>R$ ${Number(contrato.valor_sinal).toFixed(2).replace('.', ',')}</span></div><div class="campo"><label>Restante</label><span>R$ ${(Number(contrato.valor_total) - Number(contrato.valor_sinal)).toFixed(2).replace('.', ',')}</span></div>` : ''}</div>
    ${contrato.regras ? `<div class="st">Das Responsabilidades</div><div class="regras">${contrato.regras}</div>` : ''}
    <div class="sigs"><div class="sig">${perfil?.assinatura_loja ? `<img src="${perfil.assinatura_loja}" class="sig-img" />` : ''}<div class="sig-line"><strong>${perfil?.nome_loja ?? 'Locador'}</strong><br>Locador</div></div>
    <div class="sig">${contrato.assinatura_dados ? `<img src="${contrato.assinatura_dados}" class="sig-img" />` : ''}<div class="sig-line"><strong>${contrato.cliente_nome || '___________________________'}</strong><br>Locatário${dataAssinatura ? `<br><small>Assinado em ${dataAssinatura}</small>` : ''}</div></div></div>
    <div class="footer">Documento gerado eletronicamente · ${new Date().toLocaleDateString('pt-BR')}${perfil?.nome_loja ? ` · ${perfil.nome_loja}` : ''}</div>
    </body></html>`
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(html); janela.document.close(); janela.focus()
    setTimeout(() => janela.print(), 500)
  }

  const badge = STATUS[contrato.status as keyof typeof STATUS] ?? STATUS.pendente

  return (
    <div>

      {/* ── Status + Ações ── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ background: badge.bg, color: badge.color, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', padding: '5px 12px', borderRadius: '999px' }}>
          {badge.label}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {contrato.status === 'pendente' && (
            <button onClick={copiarLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: copiado ? '#f0fdf9' : '#fff0fb', border: `1.5px solid ${copiado ? '#bbf7d0' : '#ffd6f5'}`, borderRadius: '999px', padding: '8px 14px', color: copiado ? '#059669' : '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              {copiado ? <><IconCheck /> Copiado!</> : <><IconCopy /> Copiar link</>}
            </button>
          )}
          <button onClick={imprimirContrato} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            <IconPrint /> PDF / Imprimir
          </button>
          {confirmDeletar ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={deletarContrato} disabled={deletando} style={{ background: '#ef4444', border: 'none', borderRadius: '999px', padding: '8px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {deletando ? 'Deletando...' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmDeletar(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '999px', padding: '8px 14px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeletar(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: '999px', padding: '8px 14px', color: '#ef4444', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              <IconTrash /> Deletar
            </button>
          )}
        </div>
      </div>

      {/* ── Vínculo de cliente ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: 0 }}>Cliente</p>
          {!contrato.cliente_id && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#f59e0b', fontWeight: 600, background: '#fffbf0', border: '1px solid #fde68a', borderRadius: '999px', padding: '2px 8px' }}>
              Sem vínculo
            </span>
          )}
        </div>

        {/* Dados do contrato (nome, cpf etc. que o cliente preencheu ao assinar) */}
        {contrato.cliente_nome && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
            {([
              { label: 'Nome', valor: contrato.cliente_nome },
              { label: 'CPF', valor: contrato.cliente_cpf },
              { label: 'Telefone', valor: contrato.cliente_telefone },
              { label: 'E-mail', valor: contrato.cliente_email },
              { label: 'Endereço', valor: contrato.cliente_endereco },
            ] as { label: string; valor: string | null }[]).filter(c => c.valor).map(c => (
              <div key={c.label}>
                <span style={lbl}>{c.label}</span>
                <span style={val}>{c.valor}</span>
              </div>
            ))}
          </div>
        )}

        {!contrato.cliente_nome && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', margin: '0 0 14px' }}>
            Aguardando o cliente preencher os dados pelo link de assinatura.
          </p>
        )}

        {/* Seção de vínculo */}
        <SecaoVinculoCliente
          contratoId={contrato.id}
          usuarioId={usuarioId}
          clienteIdAtual={contrato.cliente_id}
          clienteNomeAtual={contrato.cliente_nome}
          clienteTelefone={contrato.cliente_telefone}
          clienteEmail={contrato.cliente_email}
          clienteEndereco={contrato.cliente_endereco}
          clientes={clientesIniciais}
          onVinculou={(clienteId, clienteNome) => {
            setContrato(c => ({ ...c, cliente_id: clienteId, cliente_nome: clienteNome }))
          }}
        />
      </div>

      {/* ── Evento ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 14px' }}>Evento</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div><span style={lbl}>Data</span><span style={val}>{new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')}</span></div>
          {contrato.evento_horario && <div><span style={lbl}>Horário</span><span style={val}>{contrato.evento_horario}</span></div>}
          {contrato.evento_local && <div><span style={lbl}>Local</span><span style={val}>{contrato.evento_local}</span></div>}
        </div>
      </div>

      {/* ── Itens ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 14px' }}>Itens locados</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              {['Descrição', 'Qtd', 'Valor unit.', 'Total'].map(c => (
                <th key={c} style={{ textAlign: 'left', padding: '6px 0', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contrato.itens.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '10px 0', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827' }}>{item.descricao}</td>
                <td style={{ padding: '10px 0', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827' }}>{item.quantidade}</td>
                <td style={{ padding: '10px 0', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827' }}>R$ {item.valor.toFixed(2).replace('.', ',')}</td>
                <td style={{ padding: '10px 0', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#111827', fontWeight: 700 }}>R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280' }}>Total</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#111827', letterSpacing: '-0.3px' }}>R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── Pagamento ── */}
      <div style={card}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 14px' }}>Pagamento</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          {contrato.forma_pagamento && <div><span style={lbl}>Forma</span><span style={val}>{contrato.forma_pagamento}</span></div>}
          <div><span style={lbl}>Sinal</span><span style={val}>R$ {Number(contrato.valor_sinal).toFixed(2).replace('.', ',')}</span></div>
          <div><span style={lbl}>Restante</span><span style={{ ...val, color: '#ff33cc', fontWeight: 700 }}>R$ {(Number(contrato.valor_total) - Number(contrato.valor_sinal)).toFixed(2).replace('.', ',')}</span></div>
        </div>
      </div>

      {/* ── Regras ── */}
      {contrato.regras && (
        <div style={card}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 12px' }}>Regras</p>
          <pre style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>{contrato.regras}</pre>
        </div>
      )}

      {/* ── Campo de assinatura ── */}
      {contrato.status !== 'assinado' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#111827', margin: '0 0 2px' }}>Assinar aqui</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>Desenhe sua assinatura no campo abaixo</p>
            </div>
            {assinaturaLocal && (
              <button onClick={limparAssinatura} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fafafa', border: '1px solid #e8e8ec', borderRadius: '999px', padding: '6px 12px', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                <IconEraser /> Limpar
              </button>
            )}
          </div>
          <div style={{ border: '1.5px solid #e8e8ec', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', background: '#fff', cursor: 'crosshair', touchAction: 'none' }}>
            <canvas ref={canvasRef} width={700} height={160} style={{ width: '100%', height: 'auto', display: 'block' }}
              onMouseDown={iniciarDesenho} onMouseMove={desenhar} onMouseUp={finalizarDesenho} onMouseLeave={finalizarDesenho}
              onTouchStart={iniciarDesenho} onTouchMove={desenhar} onTouchEnd={finalizarDesenho}
            />
          </div>
          <button onClick={salvarAssinatura} disabled={!assinaturaLocal || salvandoAssinatura}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', background: !assinaturaLocal ? '#f3f4f6' : '#ff33cc', border: 'none', borderRadius: '999px', padding: '12px', color: !assinaturaLocal ? '#9ca3af' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: !assinaturaLocal ? 'not-allowed' : 'pointer', transition: 'background .2s' }}>
            <IconPen /> {salvandoAssinatura ? 'Salvando...' : 'Confirmar assinatura'}
          </button>
        </div>
      )}

      {/* ── Assinado ── */}
      {contrato.status === 'assinado' && contrato.assinado_em && (
        <div style={{ background: '#f0fdf9', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: contrato.assinatura_dados ? '14px' : '0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '999px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconCheck />
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#059669', margin: '0 0 2px' }}>Contrato assinado digitalmente</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#6b7280', margin: 0 }}>{new Date(contrato.assinado_em).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          {contrato.assinatura_dados && (
            <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', border: '1px solid #dcfce7' }}>
              <span style={{ ...lbl, marginBottom: '8px' }}>Assinatura</span>
              <Image src={contrato.assinatura_dados} alt="Assinatura" width={300} height={80} style={{ maxHeight: '80px', width: 'auto', display: 'block' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}