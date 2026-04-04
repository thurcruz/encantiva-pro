'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Interfaces ───────────────────────────────────────────
interface Pedido {
  id: string; nome_cliente: string; valor_total: number
  status: string; criado_em: string; data_evento: string; forma_pagamento: string | null
}
interface Config {
  id?: string; meta_mensal: number; salario_desejado: number
}
interface CustoFixo {
  id: string; nome: string; valor: number
}
interface Lancamento {
  id: string; tipo: 'entrada' | 'saida'; descricao: string
  valor: number; data: string; categoria: string | null
}
interface Props {
  pedidos: Pedido[]; config: Config | null
  custosFixos: CustoFixo[]; fluxoCaixa: Lancamento[]; usuarioId: string
}

// ── Ícones ───────────────────────────────────────────────
const IconMoney    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="1" y="4" width="14" height="9" rx="2"/><circle cx="8" cy="8.5" r="2"/></svg>
const IconCheck    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>
const IconClock    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.5l2 1.5"/></svg>
const IconCard     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="3" width="11" height="7" rx="1.5"/><path d="M1 6h11"/></svg>
const IconTarget   = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
const IconPlus     = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
const IconTrash    = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3.5h9M5 3.5V2h3v1.5M10 3.5L9.5 11h-6L3 3.5"/></svg>
const IconPrint    = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4V2h8v2"/><rect x="1" y="4" width="12" height="6" rx="1.5"/><path d="M3 10v2h8v-2"/><circle cx="10.5" cy="7" r=".5" fill="currentColor"/></svg>
const IconArrowUp  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 10V3M3 6.5l3.5-3.5 3.5 3.5"/></svg>
const IconArrowDn  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6.5 3v7M3 6.5l3.5 3.5 3.5-3.5"/></svg>
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2l2 2-7 7H2v-2L9 2z"/></svg>
const IconSave     = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2h7l2 2v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M4 2v3h5V2M4 7h5v4H4z"/></svg>

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const CATEGORIAS_SAIDA = ['Materiais','Transporte','Marketing','Aluguel','Software','Alimentação','Outros']
const CATEGORIAS_ENTRADA = ['Adiantamento','Saldo','Outros']

const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
const fmtShort = (v: number) => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`

// ── Gráfico de linha ─────────────────────────────────────
function GraficoLinha({ dados }: { dados: { label: string; total: number }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const W = 600; const H = 160; const padL = 52; const padR = 16; const padT = 16; const padB = 32
  const max = Math.max(...dados.map(d => d.total), 1)
  const innerW = W - padL - padR; const innerH = H - padT - padB
  const pts = dados.map((d, i) => ({ x: padL + (i / Math.max(dados.length - 1, 1)) * innerW, y: padT + innerH - (d.total / max) * innerH, ...d }))
  const pathD = pts.reduce((acc, p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i-1]; const cx = (prev.x + p.x) / 2; return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}` }, '')
  const areaD = pts.length ? `${pathD} L ${pts[pts.length-1].x} ${padT+innerH} L ${pts[0].x} ${padT+innerH} Z` : ''
  const grades = [0, 0.25, 0.5, 0.75, 1].map(pct => ({ y: padT + innerH - pct * innerH, label: fmtShort(max * pct) }))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }} onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9900ff" stopOpacity="0.12"/><stop offset="100%" stopColor="#9900ff" stopOpacity="0"/></linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff33cc"/><stop offset="100%" stopColor="#9900ff"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {grades.map((g, i) => <g key={i}><line x1={padL} y1={g.y} x2={W-padR} y2={g.y} stroke="#f0f0f4" strokeWidth="1"/><text x={padL-6} y={g.y+4} textAnchor="end" fontSize="8" fill="#c4c4cc" fontFamily="Inter,sans-serif">{g.label}</text></g>)}
      {pts.length > 1 && <path d={areaD} fill="url(#areaGrad)"/>}
      {pts.length > 1 && <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" filter="url(#glow)"/>}
      {pts.map((p, i) => <text key={i} x={p.x} y={H-4} textAnchor="middle" fontSize="8" fill={hoverIdx===i?'#7700ff':'#c4c4cc'} fontFamily="Inter,sans-serif" fontWeight={hoverIdx===i?'700':'400'}>{p.label}</text>)}
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={i===0?p.x-20:pts[i-1].x+(p.x-pts[i-1].x)/2} y={padT} width={i===0?(pts[1]?.x??p.x+40)-p.x+20:i===pts.length-1?p.x-(pts[i-1].x+(p.x-pts[i-1].x)/2)+20:(pts[i+1]?.x??p.x)/2-pts[i-1].x/2} height={innerH} fill="transparent" style={{cursor:'crosshair'}} onMouseEnter={()=>setHoverIdx(i)}/>
          {hoverIdx===i && <line x1={p.x} y1={padT} x2={p.x} y2={padT+innerH} stroke="#e5d0ff" strokeWidth="1" strokeDasharray="3 3"/>}
          <circle cx={p.x} cy={p.y} r={hoverIdx===i?5:3} fill={hoverIdx===i?'#fff':'#9900ff'} stroke={hoverIdx===i?'#9900ff':'transparent'} strokeWidth="2"/>
          {hoverIdx===i && p.total>0 && <g>
            <rect x={Math.min(Math.max(p.x-40,padL),W-padR-80)} y={p.y-36} width="80" height="26" rx="6" fill="#1a0040"/>
            <text x={Math.min(Math.max(p.x,padL+40),W-padR-40)} y={p.y-19} textAnchor="middle" fontSize="9" fill="#ffffff88" fontFamily="Inter,sans-serif">{p.label}</text>
            <text x={Math.min(Math.max(p.x,padL+40),W-padR-40)} y={p.y-8} textAnchor="middle" fontSize="10" fill="#fff" fontFamily="Inter,sans-serif" fontWeight="700">{fmtShort(p.total)}</text>
          </g>}
        </g>
      ))}
    </svg>
  )
}

