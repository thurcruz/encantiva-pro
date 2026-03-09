'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Plus, Trash2, ExternalLink, Package, Tag, Copy, Check } from 'lucide-react'

const CATEGORIAS = [
  'Mesversário', 'Aniversário', 'Batizado', '1ª Eucaristia',
  'Noivado', '15 Anos', 'Casamento', 'Chá de Bebê',
  'Chá de Panela', 'Chá de Lingerie', 'Chá Revelação', 'Bodas',
]

const ITENS_KIT = ['Decoração', 'Painel', 'Lembrançinhas']

interface Tema {
  id: string
  nome: string
  categoria: string
  foto_url: string | null
  ativo: boolean
}

interface Kit {
  id: string
  usuario_id: string
  nome: string
  descricao: string | null
  preco: number
  itens: string[]
}

interface Adicional {
  id: string
  usuario_id: string
  nome: string
  preco: number
}

interface Pedido {
  id: string
  tema_id: string
  catalogo_kit_id: string
  nome_cliente: string
  telefone_cliente: string | null
  data_evento: string
  forma_pagamento: string | null
  adicionais: string[]
  valor_total: number
  status: string
  observacoes: string | null
  criado_em: string
}

interface Props {
  usuarioId: string
  temasIniciais: Tema[]
  kitsIniciais: Kit[]
  adicionaisIniciais: Adicional[]
  pedidosIniciais: Pedido[]
}

