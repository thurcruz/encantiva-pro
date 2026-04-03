'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, FolderOpen, X, Pencil, ChevronUp, HelpCircle, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ItemAcervo } from '../acervo/AcervoCliente'

interface ItemAcervoKit {
  id: number
  nome: string
  custo: number
  festasParaDiluir: number // CR — festas para pagar este item
  acervoId?: string
}

interface ItemConsumivel {
  id: number
  nome: string
  custo: number
  rende: number
}

interface Kit {
  id: string
  nome: string
  itens: ItemAcervoKit[]
  consumiveis: ItemConsumivel[]
  locacoes: number
  multiplicador: number
  lucro: number
  custo_vida: number
  festas_kit_mes: number
  criado_em: string
  frete?: number
}

interface Props {
  acervo: ItemAcervo[]
}

function ordinal(n: number) {
  if (n === 1) return '1ª'
  if (n === 2) return '2ª'
  if (n === 3) return '3ª'
  return `${n}ª`
}

function sugerirPrecos(preco: number): number[] {
  const sugestoes = new Set<number>()
  const bases = [
    Math.floor(preco / 10) * 10 - 0.10,
    Math.round(preco / 10) * 10 - 0.10,
    Math.ceil(preco / 10) * 10 - 0.10,
    Math.floor(preco / 5) * 5,
    Math.round(preco / 5) * 5,
    Math.ceil(preco / 5) * 5,
  ]
  bases.forEach(b => { if (b > 0) sugestoes.add(parseFloat(b.toFixed(2))) })
  return Array.from(sugestoes).filter(v => v >= preco * 0.85).sort((a, b) => a - b).slice(0, 5)
}