// ── Componente principal ─────────────────────────────────
export default function GraficosFinanceiro({ pedidos, config: configInicial, custosFixos: custosInicial, fluxoCaixa: fluxoInicial, usuarioId }: Props) {
  const supabase = createClient()
  const agora = new Date()
  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()

  const [aba, setAba] = useState<'visao' | 'fluxo' | 'config'>('visao')
  const [periodo, setPeriodo] = useState<'3m' | '6m' | '12m'>('6m')
  const [filtroPeriodoCards, setFiltroPeriodoCards] = useState<'mes' | 'tri' | 'ano'>('mes')

  // Config
  const [config, setConfig] = useState<Config>(configInicial ?? { meta_mensal: 0, salario_desejado: 0 })
  const [editandoConfig, setEditandoConfig] = useState(false)
  const [formConfig, setFormConfig] = useState({ meta_mensal: String(configInicial?.meta_mensal ?? 0), salario_desejado: String(configInicial?.salario_desejado ?? 0) })
  const [salvandoConfig, setSalvandoConfig] = useState(false)

  // Custos fixos
  const [custos, setCustos] = useState<CustoFixo[]>(custosInicial)
  const [novoCusto, setNovoCusto] = useState({ nome: '', valor: '' })
  const [salvandoCusto, setSalvandoCusto] = useState(false)

  // Fluxo de caixa
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(fluxoInicial)
  const [novoLanc, setNovoLanc] = useState({ tipo: 'entrada' as 'entrada' | 'saida', descricao: '', valor: '', data: agora.toISOString().split('T')[0], categoria: '' })
  const [salvandoLanc, setSalvandoLanc] = useState(false)
  const [filtroFluxoMes, setFiltroFluxoMes] = useState(`${anoAtual}-${String(mesAtual+1).padStart(2,'0')}`)

  // ── Cálculos de período ──────────────────────────────
  function pedidosDoPeriodo(p: Pedido[]) {
    const inicio = new Date()
    if (filtroPeriodoCards === 'mes') { inicio.setDate(1); inicio.setHours(0,0,0,0) }
    else if (filtroPeriodoCards === 'tri') { inicio.setMonth(inicio.getMonth()-2); inicio.setDate(1); inicio.setHours(0,0,0,0) }
    else { inicio.setMonth(0); inicio.setDate(1); inicio.setHours(0,0,0,0) }
    return p.filter(x => new Date(x.criado_em) >= inicio)
  }

  const pedidosFiltrados = pedidosDoPeriodo(pedidos)
  const totalRecebido  = pedidosFiltrados.filter(p => p.status==='concluido').reduce((s,p) => s+Number(p.valor_total), 0)
  const totalPendente  = pedidosFiltrados.filter(p => p.status==='pendente'||p.status==='confirmado').reduce((s,p) => s+Number(p.valor_total), 0)
  const totalCancelado = pedidosFiltrados.filter(p => p.status==='cancelado').reduce((s,p) => s+Number(p.valor_total), 0)
  const totalGeral     = pedidosFiltrados.filter(p => p.status!=='cancelado').reduce((s,p) => s+Number(p.valor_total), 0)
  const ticketMedio    = pedidosFiltrados.filter(p => p.status!=='cancelado').length > 0
    ? totalGeral / pedidosFiltrados.filter(p => p.status!=='cancelado').length : 0

  const totalCustosFixos = custos.reduce((s,c) => s+Number(c.valor), 0)
  const lucroLiquido = totalRecebido - totalCustosFixos

  // Meta do mês
  const metaMensal = Number(config.meta_mensal) || 0
  const receitaMes = pedidos.filter(p => {
    const d = new Date(p.criado_em)
    return d.getMonth()===mesAtual && d.getFullYear()===anoAtual && p.status!=='cancelado'
  }).reduce((s,p) => s+Number(p.valor_total), 0)
  const pctMeta = metaMensal > 0 ? Math.min(100, (receitaMes/metaMensal)*100) : 0

  // Top 5 clientes
  const porCliente = pedidosFiltrados
    .filter(p => p.status!=='cancelado')
    .reduce((acc, p) => { acc[p.nome_cliente]=(acc[p.nome_cliente]||0)+Number(p.valor_total); return acc }, {} as Record<string,number>)
  const top5 = Object.entries(porCliente).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxTop5 = top5[0]?.[1] ?? 1

  // Gráfico por mês
  const mesesAtras = periodo==='3m'?3:periodo==='6m'?6:12
  const mesesPeriodo = Array.from({length:mesesAtras},(_,i) => {
    const d = new Date(anoAtual, mesAtual-(mesesAtras-1-i), 1)
    return { ano: d.getFullYear(), mes: d.getMonth(), label: MESES[d.getMonth()] }
  })
  const receitaPorMes = mesesPeriodo.map(({ano,mes,label}) => ({
    label,
    total: pedidos.filter(p => { const d=new Date(p.criado_em); return d.getFullYear()===ano&&d.getMonth()===mes&&p.status!=='cancelado' }).reduce((s,p)=>s+Number(p.valor_total),0)
  }))

  // Pagamentos
  const pagamentos = pedidosFiltrados.filter(p=>p.status!=='cancelado'&&p.forma_pagamento).reduce((acc,p) => { const f=p.forma_pagamento!; acc[f]=(acc[f]||0)+Number(p.valor_total); return acc }, {} as Record<string,number>)
  const totalPag = Object.values(pagamentos).reduce((s,v)=>s+v,0)||1
  const pagDados = Object.entries(pagamentos).sort((a,b)=>b[1]-a[1]).map(([label,value]) => ({ label, value, pct: Math.round((value/totalPag)*100) }))

  // Fluxo filtrado
  const [anoFluxo, mesFluxo] = filtroFluxoMes.split('-').map(Number)
  const lancamentosMes = lancamentos.filter(l => { const d=new Date(l.data+'T12:00:00'); return d.getFullYear()===anoFluxo&&d.getMonth()===mesFluxo-1 })
  const totalEntradasMes = lancamentosMes.filter(l=>l.tipo==='entrada').reduce((s,l)=>s+Number(l.valor),0)
  const totalSaidasMes   = lancamentosMes.filter(l=>l.tipo==='saida').reduce((s,l)=>s+Number(l.valor),0)
  const saldoMes = totalEntradasMes - totalSaidasMes

  // ── Handlers ────────────────────────────────────────
  async function salvarConfig() {
    setSalvandoConfig(true)
    const payload = { usuario_id: usuarioId, meta_mensal: parseFloat(formConfig.meta_mensal)||0, salario_desejado: parseFloat(formConfig.salario_desejado)||0, atualizado_em: new Date().toISOString() }
    const { data, error } = config.id
      ? await supabase.from('financeiro_config').update(payload).eq('id', config.id).select().single()
      : await supabase.from('financeiro_config').insert(payload).select().single()
    if (!error && data) { setConfig(data); setEditandoConfig(false) }
    setSalvandoConfig(false)
  }

  async function adicionarCusto() {
    if (!novoCusto.nome.trim() || !novoCusto.valor) return
    setSalvandoCusto(true)
    const { data, error } = await supabase.from('custos_fixos').insert({ usuario_id: usuarioId, nome: novoCusto.nome.trim(), valor: parseFloat(novoCusto.valor) }).select().single()
    if (!error && data) { setCustos(p=>[...p, data as CustoFixo]); setNovoCusto({nome:'',valor:''}) }
    setSalvandoCusto(false)
  }

  async function deletarCusto(id: string) {
    const { error } = await supabase.from('custos_fixos').delete().eq('id', id)
    if (!error) setCustos(p=>p.filter(c=>c.id!==id))
  }

  async function adicionarLancamento() {
    if (!novoLanc.descricao.trim() || !novoLanc.valor || !novoLanc.data) return
    setSalvandoLanc(true)
    const { data, error } = await supabase.from('fluxo_caixa').insert({ usuario_id: usuarioId, tipo: novoLanc.tipo, descricao: novoLanc.descricao.trim(), valor: parseFloat(novoLanc.valor), data: novoLanc.data, categoria: novoLanc.categoria || null }).select().single()
    if (!error && data) { setLancamentos(p=>[data as Lancamento,...p]); setNovoLanc({tipo:'entrada',descricao:'',valor:'',data:agora.toISOString().split('T')[0],categoria:''}) }
    setSalvandoLanc(false)
  }

  async function deletarLancamento(id: string) {
    const { error } = await supabase.from('fluxo_caixa').delete().eq('id', id)
    if (!error) setLancamentos(p=>p.filter(l=>l.id!==id))
  }

  // ── Exportar PDF ──────────────────────────────────────
  function exportarPDF() {
    const linhasPedidos = pedidosFiltrados.map(p => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${p.nome_cliente}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${new Date(p.data_evento+'T00:00:00').toLocaleDateString('pt-BR')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${p.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700">R$ ${Number(p.valor_total).toFixed(2).replace('.',',')}</td>
      </tr>`).join('')

    const linhasCustos = custos.map(c => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${c.nome}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#dc2626;font-weight:700">- R$ ${Number(c.valor).toFixed(2).replace('.',',')}</td>
      </tr>`).join('')

    const labelPeriodo = filtroPeriodoCards==='mes' ? `${MESES_FULL[mesAtual]} ${anoAtual}` : filtroPeriodoCards==='tri' ? 'Último trimestre' : `Ano ${anoAtual}`

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Financeiro — Encantiva Pro</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12pt;color:#111;padding:48px 60px;line-height:1.5}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #111}
      h1{font-size:20pt;letter-spacing:-0.5px}
      .sub{font-size:10pt;color:#666;margin-top:4px}
      .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
      .card{border:1.5px solid #e8e8ec;border-radius:8px;padding:14px 16px}
      .card-label{font-size:8pt;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:4px}
      .card-value{font-size:14pt;font-weight:800;letter-spacing:-0.3px}
      .section{margin-bottom:28px}
      .section-title{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e8e8ec;padding-bottom:6px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      thead td{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#999;padding:6px 12px;border-bottom:2px solid #e8e8ec}
      .meta-bar{background:#f3f4f6;border-radius:99px;height:8px;margin-top:8px;overflow:hidden}
      .meta-fill{height:100%;background:linear-gradient(90deg,#ff33cc,#9900ff);border-radius:99px}
      .footer{margin-top:40px;text-align:center;font-size:8pt;color:#aaa;border-top:1px solid #e8e8ec;padding-top:12px}
      @media print{body{padding:24px 36px}@page{margin:0}}
    </style></head><body>
    <div class="header">
      <div><h1>Relatório Financeiro</h1><div class="sub">Período: ${labelPeriodo} · Gerado em ${new Date().toLocaleDateString('pt-BR')}</div></div>
      <div style="text-align:right"><div style="font-weight:700;font-size:14pt;color:#ff33cc">Encantiva Pro</div></div>
    </div>
    <div class="cards">
      <div class="card"><div class="card-label">Total geral</div><div class="card-value" style="color:#7700ff">${fmt(totalGeral)}</div></div>
      <div class="card"><div class="card-label">Recebido</div><div class="card-value" style="color:#059669">${fmt(totalRecebido)}</div></div>
      <div class="card"><div class="card-label">A receber</div><div class="card-value" style="color:#d97706">${fmt(totalPendente)}</div></div>
      <div class="card"><div class="card-label">Ticket médio</div><div class="card-value" style="color:#111">${fmt(ticketMedio)}</div></div>
    </div>
    ${metaMensal > 0 ? `
    <div class="section">
      <div class="section-title">Meta mensal</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span>Meta: ${fmt(metaMensal)}</span>
        <span style="font-weight:700;color:${pctMeta>=100?'#059669':'#ff33cc'}">${pctMeta.toFixed(0)}% atingido — ${fmt(receitaMes)}</span>
      </div>
      <div class="meta-bar"><div class="meta-fill" style="width:${pctMeta}%"></div></div>
    </div>` : ''}
    ${custos.length > 0 ? `
    <div class="section">
      <div class="section-title">Custos fixos mensais</div>
      <table><thead><tr><td>Custo</td><td style="text-align:right">Valor</td></tr></thead><tbody>${linhasCustos}</tbody>
      <tr><td style="padding:10px 12px;font-weight:700">Total custos</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:#dc2626">- R$ ${totalCustosFixos.toFixed(2).replace('.',',')}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:700">Lucro líquido estimado</td><td style="padding:10px 12px;text-align:right;font-weight:800;color:${lucroLiquido>=0?'#059669':'#dc2626'}">${fmt(lucroLiquido)}</td></tr>
      </table>
    </div>` : ''}
    <div class="section">
      <div class="section-title">Pedidos do período (${pedidosFiltrados.length})</div>
      <table><thead><tr><td>Cliente</td><td>Data do evento</td><td>Status</td><td style="text-align:right">Valor</td></tr></thead>
      <tbody>${linhasPedidos}</tbody></table>
    </div>
    <div class="footer">Relatório gerado pela Encantiva Pro · encantivapro.com.br</div>
    </body></html>`

    const janela = window.open('','_blank')
    if (!janela) return
    janela.document.write(html); janela.document.close(); janela.focus()
    setTimeout(()=>janela.print(), 500)
  }

  // ── Estilos ──────────────────────────────────────────
  const input: React.CSSProperties = { width:'100%', boxSizing:'border-box', fontFamily:'Inter,sans-serif', fontSize:'13px', color:'#111827', background:'#fafafa', border:'1px solid #e8e8ec', borderRadius:'10px', padding:'10px 12px', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:600, color:'#9ca3af', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:'5px' }
  const card: React.CSSProperties = { background:'#fff', border:'1px solid #e8e8ec', borderRadius:'14px', padding:'20px', marginBottom:'12px' }
  const btnPrimario: React.CSSProperties = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px', background:'#ff33cc', color:'#fff', border:'none', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', borderRadius:'999px', cursor:'pointer', padding:'9px 18px' }

  // ── ABAS ────────────────────────────────────────────
  const ABAS = [
    { key: 'visao', label: '📊 Visão geral' },
    { key: 'fluxo', label: '💸 Fluxo de caixa' },
    { key: 'config', label: '⚙️ Configurações' },
  ] as const

  return (
    <div>
      {/* Abas + Exportar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div style={{ display:'flex', gap:'6px' }}>
          {ABAS.map(a => (
            <button key={a.key} onClick={()=>setAba(a.key)} style={{ padding:'8px 16px', borderRadius:'999px', border:`1.5px solid ${aba===a.key?'transparent':'#e8e8ec'}`, background:aba===a.key?'#ff33cc':'#fff', color:aba===a.key?'#fff':'#6b7280', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'12px', cursor:'pointer', transition:'all .15s' }}>
              {a.label}
            </button>
          ))}
        </div>
        <button onClick={exportarPDF} style={{ ...btnPrimario, background:'#1a0040', fontSize:'12px', padding:'8px 16px' }}>
          <IconPrint /> Exportar PDF
        </button>
      </div>

      {/* ════ ABA VISÃO GERAL ════ */}
      {aba === 'visao' && (
        <div>
          {/* Filtro de período dos cards */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'16px' }}>
            {(['mes','tri','ano'] as const).map(p => (
              <button key={p} onClick={()=>setFiltroPeriodoCards(p)} style={{ padding:'6px 14px', borderRadius:'999px', border:`1.5px solid ${filtroPeriodoCards===p?'#ff33cc':'#e8e8ec'}`, background:filtroPeriodoCards===p?'#fff0fb':'#fff', color:filtroPeriodoCards===p?'#ff33cc':'#6b7280', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                {p==='mes'?`${MESES[mesAtual]}`:p==='tri'?'Trimestre':'Ano'}
              </button>
            ))}
          </div>

          {/* Cards métricas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginBottom:'16px' }}>
            {[
              { label:'Total geral',   value:fmt(totalGeral),    sub:'Exceto cancelados',      icon:<IconMoney />,  accent:'#7700ff' },
              { label:'Recebido',      value:fmt(totalRecebido), sub:'Pedidos concluídos',      icon:<IconCheck />,  accent:'#059669' },
              { label:'A receber',     value:fmt(totalPendente), sub:'Pendentes + confirmados', icon:<IconClock />,  accent:'#d97706' },
              { label:'Cancelado',     value:fmt(totalCancelado),sub:'Pedidos cancelados',      icon:<IconCard />,   accent:'#dc2626' },
            ].map((card, i) => (
              <div key={i} style={{ background:'#fff', border:'1px solid #e8e8ec', borderRadius:'12px', padding:'16px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:36, height:36, borderRadius:'9px', background:`${card.accent}12`, color:card.accent, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{card.icon}</div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, color:'#9ca3af', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.8px' }}>{card.label}</p>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'17px', fontWeight:800, color:card.accent, margin:'0 0 1px', letterSpacing:'-0.4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.value}</p>
                  <p style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#d1d5db', margin:0 }}>{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket médio */}
          <div style={{ background:'#fff', border:'1px solid #e8e8ec', borderRadius:'12px', padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:36, height:36, borderRadius:'9px', background:'#e0f2fe', color:'#0ea5e9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconCard /></div>
            <div>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, color:'#9ca3af', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.8px' }}>Ticket médio</p>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'17px', fontWeight:800, color:'#0ea5e9', margin:'0 0 1px', letterSpacing:'-0.4px' }}>{fmt(ticketMedio)}</p>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#d1d5db', margin:0 }}>{pedidosFiltrados.filter(p=>p.status!=='cancelado').length} pedidos no período</p>
            </div>
          </div>

          {/* Meta + Lucro líquido */}
          {(metaMensal > 0 || totalCustosFixos > 0) && (
            <div style={{ display:'grid', gridTemplateColumns: metaMensal>0&&totalCustosFixos>0?'1fr 1fr':'1fr', gap:'10px', marginBottom:'12px' }}>
              {metaMensal > 0 && (
                <div style={card}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ color:'#ff33cc' }}><IconTarget /></span>
                      <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:0 }}>Meta de {MESES[mesAtual]}</p>
                    </div>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:800, color:pctMeta>=100?'#059669':'#ff33cc' }}>{pctMeta.toFixed(0)}%</span>
                  </div>
                  <div style={{ background:'#f3f4f6', borderRadius:'999px', height:'8px', overflow:'hidden', marginBottom:'10px' }}>
                    <div style={{ height:'100%', width:`${pctMeta}%`, background:pctMeta>=100?'linear-gradient(90deg,#059669,#34d399)':'linear-gradient(90deg,#ff33cc,#9900ff)', borderRadius:'999px', transition:'width .6s cubic-bezier(.4,0,.2,1)' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#9ca3af' }}>Realizado: <strong style={{ color:'#111827' }}>{fmt(receitaMes)}</strong></span>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#9ca3af' }}>Meta: <strong style={{ color:'#111827' }}>{fmt(metaMensal)}</strong></span>
                  </div>
                  {pctMeta < 100 && metaMensal > 0 && (
                    <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#f59e0b', margin:'8px 0 0', background:'#fffbf0', borderRadius:'8px', padding:'6px 10px' }}>
                      Faltam {fmt(metaMensal-receitaMes)} para atingir a meta
                    </p>
                  )}
                  {pctMeta >= 100 && (
                    <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#059669', margin:'8px 0 0', background:'#f0fdf4', borderRadius:'8px', padding:'6px 10px' }}>
                      🎉 Meta atingida!
                    </p>
                  )}
                </div>
              )}
              {totalCustosFixos > 0 && (
                <div style={card}>
                  <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:'0 0 12px' }}>Lucro estimado</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#9ca3af' }}>Recebido</span>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700, color:'#059669' }}>+ {fmt(totalRecebido)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#9ca3af' }}>Custos fixos</span>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700, color:'#dc2626' }}>- {fmt(totalCustosFixos)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #f3f4f6', paddingTop:'8px' }}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, color:'#111827' }}>Lucro líquido</span>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'15px', fontWeight:900, color:lucroLiquido>=0?'#059669':'#dc2626', letterSpacing:'-0.3px' }}>{fmt(lucroLiquido)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gráfico receita por mês */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:'0 0 2px' }}>Receita por mês</p>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#9ca3af', margin:0 }}>Total: {fmt(receitaPorMes.reduce((s,m)=>s+m.total,0))}</p>
              </div>
              <div style={{ display:'flex', gap:'4px', background:'#f6f6f8', borderRadius:'8px', padding:'3px' }}>
                {(['3m','6m','12m'] as const).map(p => (
                  <button key={p} onClick={()=>setPeriodo(p)} style={{ padding:'5px 12px', borderRadius:'6px', border:'none', background:periodo===p?'#fff':'transparent', color:periodo===p?'#111827':'#9ca3af', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'11px', cursor:'pointer', boxShadow:periodo===p?'0 1px 3px rgba(0,0,0,0.08)':'none', transition:'all .15s' }}>{p}</button>
                ))}
              </div>
            </div>
            <GraficoLinha dados={receitaPorMes} />
          </div>

          {/* Top clientes + Pagamentos */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div style={card}>
              <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:'0 0 16px' }}>Top clientes</p>
              {top5.length === 0 ? (
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#d1d5db', textAlign:'center', padding:'20px 0', margin:0 }}>Sem dados</p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {top5.map(([nome, valor], i) => (
                    <div key={nome}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:800, color:'#9ca3af', width:16, textAlign:'right', flexShrink:0 }}>#{i+1}</span>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nome}</span>
                        </div>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700, color:'#ff33cc', flexShrink:0, marginLeft:'8px' }}>{fmt(valor)}</span>
                      </div>
                      <div style={{ height:'4px', background:'#f3f4f6', borderRadius:'99px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(valor/maxTop5)*100}%`, background:'linear-gradient(90deg,#ff33cc,#9900ff)', borderRadius:'99px', transition:'width .5s' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px' }}>
                <span style={{ color:'#7700ff' }}><IconCard /></span>
                <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:0 }}>Formas de pagamento</p>
              </div>
              {pagDados.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {pagDados.map((d, i) => (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                        <span style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:500, color:'#374151' }}>{d.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', color:'#9ca3af' }}>R$ {d.value.toFixed(0)}</span>
                          <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:700, color:'#7700ff', background:'#f5f0ff', padding:'1px 7px', borderRadius:'5px' }}>{d.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:'5px', background:'#f3f4f6', borderRadius:'99px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${d.pct}%`, background:'linear-gradient(90deg,#e879f9,#9900ff)', borderRadius:'99px', transition:'width .5s' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#d1d5db', textAlign:'center', padding:'20px 0', margin:0 }}>Sem dados</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ ABA FLUXO DE CAIXA ════ */}
      {aba === 'fluxo' && (
        <div>
          {/* Novo lançamento */}
          <div style={card}>
            <p style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:'14px', color:'#111827', margin:'0 0 16px' }}>Novo lançamento</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {/* Tipo */}
              <div style={{ display:'flex', gap:'8px' }}>
                {(['entrada','saida'] as const).map(t => (
                  <button key={t} onClick={()=>setNovoLanc(p=>({...p,tipo:t,categoria:''}))} style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1.5px solid ${novoLanc.tipo===t?(t==='entrada'?'#10b981':'#ef4444'):'#e8e8ec'}`, background:novoLanc.tipo===t?(t==='entrada'?'#f0fdf9':'#fff5f5'):'#fafafa', color:novoLanc.tipo===t?(t==='entrada'?'#059669':'#dc2626'):'#9ca3af', fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    {t==='entrada'?<IconArrowUp />:<IconArrowDn />}
                    {t==='entrada'?'Entrada':'Saída'}
                  </button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div><span style={lbl}>Descrição *</span><input style={input} placeholder="Ex: Compra de materiais" value={novoLanc.descricao} onChange={e=>setNovoLanc(p=>({...p,descricao:e.target.value}))}/></div>
                <div><span style={lbl}>Valor (R$) *</span><input type="number" style={input} placeholder="0,00" value={novoLanc.valor} onChange={e=>setNovoLanc(p=>({...p,valor:e.target.value}))}/></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div><span style={lbl}>Data *</span><input type="date" style={input} value={novoLanc.data} onChange={e=>setNovoLanc(p=>({...p,data:e.target.value}))}/></div>
                <div>
                  <span style={lbl}>Categoria</span>
                  <select style={input} value={novoLanc.categoria} onChange={e=>setNovoLanc(p=>({...p,categoria:e.target.value}))}>
                    <option value="">Sem categoria</option>
                    {(novoLanc.tipo==='saida'?CATEGORIAS_SAIDA:CATEGORIAS_ENTRADA).map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={adicionarLancamento} disabled={salvandoLanc||!novoLanc.descricao.trim()||!novoLanc.valor} style={{ ...btnPrimario, width:'100%', padding:'12px', borderRadius:'999px', background:novoLanc.tipo==='entrada'?'#059669':'#dc2626', opacity:salvandoLanc||!novoLanc.descricao.trim()||!novoLanc.valor?0.5:1 }}>
                <IconPlus /> {salvandoLanc?'Salvando...':novoLanc.tipo==='entrada'?'Registrar entrada':'Registrar saída'}
              </button>
            </div>
          </div>

          {/* Filtro de mês */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'10px' }}>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input type="month" value={filtroFluxoMes} onChange={e=>setFiltroFluxoMes(e.target.value)} style={{ ...input, width:'auto', padding:'8px 12px' }}/>
              <div style={{ display:'flex', gap:'4px' }}>
                <div style={{ background:'#f0fdf9', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'6px 12px' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:700, color:'#059669' }}>+ {fmt(totalEntradasMes)}</span>
                </div>
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'6px 12px' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:700, color:'#dc2626' }}>- {fmt(totalSaidasMes)}</span>
                </div>
                <div style={{ background:saldoMes>=0?'#f0fdf9':'#fef2f2', border:`1px solid ${saldoMes>=0?'#bbf7d0':'#fecaca'}`, borderRadius:'8px', padding:'6px 12px' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:800, color:saldoMes>=0?'#059669':'#dc2626' }}>Saldo: {fmt(saldoMes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de lançamentos */}
          {lancamentosMes.length === 0 ? (
            <div style={{ ...card, textAlign:'center', padding:'48px' }}>
              <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'14px', color:'#374151', margin:'0 0 4px' }}>Nenhum lançamento em {MESES_FULL[mesFluxo-1]}</p>
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#9ca3af', margin:0 }}>Registre entradas e saídas acima</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {lancamentosMes.map(l => (
                <div key={l.id} style={{ background:'#fff', border:`1px solid ${l.tipo==='entrada'?'#dcfce7':'#fecaca'}`, borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:l.tipo==='entrada'?'#f0fdf9':'#fef2f2', color:l.tipo==='entrada'?'#059669':'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {l.tipo==='entrada'?<IconArrowUp />:<IconArrowDn />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:'Inter,sans-serif', fontWeight:700, fontSize:'13px', color:'#111827', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.descricao}</p>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#9ca3af' }}>{new Date(l.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      {l.categoria && <span style={{ background:'#f3f4f6', borderRadius:'999px', padding:'1px 8px', fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, color:'#6b7280' }}>{l.categoria}</span>}
                    </div>
                  </div>
                  <span style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:'14px', color:l.tipo==='entrada'?'#059669':'#dc2626', flexShrink:0, letterSpacing:'-0.3px' }}>
                    {l.tipo==='entrada'?'+':'-'} {fmt(l.valor)}
                  </span>
                  <button onClick={()=>deletarLancamento(l.id)} style={{ width:30, height:30, borderRadius:'999px', border:'1px solid #fecaca', background:'#fff5f5', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ ABA CONFIGURAÇÕES ════ */}
      {aba === 'config' && (
        <div>
          {/* Meta e Salário */}
          <div style={card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div>
                <p style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:'14px', color:'#111827', margin:'0 0 2px' }}>Meta e salário</p>
                <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#9ca3af', margin:0 }}>Defina seus objetivos mensais</p>
              </div>
              <button onClick={()=>setEditandoConfig(v=>!v)} style={{ display:'flex', alignItems:'center', gap:'5px', background:'#fafafa', border:'1px solid #e8e8ec', borderRadius:'999px', padding:'7px 14px', color:'#6b7280', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:'12px', cursor:'pointer' }}>
                <IconEdit /> {editandoConfig?'Cancelar':'Editar'}
              </button>
            </div>
            {editandoConfig ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <span style={lbl}>Meta de receita mensal (R$)</span>
                    <input type="number" style={input} placeholder="Ex: 3000" value={formConfig.meta_mensal} onChange={e=>setFormConfig(f=>({...f,meta_mensal:e.target.value}))}/>
                  </div>
                  <div>
                    <span style={lbl}>Salário desejado (R$)</span>
                    <input type="number" style={input} placeholder="Ex: 2000" value={formConfig.salario_desejado} onChange={e=>setFormConfig(f=>({...f,salario_desejado:e.target.value}))}/>
                  </div>
                </div>
                <button onClick={salvarConfig} disabled={salvandoConfig} style={{ ...btnPrimario, width:'100%', padding:'12px', borderRadius:'999px', opacity:salvandoConfig?0.7:1 }}>
                  <IconSave /> {salvandoConfig?'Salvando...':'Salvar configurações'}
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                {[
                  { label:'Meta mensal', value:fmt(Number(config.meta_mensal)||0), color:'#ff33cc', icon:<IconTarget /> },
                  { label:'Salário desejado', value:fmt(Number(config.salario_desejado)||0), color:'#059669', icon:<IconCheck /> },
                ].map((item, i) => (
                  <div key={i} style={{ background:'#f9fafb', borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:36, height:36, borderRadius:'9px', background:`${item.color}12`, color:item.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
                    <div>
                      <p style={{ fontFamily:'Inter,sans-serif', fontSize:'10px', fontWeight:600, color:'#9ca3af', margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'0.8px' }}>{item.label}</p>
                      <p style={{ fontFamily:'Inter,sans-serif', fontSize:'16px', fontWeight:800, color:'#111827', margin:0, letterSpacing:'-0.3px' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custos fixos */}
          <div style={card}>
            <p style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:'14px', color:'#111827', margin:'0 0 4px' }}>Custos fixos mensais</p>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'11px', color:'#9ca3af', margin:'0 0 16px' }}>Aluguel, software, marketing, etc.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px', alignItems:'end', marginBottom:'16px' }}>
              <div><span style={lbl}>Nome do custo</span><input style={input} placeholder="Ex: Instagram Ads" value={novoCusto.nome} onChange={e=>setNovoCusto(p=>({...p,nome:e.target.value}))}/></div>
              <div><span style={lbl}>Valor (R$)</span><input type="number" style={{ ...input, width:'120px' }} placeholder="0,00" value={novoCusto.valor} onChange={e=>setNovoCusto(p=>({...p,valor:e.target.value}))}/></div>
              <button onClick={adicionarCusto} disabled={salvandoCusto||!novoCusto.nome.trim()||!novoCusto.valor} style={{ ...btnPrimario, padding:'10px 16px', height:'40px', opacity:salvandoCusto||!novoCusto.nome.trim()||!novoCusto.valor?0.5:1 }}>
                <IconPlus />
              </button>
            </div>
            {custos.length === 0 ? (
              <p style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', color:'#d1d5db', textAlign:'center', padding:'20px 0', margin:0 }}>Nenhum custo fixo cadastrado</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {custos.map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafafa', borderRadius:'10px', padding:'10px 14px', border:'1px solid #f3f4f6' }}>
                    <span style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:600, color:'#111827' }}>{c.nome}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, color:'#dc2626' }}>- {fmt(c.valor)}</span>
                      <button onClick={()=>deletarCusto(c.id)} style={{ width:28, height:28, borderRadius:'999px', border:'1px solid #fecaca', background:'#fff5f5', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><IconTrash /></button>
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid #f3f4f6' }}>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight:700, color:'#111827' }}>Total custos fixos</span>
                  <span style={{ fontFamily:'Inter,sans-serif', fontSize:'15px', fontWeight:900, color:'#dc2626', letterSpacing:'-0.3px' }}>{fmt(totalCustosFixos)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .fin-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}