export default function CatalogoManager({ usuarioId, temasIniciais, kitsIniciais, adicionaisIniciais, pedidosIniciais }: Props) {
  const supabase = createClient()

  const [temas, setTemas] = useState<Tema[]>(temasIniciais)
  const [kits, setKits] = useState<Kit[]>(kitsIniciais)
  const [adicionais, setAdicionais] = useState<Adicional[]>(adicionaisIniciais)
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciais)
  const [abaAtiva, setAbaAtiva] = useState<'temas' | 'kits' | 'adicionais' | 'pedidos'>('temas')
  const [salvando, setSalvando] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const [novoTema, setNovoTema] = useState({ nome: '', categoria: CATEGORIAS[0], foto_url: '' })
  const [novoKit, setNovoKit] = useState({ nome: '', descricao: '', preco: '', itens: [] as string[] })
  const [novoAdicional, setNovoAdicional] = useState({ nome: '', preco: '' })

  const linkPublico = `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/${usuarioId}`

  async function copiarLink() {
    await navigator.clipboard.writeText(linkPublico)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function criarTema() {
    if (!novoTema.nome.trim()) return
    setSalvando(true)
    const { data, error } = await supabase.from('catalogo_temas').insert({
      usuario_id: usuarioId, nome: novoTema.nome, categoria: novoTema.categoria,
      foto_url: novoTema.foto_url || null, ativo: true,
    }).select().single()
    if (!error && data) { setTemas(prev => [data, ...prev]); setNovoTema({ nome: '', categoria: CATEGORIAS[0], foto_url: '' }) }
    setSalvando(false)
  }

  async function deletarTema(id: string) {
    await supabase.from('catalogo_temas').delete().eq('id', id)
    setTemas(prev => prev.filter(t => t.id !== id))
  }

  async function criarKit() {
    if (!novoKit.nome.trim() || !novoKit.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('catalogo_kits').insert({
      usuario_id: usuarioId, nome: novoKit.nome, descricao: novoKit.descricao || null,
      preco: parseFloat(novoKit.preco), itens: novoKit.itens,
    }).select().single()
    if (!error && data) { setKits(prev => [data, ...prev]); setNovoKit({ nome: '', descricao: '', preco: '', itens: [] }) }
    setSalvando(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('catalogo_kits').delete().eq('id', id)
    setKits(prev => prev.filter(k => k.id !== id))
  }

  async function criarAdicional() {
    if (!novoAdicional.nome.trim() || !novoAdicional.preco) return
    setSalvando(true)
    const { data, error } = await supabase.from('adicionais').insert({
      usuario_id: usuarioId, nome: novoAdicional.nome, preco: parseFloat(novoAdicional.preco),
    }).select().single()
    if (!error && data) { setAdicionais(prev => [data, ...prev]); setNovoAdicional({ nome: '', preco: '' }) }
    setSalvando(false)
  }

  async function deletarAdicional(id: string) {
    await supabase.from('adicionais').delete().eq('id', id)
    setAdicionais(prev => prev.filter(a => a.id !== id))
  }

  async function atualizarStatusPedido(id: string, status: string) {
    await supabase.from('pedidos').update({ status }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const cardStyle = { background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px', padding: '24px', marginBottom: '20px' }
  const inputStyle = { width: '100%', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '12px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' as const }

  const statusCor: Record<string, string> = {
    pendente: '#ff9900', confirmado: '#00aa55', cancelado: '#ff3333', concluido: '#9900ff',
  }

  return (
    <div>

      {/* Link público */}
      <div style={{ background: 'linear-gradient(135deg, #fff5fd, #f5f0ff)', border: '1px solid #ff33cc22', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 8px 0' }}>
          🔗 Seu link de pedidos
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#9900ff', margin: '0 0 12px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {linkPublico}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copiarLink} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: linkCopiado ? '#00aa55' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            {linkCopiado ? <Check size={14} /> : <Copy size={14} />}
            {linkCopiado ? 'Copiado!' : 'Copiar link'}
          </button>
          <a href={linkPublico} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', flexShrink: 0 }}>
            <ExternalLink size={16} style={{ color: '#9900ff' }} />
          </a>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { key: 'temas', label: '🎨 Temas', count: temas.length },
          { key: 'kits', label: '📦 Kits', count: kits.length },
          { key: 'adicionais', label: '✨ Adicionais', count: adicionais.length },
          { key: 'pedidos', label: '🛍️ Pedidos', count: pedidos.length },
        ].map(aba => (
          <button key={aba.key} onClick={() => setAbaAtiva(aba.key as typeof abaAtiva)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', whiteSpace: 'nowrap', background: abaAtiva === aba.key ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#fff', border: `1px solid ${abaAtiva === aba.key ? 'transparent' : '#e5e5e5'}`, borderRadius: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: abaAtiva === aba.key ? '#fff' : '#140033' }}>
            {aba.label}
            <span style={{ background: abaAtiva === aba.key ? 'rgba(255,255,255,0.25)' : '#f0f0f0', borderRadius: '20px', padding: '1px 7px', fontSize: '12px' }}>
              {aba.count}
            </span>
          </button>
        ))}
      </div>

      {/* ABA TEMAS */}
      {abaAtiva === 'temas' && (
        <>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>➕ Novo tema</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="cat-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome do tema</label>
                  <input value={novoTema.nome} onChange={e => setNovoTema(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Urso Marinheiro" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select value={novoTema.categoria} onChange={e => setNovoTema(p => ({ ...p, categoria: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>URL da foto (opcional)</label>
                <input value={novoTema.foto_url} onChange={e => setNovoTema(p => ({ ...p, foto_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
              </div>
              <button onClick={criarTema} disabled={salvando || !novoTema.nome.trim()} style={{ background: salvando || !novoTema.nome.trim() ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: salvando || !novoTema.nome.trim() ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando || !novoTema.nome.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} />
                {salvando ? 'Salvando...' : 'Adicionar tema'}
              </button>
            </div>
          </div>

          {temas.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>🎨</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>Nenhum tema cadastrado</p>
            </div>
          ) : (
            <div className="cat-temas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {temas.map(tema => (
                <div key={tema.id} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ height: '120px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {tema.foto_url ? (
                      <NextImage src={tema.foto_url} fill style={{ objectFit: 'cover' }} alt={tema.nome} unoptimized />
                    ) : (
                      <span style={{ fontSize: '32px' }}>🎨</span>
                    )}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                      {tema.categoria}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#140033', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.nome}</p>
                    <button onClick={() => deletarTema(tema.id)} style={{ width: '30px', height: '30px', background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '8px', color: '#ff33cc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ABA KITS */}
      {abaAtiva === 'kits' && (
        <>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>➕ Novo kit</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="cat-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome do kit</label>
                  <input value={novoKit.nome} onChange={e => setNovoKit(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Kit Básico" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Preço (R$)</label>
                  <input type="number" value={novoKit.preco} onChange={e => setNovoKit(p => ({ ...p, preco: e.target.value }))} placeholder="0,00" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <input value={novoKit.descricao} onChange={e => setNovoKit(p => ({ ...p, descricao: e.target.value }))} placeholder="O que está incluso..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Itens inclusos</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ITENS_KIT.map(item => (
                    <button key={item} onClick={() => setNovoKit(p => ({ ...p, itens: p.itens.includes(item) ? p.itens.filter(i => i !== item) : [...p.itens, item] }))} style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${novoKit.itens.includes(item) ? '#9900ff' : '#e5e5e5'}`, background: novoKit.itens.includes(item) ? '#f5f0ff' : '#fff', color: novoKit.itens.includes(item) ? '#9900ff' : '#00000055', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={criarKit} disabled={salvando || !novoKit.nome.trim() || !novoKit.preco} style={{ background: salvando || !novoKit.nome.trim() || !novoKit.preco ? '#e5e5e5' : 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: salvando || !novoKit.nome.trim() || !novoKit.preco ? '#00000033' : '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} />
                {salvando ? 'Salvando...' : 'Adicionar kit'}
              </button>
            </div>
          </div>

          {kits.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>📦</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>Nenhum kit cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {kits.map(kit => (
                <div key={kit.id} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ff33cc22, #9900ff22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={16} style={{ color: '#9900ff' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kit.nome}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                        {Array.isArray(kit.itens) ? kit.itens.join(', ') : 'Sem itens'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9900ff', margin: 0 }}>
                      R$ {Number(kit.preco).toFixed(2).replace('.', ',')}
                    </p>
                    <button onClick={() => deletarKit(kit.id)} style={{ width: '30px', height: '30px', background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '8px', color: '#ff33cc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ABA ADICIONAIS */}
      {abaAtiva === 'adicionais' && (
        <>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 16px 0' }}>➕ Novo adicional</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="cat-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input value={novoAdicional.nome} onChange={e => setNovoAdicional(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Fotografia" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Preço (R$)</label>
                  <input type="number" value={novoAdicional.preco} onChange={e => setNovoAdicional(p => ({ ...p, preco: e.target.value }))} placeholder="0,00" style={inputStyle} />
                </div>
              </div>
              <button onClick={criarAdicional} disabled={salvando || !novoAdicional.nome.trim() || !novoAdicional.preco} style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          </div>

          {adicionais.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>✨</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>Nenhum adicional cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {adicionais.map(adicional => (
                <div key={adicional.id} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Tag size={15} style={{ color: '#9900ff', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adicional.nome}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9900ff', margin: 0 }}>
                      R$ {Number(adicional.preco).toFixed(2).replace('.', ',')}
                    </p>
                    <button onClick={() => deletarAdicional(adicional.id)} style={{ width: '30px', height: '30px', background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '8px', color: '#ff33cc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ABA PEDIDOS */}
      {abaAtiva === 'pedidos' && (
        <>
          {pedidos.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>🛍️</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 8px 0' }}>Nenhum pedido ainda</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000055', margin: 0 }}>Compartilhe seu link para receber pedidos</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pedidos.map(pedido => {
                const tema = temas.find(t => t.id === pedido.tema_id)
                const kit = kits.find(k => k.id === pedido.catalogo_kit_id)
                return (
                  <div key={pedido.id} style={{ background: '#fff', border: '1px solid #eeeeee', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '10px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pedido.nome_cliente}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>
                          {tema?.nome ?? '—'} • {kit?.nome ?? '—'} • {new Date(pedido.data_evento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#9900ff', margin: 0, flexShrink: 0 }}>
                        R$ {Number(pedido.valor_total).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <select value={pedido.status} onChange={e => atualizarStatusPedido(pedido.id, e.target.value)} style={{ background: `${statusCor[pedido.status]}15`, border: `1px solid ${statusCor[pedido.status]}33`, borderRadius: '8px', padding: '7px 10px', color: statusCor[pedido.status], fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', cursor: 'pointer', outline: 'none', width: '100%' }}>
                      <option value="pendente">⏳ Pendente</option>
                      <option value="confirmado">✅ Confirmado</option>
                      <option value="concluido">🎉 Concluído</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                    {pedido.observacoes && (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '10px 0 0 0', background: '#f9f9f9', borderRadius: '8px', padding: '8px 12px' }}>
                        💬 {pedido.observacoes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 640px) {
          .cat-grid-2 { grid-template-columns: 1fr !important; }
          .cat-temas-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}