// Recomendação de festas baseada no custo do item
function recomendarFestas(custo: number): { min: number; max: number; label: string; cor: string } {
  if (custo >= 60) return { min: 5, max: 8, label: 'Item caro/durável: recomendamos 5–8 festas', cor: '#7c3aed' }
  if (custo >= 20) return { min: 3, max: 5, label: 'Item médio: recomendamos 3–5 festas', cor: '#0891b2' }
  return { min: 3, max: 4, label: 'Item simples: recomendamos 3–4 festas', cor: '#059669' }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ── Tabela de referência ──────────────────────────────────
const TABELA_REFERENCIA = [
  { material: 'Mesa cavalete', custo: 70,  locacoes: 5, valor: 14    },
  { material: 'Mesa cômodinha', custo: 120, locacoes: 5, valor: 24   },
  { material: 'Painel MDF',    custo: 20,  locacoes: 3, valor: 6.67  },
  { material: 'Bandejas',      custo: 6,   locacoes: 3, valor: 2     },
  { material: 'Boleira',       custo: 16,  locacoes: 3, valor: 5.33  },
  { material: 'Display de mesa', custo: 5, locacoes: 3, valor: 1.66  },
  { material: 'Spray de brilho', custo: 16, locacoes: 3, valor: 5.33 },
  { material: 'Balões (saco)', custo: 24,  locacoes: 3, valor: 8     },
]

// ── Modal de boas-vindas ──────────────────────────────────
function ModalBoasVindas({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ background: '#140033', borderRadius: '24px 24px 0 0', padding: '28px 28px 24px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#fff', margin: '0 0 8px' }}>
            Antes de usar a calculadora
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff66', margin: 0, lineHeight: 1.6 }}>
            Entenda como funciona a lógica de precificação por diluição de custos
          </p>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Como funciona */}
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 10px' }}>Como funciona?</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: 1.7 }}>
              A calculadora dilui o custo de cada item reutilizável pelo número de festas que você quer para pagar aquele item. Assim, cada festa carrega uma parte justa do investimento.
            </p>
            <div style={{ background: '#f5f0ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: '#7c3aed', margin: '0 0 6px' }}>Exemplo:</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#4c1d95', margin: 0, lineHeight: 1.6 }}>
                Mesa de R$100 → você quer pagar em 4 festas<br/>
                <strong>Custo por festa = R$100 ÷ 4 = R$25</strong>
              </p>
            </div>
          </div>

          {/* Recomendações */}
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 10px' }}>Quantas festas usar?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { faixa: '5 a 8 festas', desc: 'Itens caros e duráveis', exemplo: 'Mesas, painéis grandes, decorações premium', cor: '#7c3aed', bg: '#f5f0ff' },
                { faixa: '3 a 5 festas', desc: 'Itens médios', exemplo: 'Bandejas, boleiras, vasos, displays', cor: '#0891b2', bg: '#f0f9ff' },
                { faixa: '3 a 4 festas', desc: 'Itens simples', exemplo: 'Itens pequenos e de baixo custo', cor: '#059669', bg: '#f0fdf4' },
              ].map(r => (
                <div key={r.faixa} style={{ display: 'flex', gap: '12px', background: r.bg, border: `1px solid ${r.cor}22`, borderRadius: '10px', padding: '10px 14px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '13px', color: r.cor, flexShrink: 0, minWidth: '80px' }}>{r.faixa}</span>
                  <div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', color: '#111827', margin: '0 0 2px' }}>{r.desc}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9ca3af', margin: 0 }}>{r.exemplo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de referência */}
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 10px' }}>Tabela de referência rápida</p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Material', 'Custo médio', 'Festas', 'Por festa'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#6b7280', textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABELA_REFERENCIA.map((r, i) => (
                    <tr key={r.material} style={{ borderBottom: i < TABELA_REFERENCIA.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#111827', fontWeight: 500 }}>{r.material}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>R${r.custo}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#6b7280' }}>{r.locacoes}x</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 700 }}>R${r.valor.toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={onClose}
            style={{ width: '100%', padding: '14px', background: '#ff33cc', border: 'none', borderRadius: '999px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            Entendi, vamos calcular!
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Calculadora({ acervo }: Props) {
  const [itens, setItens] = useState<ItemAcervoKit[]>([{ id: 1, nome: '', custo: 0, festasParaDiluir: 4 }])
  const [consumiveis, setConsumiveis] = useState<ItemConsumivel[]>([{ id: 1, nome: '', custo: 0, rende: 1 }])
  const [multiplicador] = useState(100)
  const [lucro, setLucro] = useState(100)
  const [frete, setFrete] = useState(0)
  const [precoAlvo, setPrecoAlvo] = useState(0)

  const [kits, setKits] = useState<Kit[]>([])
  const [modalSalvar, setModalSalvar] = useState(false)
  const [modalKits, setModalKits] = useState(false)
  const [nomeKit, setNomeKit] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [carregandoKits, setCarregandoKits] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [modalExportar, setModalExportar] = useState<{ kit: Kit; precoCalculado: number } | null>(null)
  const [precoExportar, setPrecoExportar] = useState(0)
  const [mostrarTutorial, setMostrarTutorial] = useState(false)
  const [mostrarTabela, setMostrarTabela] = useState(false)

  const isMobile = useIsMobile()
  const supabase = createClient()

  // Modal boas-vindas na primeira vez
  useEffect(() => {
    const jaViu = localStorage.getItem('calc_tutorial_visto')
    if (!jaViu) setMostrarTutorial(true)
  }, [])

  function fecharTutorial() {
    localStorage.setItem('calc_tutorial_visto', '1')
    setMostrarTutorial(false)
  }

  async function carregarKits() {
    setCarregandoKits(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCarregandoKits(false); return }
      const { data, error } = await supabase.from('kits').select('*').eq('usuario_id', user.id).order('criado_em', { ascending: false })
      if (error) console.error('Erro ao carregar kits:', error)
      if (data) setKits(data)
    } finally { setCarregandoKits(false) }
  }

  useEffect(() => { void carregarKits() }, []) // eslint-disable-line

  async function salvarKit() {
    if (!nomeKit.trim()) return
    setSalvando(true); setErroSalvar('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setErroSalvar('Usuário não autenticado.'); setSalvando(false); return }
      const payload = { nome: nomeKit.trim(), itens, consumiveis, locacoes: 1, multiplicador, lucro, frete, custo_vida: 0, festas_kit_mes: 16 }
      if (editandoId) {
        const { error } = await supabase.from('kits').update({ ...payload, atualizado_em: new Date().toISOString() }).eq('id', editandoId).eq('usuario_id', user.id)
        if (error) { setErroSalvar('Erro ao atualizar: ' + error.message); return }
      } else {
        const { error } = await supabase.from('kits').insert({ usuario_id: user.id, ...payload })
        if (error) { setErroSalvar('Erro ao salvar: ' + error.message); return }
      }
      await carregarKits()
      setModalSalvar(false)
    } finally { setSalvando(false) }
  }

  function carregarKit(kit: Kit) {
    const itensLegado = kit.itens ?? []
    const itensConvertidos = itensLegado.map(i => ({
      id: i.id, nome: i.nome, custo: i.custo,
      festasParaDiluir: (i as ItemAcervoKit).festasParaDiluir ?? 4,
      acervoId: i.acervoId,
    }))
    setItens(itensConvertidos.length > 0 ? itensConvertidos : [{ id: 1, nome: '', custo: 0, festasParaDiluir: 4 }])
    setConsumiveis(kit.consumiveis?.length > 0 ? kit.consumiveis : [{ id: 1, nome: '', custo: 0, rende: 1 }])
    setLucro(kit.lucro ?? 100)
    setFrete(kit.frete ?? 0)
    setPrecoAlvo(0)
    setEditandoId(kit.id)
    setNomeKit(kit.nome)
    setModalKits(false)
  }

  async function deletarKit(id: string) {
    await supabase.from('kits').delete().eq('id', id)
    setKits(p => p.filter(k => k.id !== id))
    if (editandoId === id) { setEditandoId(null); setNomeKit('') }
  }

  async function duplicarKit(kit: Kit) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('kits').insert({
      usuario_id: user.id,
      nome: kit.nome + ' (cópia)',
      itens: kit.itens,
      consumiveis: kit.consumiveis,
      locacoes: kit.locacoes,
      multiplicador: kit.multiplicador,
      lucro: kit.lucro,
      frete: kit.frete ?? 0,
      custo_vida: kit.custo_vida ?? 0,
      festas_kit_mes: kit.festas_kit_mes ?? 16,
    }).select().single()
    if (!error && data) {
      setKits(p => [data as Kit, ...p])
    }
  }

  function abrirModalExportar(kit: Kit) {
    const custoAcervoK = (kit.itens ?? []).reduce((acc, i) => {
      const festas = (i as ItemAcervoKit).festasParaDiluir ?? kit.locacoes ?? 4
      return acc + (festas > 0 ? i.custo / festas : 0)
    }, 0)
    const custoConsumivelK = (kit.consumiveis ?? []).reduce((acc, i) => acc + (i.rende > 0 ? i.custo / i.rende : 0), 0)
    const custoComExtrasK = custoAcervoK + custoConsumivelK + (kit.frete ?? 0)
    const precoCalc = custoComExtrasK * (1 + kit.lucro / 100)
    setPrecoExportar(parseFloat(precoCalc.toFixed(2)))
    setModalExportar({ kit, precoCalculado: precoCalc })
  }

  async function confirmarExportacao() {
    if (!modalExportar) return
    setExportando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('catalogo_kits').insert({
        usuario_id: user.id, nome: modalExportar.kit.nome,
        descricao: 'Kit exportado da calculadora', origem: 'calculadora', preco: precoExportar,
        itens: [...(modalExportar.kit.itens ?? []), ...(modalExportar.kit.consumiveis ?? [])].map(i => i.nome).filter(Boolean),
        foto_url: null,
      })
      setModalExportar(null)
    } finally { setExportando(false) }
  }

  function novaCalculadora() {
    setItens([{ id: 1, nome: '', custo: 0, festasParaDiluir: 4 }])
    setConsumiveis([{ id: 1, nome: '', custo: 0, rende: 1 }])
    setLucro(100); setFrete(0); setPrecoAlvo(0)
    setEditandoId(null); setNomeKit('')
  }

  function preencherDoAcervo(itemId: number, acervoId: string) {
    const a = acervo.find(x => x.id === acervoId)
    if (!a) return
    setItens(p => p.map(i => i.id === itemId ? { ...i, nome: a.nome, custo: Number(a.custo), acervoId: a.id } : i))
  }

  const temAcervo = acervo.length > 0

  // ── CÁLCULOS (CR por item) ──
  const custoAcervo = itens.reduce((acc, i) => acc + (i.festasParaDiluir > 0 ? i.custo / i.festasParaDiluir : 0), 0)
  const custoConsumiveis = consumiveis.reduce((acc, i) => acc + (i.rende > 0 ? i.custo / i.rende : 0), 0)
  const custoComExtras = custoAcervo + custoConsumiveis + frete
  const valorLucro = custoComExtras * (lucro / 100)
  const precoFinal = custoComExtras + valorLucro
  const custoTotalAcervo = itens.reduce((acc, i) => acc + i.custo, 0)
  const margemParaAlvo = precoAlvo > 0 && custoComExtras > 0 ? Math.round(((precoAlvo - custoComExtras) / custoComExtras) * 100) : null

  const margemStatus =
    lucro < 30
      ? { cor: '#dc2626', texto: 'Margem muito baixa — risco de prejuízo', icone: '✕' }
    : lucro < 100
      ? { cor: '#f59e0b', texto: 'Recomendado: 100%–200%', icone: '!' }
    : lucro < 200
      ? { cor: '#10b981', texto: 'Boa margem', icone: '+' }
      : { cor: '#10b981', texto: 'Excelente margem', icone: '+' }

  // ── ESTILOS ──
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid #e5e5e5',
    borderRadius: '10px', padding: '10px 12px', color: '#140033',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px',
    fontWeight: 600, color: '#00000055', marginBottom: '6px',
    letterSpacing: '1px', textTransform: 'uppercase',
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px',
    padding: '24px', marginBottom: '16px',
  }
  const gridDois: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '16px', marginBottom: '20px',
  }

  return (
    <div>
      {/* Modal tutorial boas-vindas */}
      {mostrarTutorial && <ModalBoasVindas onClose={fecharTutorial} />}

      {/* ── Barra de ações ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {editandoId && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff33cc', fontWeight: 600, background: '#fff0fb', padding: '6px 12px', borderRadius: '100px', border: '1px solid #ffd6f5' }}>
              {nomeKit}
            </span>
          )}
          <button onClick={() => setMostrarTutorial(true)} title="Como funciona"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f5f0ff', border: '1px solid #e9d5ff', borderRadius: '999px', padding: '8px 12px', color: '#7c3aed', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
            <HelpCircle size={13} /> Como funciona
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {editandoId && (
            <button onClick={novaCalculadora} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: '999px', padding: '10px 14px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              <X size={14} /> Novo
            </button>
          )}
          <button onClick={() => { setModalKits(true); void carregarKits() }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: '999px', padding: '10px 14px', color: '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <FolderOpen size={14} /> Kits {kits.length > 0 && `(${kits.length})`}
          </button>
          <button onClick={() => { setErroSalvar(''); setModalSalvar(true) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '10px 14px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <Save size={14} /> {editandoId ? 'Salvar' : 'Salvar kit'}
          </button>
        </div>
      </div>

      {/* ── Tabela de referência colapsável ── */}
      <div style={{ background: '#f5f0ff', border: '1px solid #e9d5ff', borderRadius: '14px', marginBottom: '16px', overflow: 'hidden' }}>
        <button onClick={() => setMostrarTabela(!mostrarTabela)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', padding: '14px 18px', cursor: 'pointer' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Tabela de referência rápida
          </span>
          {mostrarTabela ? <ChevronDown size={15} color="#7c3aed" /> : <ChevronUp size={15} color="#7c3aed" />}
        </button>
        {mostrarTabela && (
          <div style={{ padding: '0 18px 16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e9d5ff' }}>
                  {['Material', 'Custo médio', 'Festas sugeridas', 'Valor por festa'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: '#7c3aed', textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABELA_REFERENCIA.map((r, i) => (
                  <tr key={r.material} style={{ borderBottom: i < TABELA_REFERENCIA.length - 1 ? '1px solid #f3f0ff' : 'none' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4c1d95', fontWeight: 500 }}>{r.material}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7c3aed' }}>R${r.custo}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7c3aed' }}>{r.locacoes}x</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 700 }}>R${r.valor.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ACERVO (CR por item) ── */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Itens do acervo</h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: 0 }}>
            Para cada item, defina em quantas festas quer diluir o custo (CR)
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '12px' }}>
          {itens.map((item, idx) => {
            const rec = item.custo > 0 ? recomendarFestas(item.custo) : null
            const fora = rec && (item.festasParaDiluir < rec.min || item.festasParaDiluir > rec.max)
            return (
              <div key={item.id} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: isMobile ? 'stretch' : 'flex-start', marginBottom: '10px' }}>
                  {/* nome / select misto */}
                  <div style={{ flex: 1 }}>
                    {idx === 0 && <span style={labelStyle}>Item{temAcervo ? <span style={{ color: '#ff33cc', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> · selecione ou digite</span> : ''}</span>}
                    <div style={{ display: 'flex', border: '1px solid #e5e5e5', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
                      {temAcervo && (
                        <select value={item.acervoId ?? ''} onChange={e => preencherDoAcervo(item.id, e.target.value)}
                          style={{ border: 'none', borderRight: '1px solid #e5e5e5', background: 'transparent', padding: '10px 6px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: item.acervoId ? '#ff33cc' : '#9ca3af', outline: 'none', cursor: 'pointer', width: '90px', flexShrink: 0 }}>
                          <option value="">Acervo</option>
                          {acervo.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        </select>
                      )}
                      <input type="text" value={item.nome}
                        onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value, acervoId: undefined } : i))}
                        placeholder={temAcervo ? 'ou digite...' : 'Ex: Mesa, Painel...'}
                        style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#140033', outline: 'none', minWidth: 0 }} />
                    </div>
                  </div>
                  {/* custo + lixeira */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ width: isMobile ? 'calc(100% - 44px)' : '110px', flexShrink: 0 }}>
                      {idx === 0 && <span style={labelStyle}>Custo (R$)</span>}
                      <input type="number" value={item.custo || ''} onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                    </div>
                    <button onClick={() => setItens(p => p.filter(i => i.id !== item.id))} disabled={itens.length === 1}
                      style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${itens.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: itens.length === 1 ? '#f9f9f9' : '#fff5fd', color: itens.length === 1 ? '#00000022' : '#ff33cc', cursor: itens.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Input de festas para diluir com recomendação */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ ...labelStyle, margin: 0, flexShrink: 0 }}>Festas para diluir o custo</label>
                    <input type="number" value={item.festasParaDiluir || ''} min="1" max="20"
                      onChange={e => setItens(p => p.map(i => i.id === item.id ? { ...i, festasParaDiluir: parseInt(e.target.value) || 1 } : i))}
                      style={{ ...inputStyle, width: '80px', textAlign: 'center', padding: '7px 10px' }} />
                    {item.custo > 0 && (
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ff33cc', fontWeight: 700, flexShrink: 0 }}>
                        = R$ {(item.custo / item.festasParaDiluir).toFixed(2).replace('.', ',')} /festa
                      </span>
                    )}
                  </div>
                  {rec && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: fora ? '#f59e0b' : rec.cor, fontWeight: 600, margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: fora ? '#f59e0b' : rec.cor, color: '#fff', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
                        {fora ? '!' : 'i'}
                      </span>
                      {fora ? `Fora do recomendado — ` : ''}{rec.label}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => setItens(p => [...p, { id: Date.now(), nome: '', custo: 0, festasParaDiluir: 4 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ff33cc55', borderRadius: '999px', padding: '10px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
          <Plus size={14} /> Adicionar item do acervo
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo do acervo por festa (CR total)</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>R$ {custoAcervo.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── CONSUMÍVEIS ── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Consumíveis por festa (CC)</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 16px 0' }}>
          Bolas, spray, fita, adesivo — informe quantas festas cada embalagem rende
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
          {consumiveis.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: isMobile ? 'stretch' : 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {idx === 0 && <span style={labelStyle}>Item</span>}
                  <input type="text" value={item.nome} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, nome: e.target.value } : i))} placeholder="Ex: Spray de brilho, Balões..." style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ width: isMobile ? undefined : '100px', flex: isMobile ? 1 : undefined }}>
                    {idx === 0 && <span style={labelStyle}>Custo (R$)</span>}
                    <input type="number" value={item.custo || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, custo: parseFloat(e.target.value) || 0 } : i))} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
                  </div>
                  <div style={{ width: isMobile ? undefined : '100px', flex: isMobile ? 1 : undefined }}>
                    {idx === 0 && <span style={labelStyle}>Rende (festas)</span>}
                    <input type="number" value={item.rende || ''} onChange={e => setConsumiveis(p => p.map(i => i.id === item.id ? { ...i, rende: parseFloat(e.target.value) || 1 } : i))} placeholder="3" min="1" style={inputStyle} />
                  </div>
                  <button onClick={() => setConsumiveis(p => p.filter(i => i.id !== item.id))} disabled={consumiveis.length === 1}
                    style={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${consumiveis.length === 1 ? '#eeeeee' : '#ff33cc33'}`, background: consumiveis.length === 1 ? '#f9f9f9' : '#fff5fd', color: consumiveis.length === 1 ? '#00000022' : '#ff33cc', cursor: consumiveis.length === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {item.custo > 0 && item.rende > 0 && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ff33cc', fontWeight: 600, paddingLeft: '4px' }}>
                  R$ {(item.custo / item.rende).toFixed(2).replace('.', ',')} por festa
                </span>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => setConsumiveis(p => [...p, { id: Date.now(), nome: '', custo: 0, rende: 1 }])}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px dashed #ff33cc55', borderRadius: '999px', padding: '10px 16px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
          <Plus size={14} /> Adicionar consumível
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000066' }}>Custo consumíveis por festa (CC total)</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033' }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* ── PRECIFICAÇÃO ── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 4px 0' }}>Precificação</h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000055', margin: '0 0 20px 0' }}>Frete e margem de lucro sobre (CR + CC)</p>
        <div style={gridDois}>
          <div>
            <label style={labelStyle}>Frete por festa (R$) <span style={{ color: '#00000033', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— opcional</span></label>
            <input type="number" value={frete || ''} onChange={e => setFrete(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Preço desejado (R$) <span style={{ color: '#00000033', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— opcional</span></label>
            <input type="number" value={precoAlvo || ''} onChange={e => setPrecoAlvo(parseFloat(e.target.value) || 0)} placeholder="Ex: 100,00" min="0" step="0.01" style={inputStyle} />
            {margemParaAlvo !== null && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', margin: '4px 0 0', fontWeight: 600, color: margemParaAlvo < 0 ? '#cc0000' : '#10b981' }}>
                {margemParaAlvo < 0 ? 'Abaixo do custo mínimo' : `Equivale a ${margemParaAlvo}% de lucro`}
              </p>
            )}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, margin: 0 }}>Margem de lucro</label>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '26px', color: '#ff33cc', letterSpacing: '-0.5px', lineHeight: 1 }}>{lucro}%</span>
          </div>
          <input type="range" min={0} max={300} value={lucro} onChange={e => setLucro(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ff33cc', height: '4px', cursor: 'pointer', marginBottom: '6px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>0%</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: margemStatus.cor, color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{margemStatus.icone}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: margemStatus.cor, fontWeight: 600 }}>{margemStatus.texto}</span>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#d1d5db' }}>300%</span>
          </div>
        </div>
      </div>

      {/* ── RESULTADO ── */}
      <div style={{ background: '#140033', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', color: '#ffffff55', margin: '0 0 18px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Resultado</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>CR — Acervo por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {custoAcervo.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>CC — Consumíveis por festa</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {custoConsumiveis.toFixed(2).replace('.', ',')}</span>
          </div>
          {frete > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Frete por festa</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {frete.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #ffffff15' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>CR + CC (custo total por festa)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 700 }}>R$ {custoComExtras.toFixed(2).replace('.', ',')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffff55' }}>Margem de lucro ({lucro}%)</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffffffcc', fontWeight: 600 }}>R$ {valorLucro.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #ffffff18', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '18px', color: '#fff' }}>Preço por festa</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '36px', color: '#ff33cc', letterSpacing: '-1px' }}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
        </div>
        {precoAlvo > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ffffff10', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff33' }}>Preço desejado: R$ {precoAlvo.toFixed(2).replace('.', ',')}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: precoFinal >= precoAlvo ? '#10b981' : '#f59e0b' }}>
              {precoFinal >= precoAlvo ? `R$ ${(precoFinal - precoAlvo).toFixed(2).replace('.', ',')} acima` : `Faltam R$ ${(precoAlvo - precoFinal).toFixed(2).replace('.', ',')} para atingir`}
            </span>
          </div>
        )}
      </div>

      {/* ── CARD PAYBACK ── */}
      {custoTotalAcervo > 0 && precoFinal > 0 && (() => {
        const festasMin = Math.min(...itens.map(i => i.festasParaDiluir))
        const ok = festasMin <= 4
        return (
          <div style={{ background: ok ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: ok ? '#10b981' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>{ok ? '+' : '!'}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: ok ? '#15803d' : '#dc2626', margin: '0 0 4px 0' }}>
                {ok ? `Investimento recuperado na ${ordinal(festasMin)} festa` : `Investimento mais longo (${festasMin} festas)`}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: ok ? '#166534' : '#991b1b', margin: 0, lineHeight: 1.5 }}>
                Custo total do acervo: R$ {custoTotalAcervo.toFixed(2).replace('.', ',')} · Preço por festa: R$ {precoFinal.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        )
      })()}

      {/* ── Modal Salvar ── */}
      {modalSalvar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalSalvar(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033', margin: '0 0 8px 0' }}>{editandoId ? 'Salvar alterações' : 'Salvar kit'}</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 24px 0' }}>Dê um nome para identificar este kit</p>
            <input type="text" value={nomeKit} onChange={e => setNomeKit(e.target.value)} placeholder="Ex: Kit Mesa Completo..." autoFocus
              onKeyDown={e => e.key === 'Enter' && void salvarKit()}
              style={{ width: '100%', background: '#f9f9f9', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '14px 16px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
            {erroSalvar && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#dc2626', margin: '0 0 12px', fontWeight: 600 }}>{erroSalvar}</p>}
            <div style={{ height: '8px' }} />
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              {editandoId ? (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={() => void salvarKit()} disabled={!nomeKit.trim() || salvando}
                      style={{ flex: 2, padding: '12px', background: nomeKit.trim() && !salvando ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', color: nomeKit.trim() && !salvando ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: nomeKit.trim() && !salvando ? 'pointer' : 'not-allowed' }}>
                      {salvando ? 'Salvando...' : 'Atualizar kit'}
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (!nomeKit.trim()) return
                      setSalvando(true); setErroSalvar('')
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) return
                        const { error } = await supabase.from('kits').insert({
                          usuario_id: user.id,
                          nome: nomeKit.trim(),
                          itens, consumiveis,
                          locacoes: 1, multiplicador, lucro, frete,
                          custo_vida: 0, festas_kit_mes: 16,
                        })
                        if (error) { setErroSalvar('Erro: ' + error.message); return }
                        await carregarKits()
                        setEditandoId(null)
                        setModalSalvar(false)
                      } finally { setSalvando(false) }
                    }}
                    disabled={!nomeKit.trim() || salvando}
                    style={{ width: '100%', padding: '12px', background: '#fff', border: '1.5px solid #ff33cc', borderRadius: '999px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: nomeKit.trim() && !salvando ? 'pointer' : 'not-allowed', opacity: !nomeKit.trim() ? 0.5 : 1 }}>
                    {salvando ? 'Salvando...' : 'Salvar como novo kit'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setModalSalvar(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => void salvarKit()} disabled={!nomeKit.trim() || salvando}
                    style={{ flex: 2, padding: '12px', background: nomeKit.trim() && !salvando ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', color: nomeKit.trim() && !salvando ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: nomeKit.trim() && !salvando ? 'pointer' : 'not-allowed' }}>
                    {salvando ? 'Salvando...' : 'Salvar kit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Kits ── */}
      {modalKits && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setModalKits(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '18px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '15px', color: '#140033', margin: 0 }}>Kits salvos</p>
              <button onClick={() => setModalKits(false)} style={{ width: 32, height: 32, borderRadius: '999px', border: '1px solid #e5e5e5', background: '#f9f9f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00000066' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '16px 20px 32px' }}>
              {carregandoKits ? (
                <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px', padding: '32px 0' }}>Carregando...</p>
              ) : kits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', color: '#00000044', fontSize: '14px' }}>Nenhum kit salvo ainda</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {kits.map(kit => (
                    <div key={kit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: editandoId === kit.id ? '#fff0fb' : '#f9f9f9', border: `1.5px solid ${editandoId === kit.id ? '#ff33cc' : '#eeeeee'}`, borderRadius: '12px', padding: '14px 16px', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', color: '#140033', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {kit.nome}{editandoId === kit.id && <span style={{ color: '#ff33cc', fontSize: '11px', marginLeft: '8px' }}>editando</span>}
                        </p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#00000044', margin: 0 }}>
                          {(kit.itens ?? []).length} itens · {new Date(kit.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => carregarKit(kit)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ff33cc', border: 'none', borderRadius: '999px', padding: '8px 12px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                          <Pencil size={12} /> Carregar
                        </button>
                        <button onClick={() => void duplicarKit(kit)} title="Duplicar kit" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f5f0ff', border: '1.5px solid #e9d5ff', borderRadius: '999px', padding: '8px 10px', color: '#7c3aed', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                          <Plus size={12} /> Duplicar
                        </button>
                        <button onClick={() => { abrirModalExportar(kit); setModalKits(false) }} disabled={exportando} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1.5px solid #ff33cc', borderRadius: '999px', padding: '8px 10px', color: '#ff33cc', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '11px', cursor: 'pointer', opacity: exportando ? 0.6 : 1 }}>
                          <ChevronUp size={12} /> Catálogo
                        </button>
                        <button onClick={() => void deletarKit(kit.id)} style={{ width: 32, height: 32, background: '#fff5fd', border: '1px solid #ff33cc33', borderRadius: '999px', color: '#ff33cc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Exportar ── */}
      {modalExportar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#00000055', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={e => e.target === e.currentTarget && setModalExportar(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 24px 60px #00000033' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '18px', color: '#140033', margin: '0 0 4px 0' }}>Enviar para o catálogo</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: '0 0 20px 0' }}>Kit: <strong style={{ color: '#140033' }}>{modalExportar.kit.nome}</strong></p>
            <div style={{ background: '#fafafa', border: '1px solid #eeeeee', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#00000055', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preço calculado</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '22px', color: '#140033', margin: 0 }}>R$ {modalExportar.precoCalculado.toFixed(2).replace('.', ',')}</p>
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#00000055', margin: '0 0 8px 0' }}>Preços mais atrativos:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {sugerirPrecos(modalExportar.precoCalculado).map(s => (
                <button key={s} onClick={() => setPrecoExportar(s)}
                  style={{ padding: '7px 14px', borderRadius: '999px', border: `1.5px solid ${precoExportar === s ? '#ff33cc' : '#e5e5e5'}`, background: precoExportar === s ? '#fff0fb' : '#fafafa', color: precoExportar === s ? '#ff33cc' : '#140033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                  R$ {s.toFixed(2).replace('.', ',')}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#00000055', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Ou defina manualmente</label>
              <input type="number" value={precoExportar || ''} onChange={e => setPrecoExportar(parseFloat(e.target.value) || 0)} placeholder="0,00" min="0" step="0.01"
                style={{ width: '100%', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '10px 12px', color: '#140033', fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalExportar(null)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', borderRadius: '999px', color: '#00000066', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => void confirmarExportacao()} disabled={exportando || precoExportar <= 0}
                style={{ flex: 2, padding: '12px', background: precoExportar > 0 && !exportando ? '#ff33cc' : '#f0f0f0', border: 'none', borderRadius: '999px', color: precoExportar > 0 && !exportando ? '#fff' : '#00000033', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: precoExportar > 0 && !exportando ? 'pointer' : 'not-allowed' }}>
                {exportando ? 'Enviando...' : 'Enviar para o catálogo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}