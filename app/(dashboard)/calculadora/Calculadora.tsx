'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Item {
  id: number
  nome: string
  custo: number
  meses: number
  festasporMes: number
}

interface Kit {
  id: string
  nome: string
  itens: Item[]
  lucro: number
  frete: number
  custo_vida: number
  criado_em: string
}

export default function Calculadora() {
  const [itens, setItens] = useState<Item[]>([
    { id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 },
  ])
  const [lucro, setLucro] = useState(30)
  const [frete, setFrete] = useState(0)
  const [custoVida, setCustoVida] = useState(0)

  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
  const [nomeKit, setNomeKit] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoKits, setCarregandoKits] = useState(false)

  const supabase = createClient()

  async function carregarKits() {
    setCarregandoKits(true)
    const { data } = await supabase
      .from('kits')
      .select('*')
      .order('criado_em', { ascending: false })
    if (data) setKits(data)
    setCarregandoKits(false)
  }

 useEffect(() => {
  carregarKits()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

  async function salvarKit() {
    if (!nomeKit.trim()) return
    setSalvando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editandoId) {
      await supabase
        .from('kits')
        .update({
          nome: nomeKit,
          itens,
          lucro,
          frete,
          custo_vida: custoVida,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', editandoId)
    } else {
      await supabase
        .from('kits')
        .insert({
          usuario_id: user.id,
          nome: nomeKit,
          itens,
          lucro,
          frete,
          custo_vida: custoVida,
        })
    }

    await carregarKits()
    setModalSalvar(false)
    setSalvando(false)
  }

  function carregarKit(kit: Kit) {
    setItens(kit.itens)
    setLucro(kit.lucro)
    setFrete(kit.frete)
    setCustoVida(kit.custo_vida)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    await carregarKits()
    if (editandoId === id) {
      setEditandoId(null)
      setNomeKit('')
    }
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0, meses: 6, festasporMes: 4 }])
    setLucro(30)
    setFrete(0)
    setCustoVida(0)
    setEditandoId(null)
    setNomeKit('')
  }

  function adicionarItem() {
    setItens(prev => [...prev, { id: Date.now(), nome: '', custo: 0, meses: 6, festasporMes: 4 }])
  }

  function removerItem(id: number) {
    setItens(prev => prev.filter(i => i.id !== id))
  }

  function atualizarItem(id: number, campo: keyof Item, valor: string) {
    setItens(prev => prev.map(i =>
      i.id === id ? {
        ...i,
        [campo]: campo === 'nome' ? valor : parseFloat(valor) || 0
      } : i
    ))
  }

  // Cálculos
  const itensCusto = itens.map(item => {
    const totalFestas = item.meses * item.festasporMes
    const custoPorFesta = totalFestas > 0 ? item.custo / totalFestas : 0
    return { ...item, totalFestas, custoPorFesta }
  })

  const totalFestasGeral = itensCusto.reduce((acc, i) => acc + i.totalFestas, 0) / (itens.length || 1)
  const custoPorFestaTotal = itensCusto.reduce((acc, i) => acc + i.custoPorFesta, 0)
  const custoVidaPorFesta = totalFestasGeral > 0 ? custoVida / totalFestasGeral : 0
  const subtotal = custoPorFestaTotal + custoVidaPorFesta + frete
  const valorLucro = subtotal * (lucro / 100)
  const precoFinal = subtotal + valorLucro

  const inputStyle = {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#140033',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000055',
    marginBottom: '6px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <div>

      {/* Barra de ações */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          {editandoId && (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
              color: '#9900ff', fontWeight: 600,
              background: '#f5f0ff', padding: '6px 12px', borderRadius: '100px',
              border: '1px solid #9900ff22',
            }}>
              ✏️ Editando: {nomeKit}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {editandoId && (
            <button
              onClick={novaCalculadora}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#fff', border: '1px solid #e5e5e5',
                borderRadius: '10px', padding: '10px 16px',
                color: '#00000066', fontFamily: 'Inter, sans-serif',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}
            >
              <X size={14} />
              Novo
            </button>
          )}
          <button
            onClick={() => { setModalKits(true); carregarKits() }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fff', border: '1px solid #e5e5e5',
              borderRadius: '10px', padding: '10px 16px',
              color: '#140033', fontFamily: 'Inter, sans-serif',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}
          >
            <FolderOpen size={14} />
            Meus kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button
            onClick={() => setModalSalvar(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
              border: 'none', borderRadius: '10px', padding: '10px 16px',
              color: '#fff', fontFamily: 'Inter, sans-serif',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Save size={14} />
            {editandoId ? 'Salvar alterações' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* Itens do kit */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>
          🎪 Itens do kit
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>
          Cada item tem seu próprio período de uso e número de festas
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'end' }}>
            <label style={labelStyle}>Item</label>
            <label style={labelStyle}>Custo (R$)</label>
            <label style={labelStyle}>Meses</label>
            <label style={labelStyle}>Festas/mês</label>
            <div />
          </div>

          {itens.map((item) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 100px 36px', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={item.nome}
                  onChange={e => atualizarItem(item.id, 'nome', e.target.value)}
                  placeholder="Ex: Painel, Totem..."
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.custo || ''}
                  onChange={e => atualizarItem(item.id, 'custo', e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.meses || ''}
                  onChange={e => atualizarItem(item.id, 'meses', e.target.value)}
                  placeholder="6"
                  min="1"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.festasporMes || ''}
                  onChange={e => atualizarItem(item.id, 'festasporMes', e.target.value)}
                  placeholder="4"
                  min="1"
                  style={inputStyle}
                />
                <button
                  onClick={() => removerItem(item.id)}
                  disabled={itens.length === 1}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '36px', height: '36px',
                    background: itens.length === 1 ? '#f9f9f9' : '#fff5fd',
                    border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`,
                    borderRadius: '8px',
                    color: itens.length === 1 ? '#00000022' : '#ff33cc',
                    cursor: itens.length === 1 ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {item.custo > 0 && (
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '4px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044' }}>
                    {item.meses * item.festasporMes} festas no período
                  </span>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9900ff', fontWeight: 600 }}>
                    R$ {(item.custo / (item.meses * item.festasporMes)).toFixed(2).replace('.', ',')} por festa
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={adicionarItem}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'transparent', border: '1px dashed #9900ff55',
            borderRadius: '10px', padding: '10px 16px', color: '#9900ff',
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', width: '100%', justifyContent: 'center',
          }}
        >
          <Plus size={14} />
          Adicionar item
        </button>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000066' }}>
            Custo total dos itens por festa
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033' }}>
            R$ {custoPorFestaTotal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Custos adicionais */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#140033', margin: '0 0 6px 0' }}>
          💰 Custos adicionais
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>
          Outros custos que entram no preço final por festa
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Custo de vida mensal (R$)</label>
            <input
              type="number"
              value={custoVida || ''}
              onChange={e => setCustoVida(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 3000,00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000044', margin: '4px 0 0 0' }}>
              Dividido pela média de festas
            </p>
          </div>
          <div>
            <label style={labelStyle}>Frete por festa (R$)</label>
            <input
              type="number"
              value={frete || ''}
              onChange={e => setFrete(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 50,00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Lucro desejado (%)</label>
            <input
              type="number"
              value={lucro || ''}
              onChange={e => setLucro(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 30"
              min="0"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div style={{
        background: 'linear-gradient(135deg, #140033, #1a0044)',
        border: '1px solid #ffffff12',
        borderRadius: '16px',
        padding: '28px',
      }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#ffffff88', margin: '0 0 20px 0' }}>
          📊 Resultado
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Custo dos itens por festa', valor: custoPorFestaTotal },
            { label: 'Custo de vida por festa', valor: custoVidaPorFesta },
            { label: 'Frete', valor: frete },
            { label: `Lucro (${lucro}%)`, valor: valorLucro },
          ].map(linha => (
            <div key={linha.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff66' }}>
                {linha.label}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc', fontWeight: 600 }}>
                R$ {linha.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          borderTop: '1px solid #ffffff18',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff' }}>
            Preço por festa
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: '36px',
            color: '#ff33cc',
            letterSpacing: '-1px',
          }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Modal — Salvar kit */}
      {modalSalvar && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#00000055', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '32px', width: '100%', maxWidth: '420px',
            boxShadow: '0 24px 60px #00000033',
          }}>
            <h3 style={{
              fontFamily: 'Inter, sans-serif', fontWeight: 900,
              fontSize: '20px', color: '#140033', margin: '0 0 8px 0',
            }}>
              {editandoId ? '✏️ Salvar alterações' : '💾 Salvar kit'}
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 24px 0' }}>
              {editandoId ? 'Atualize o nome do kit se quiser' : 'Dê um nome para identificar este kit'}
            </p>

            <input
              type="text"
              value={nomeKit}
              onChange={e => setNomeKit(e.target.value)}
              placeholder="Ex: Kit Dinossáuro, Kit Unicórnio..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && salvarKit()}
              style={{
                width: '100%',
                background: '#f9f9f9',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#140033',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalSalvar(false)}
                style={{
                  flex: 1, padding: '12px',
                  background: '#f5f5f5', border: 'none',
                  borderRadius: '10px', color: '#00000066',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '14px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarKit}
                disabled={!nomeKit.trim() || salvando}
                style={{
                  flex: 2, padding: '12px',
                  background: nomeKit.trim() ? 'linear-gradient(135deg, #ff33cc, #9900ff)' : '#f0f0f0',
                  border: 'none', borderRadius: '10px',
                  color: nomeKit.trim() ? '#fff' : '#00000033',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: '14px', cursor: nomeKit.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {salvando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Meus kits */}
      {modalKits && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: '#00000055', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px',
            padding: '32px', width: '100%', maxWidth: '480px',
            boxShadow: '0 24px 60px #00000033',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{
                fontFamily: 'Inter, sans-serif', fontWeight: 900,
                fontSize: '20px', color: '#140033', margin: 0,
              }}>
                📁 Meus kits salvos
              </h3>
              <button
                onClick={() => setModalKits(false)}
                style={{
                  background: '#f5f5f5', border: 'none',
                  borderRadius: '8px', padding: '8px',
                  cursor: 'pointer', color: '#00000066',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {carregandoKits ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px' }}>
                  Carregando...
                </p>
              </div>
            ) : kits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: '40px', marginBottom: '8px' }}>📭</p>
                <p style={{ fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px' }}>
                  Nenhum kit salvo ainda
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {kits.map(kit => (
                  <div key={kit.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: editandoId === kit.id ? '#f5f0ff' : '#f9f9f9',
                    border: `1px solid ${editandoId === kit.id ? '#9900ff33' : '#eeeeee'}`,
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div>
                      <p style={{
                        fontFamily: 'Inter, sans-serif', fontWeight: 700,
                        fontSize: '14px', color: '#140033', margin: '0 0 2px 0',
                      }}>
                        {kit.nome}
                        {editandoId === kit.id && (
                          <span style={{ color: '#9900ff', fontSize: '11px', marginLeft: '8px' }}>● editando</span>
                        )}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                        {kit.itens.length} {kit.itens.length === 1 ? 'item' : 'itens'} · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => carregarKit(kit)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
                          border: 'none', borderRadius: '8px',
                          padding: '8px 12px', color: '#fff',
                          fontFamily: 'Inter, sans-serif', fontWeight: 600,
                          fontSize: '12px', cursor: 'pointer',
                        }}
                      >
                        <Pencil size={12} />
                        Carregar
                      </button>
                      <button
                        onClick={() => deletarKit(kit.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px',
                          background: '#fff5fd', border: '1px solid #ff33cc33',
                          borderRadius: '8px', color: '#ff33cc', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}