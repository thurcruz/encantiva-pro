'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface Afiliado {
  id: string
  nome: string
  email: string
  codigo: string
  asaas_wallet_id: string | null
  comissao_pct: number
  ativo: boolean
  criado_em: string
}

interface Stats {
  cliques: number
  conversoes: number
  ganhos: number
  pendente: number
}

interface Props {
  afiliados: Afiliado[]
  statsMap: Record<string, Stats>
}

function slugCodigo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8)
}

export default function GerenciarAfiliados({ afiliados: inicial, statsMap }: Props) {
  const [afiliados, setAfiliados] = useState<Afiliado[]>(inicial)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [comissao, setComissao] = useState(30)
  const [walletId, setWalletId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const [copiado, setCopiado] = useState<string | null>(null)
  const [editandoWallet, setEditandoWallet] = useState<string | null>(null)
  const [walletEditVal, setWalletEditVal] = useState('')

  function handleNome(v: string) {
    setNome(v)
    setCodigo(slugCodigo(v))
  }

  function handleCodigo(v: string) {
    setCodigo(v.replace(/[^A-Z0-9a-z]/g, '').toUpperCase().slice(0, 10))
  }

  async function criarAfiliado() {
    setErro('')
    setSucesso(false)
    setSalvando(true)
    try {
      const res = await fetch('/api/admin/afiliados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, codigo, comissao_pct: comissao, asaas_wallet_id: walletId || null }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.erro ?? 'Erro ao salvar'); return }
      setAfiliados(prev => [json.afiliado, ...prev])
      setNome(''); setEmail(''); setCodigo(''); setComissao(30); setWalletId('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch {
      setErro('Erro de rede')
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarAfiliado(id: string, campos: Partial<Afiliado>) {
    const res = await fetch('/api/admin/afiliados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...campos }),
    })
    const json = await res.json()
    if (res.ok) {
      setAfiliados(prev => prev.map(a => a.id === id ? json.afiliado : a))
    }
  }

  function copiarLink(codigo: string) {
    const link = `${window.location.origin}/r/${codigo}`
    navigator.clipboard.writeText(link)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  function abrirEditWallet(af: Afiliado) {
    setEditandoWallet(af.id)
    setWalletEditVal(af.asaas_wallet_id ?? '')
  }

  async function salvarWallet(id: string) {
    await atualizarAfiliado(id, { asaas_wallet_id: walletEditVal || null } as Partial<Afiliado>)
    setEditandoWallet(null)
  }

  const semWalletComPendente = afiliados.filter(
    a => !a.asaas_wallet_id && (statsMap[a.id]?.pendente ?? 0) > 0
  )
  const totalPendenteSemWallet = semWalletComPendente.reduce(
    (acc, a) => acc + (statsMap[a.id]?.pendente ?? 0), 0
  )

  const INPUT = {
    background: '#ffffff08',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const LABEL = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    color: '#ffffff66',
    display: 'block',
    marginBottom: '6px',
  }

  return (
    <div>
      {/* Formulário de cadastro */}
      <div style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', margin: '0 0 20px' }}>
          Cadastrar novo afiliado
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={LABEL}>Nome</label>
            <input style={INPUT} value={nome} onChange={e => handleNome(e.target.value)} placeholder="Nome do afiliado" />
          </div>
          <div>
            <label style={LABEL}>Email</label>
            <input style={INPUT} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label style={LABEL}>Código único (max 10 chars)</label>
            <input style={INPUT} value={codigo} onChange={e => handleCodigo(e.target.value)} placeholder="CODIGO123" maxLength={10} />
          </div>
          <div>
            <label style={LABEL}>Comissão %</label>
            <input style={INPUT} type="number" min={1} max={100} value={comissao} onChange={e => setComissao(Number(e.target.value))} />
          </div>
          <div>
            <label style={LABEL}>Asaas Wallet ID (opcional)</label>
            <input style={INPUT} value={walletId} onChange={e => setWalletId(e.target.value)} placeholder="wal_xxxxxxxxxxxxxxxx" />
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#ffffff33', margin: '4px 0 0' }}>
              Encontre em: Asaas → Minha Conta → Dados da Conta → ID da Carteira
            </p>
          </div>
        </div>

        {erro && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ff5555', margin: '0 0 12px' }}>{erro}</p>
        )}
        {sucesso && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00ff88', margin: '0 0 12px' }}>Afiliado cadastrado com sucesso!</p>
        )}

        <button
          onClick={criarAfiliado}
          disabled={salvando || !nome || !email || !codigo}
          style={{ background: 'linear-gradient(135deg, #ff33cc, #9900ff)', border: 'none', borderRadius: '10px', padding: '10px 24px', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '14px', cursor: salvando ? 'not-allowed' : 'pointer', opacity: (!nome || !email || !codigo) ? 0.5 : 1 }}
        >
          {salvando ? 'Salvando...' : 'Cadastrar'}
        </button>
      </div>

      {/* Tabela */}
      {afiliados.length === 0 ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff33', textAlign: 'center', padding: '40px 0' }}>
          Nenhum afiliado cadastrado ainda.
        </p>
      ) : (
        <div style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Afiliado', 'Código / Link', 'Cliques', 'Conv.', 'Ganhos', 'Pendente', 'Split', 'Ativo', 'Com. %'].map(h => (
                    <th key={h} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#ffffff44', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '14px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {afiliados.map(af => {
                  const stats = statsMap[af.id] ?? { cliques: 0, conversoes: 0, ganhos: 0, pendente: 0 }
                  const temWallet = !!af.asaas_wallet_id

                  return (
                    <tr key={af.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Afiliado */}
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>{af.nome}</p>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#ffffff44', margin: 0 }}>{af.email}</p>
                      </td>

                      {/* Código + Link */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#cc66ff', background: 'rgba(153,0,255,0.15)', borderRadius: '6px', padding: '2px 8px' }}>
                            {af.codigo}
                          </span>
                          <button
                            onClick={() => copiarLink(af.codigo)}
                            title="Copiar link"
                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: copiado === af.codigo ? '#00ff88' : '#ffffff88', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiado === af.codigo ? <Check size={12} /> : <Copy size={12} />}
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                              {copiado === af.codigo ? 'Copiado' : 'Copiar link'}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Cliques */}
                      <td style={{ padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc' }}>
                        {stats.cliques}
                      </td>

                      {/* Conversões */}
                      <td style={{ padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffffcc' }}>
                        {stats.conversoes}
                      </td>

                      {/* Ganhos pagos */}
                      <td style={{ padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00ff88', fontWeight: 600 }}>
                        R$ {stats.ganhos.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Pendente */}
                      <td style={{ padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: stats.pendente > 0 ? '#ffcc00' : '#ffffff33', fontWeight: stats.pendente > 0 ? 600 : 400 }}>
                        R$ {stats.pendente.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Split */}
                      <td style={{ padding: '14px 16px' }}>
                        {editandoWallet === af.id ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              value={walletEditVal}
                              onChange={e => setWalletEditVal(e.target.value)}
                              placeholder="wal_xxxx"
                              style={{ ...INPUT, width: '140px', padding: '6px 10px', fontSize: '12px' }}
                            />
                            <button onClick={() => salvarWallet(af.id)} style={{ background: '#00ff8833', border: '1px solid #00ff8866', borderRadius: '6px', padding: '5px 10px', color: '#00ff88', fontFamily: 'Inter, sans-serif', fontSize: '12px', cursor: 'pointer' }}>
                              OK
                            </button>
                            <button onClick={() => setEditandoWallet(null)} style={{ background: 'transparent', border: 'none', padding: '5px', color: '#ffffff44', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
                              x
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => abrirEditWallet(af)}
                            title={temWallet ? af.asaas_wallet_id ?? '' : 'Sem Wallet ID — clique para adicionar'}
                            style={{ background: temWallet ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${temWallet ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', color: temWallet ? '#00ff88' : '#ffffff55', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ExternalLink size={11} />
                            {temWallet ? 'Auto' : 'Manual'}
                          </button>
                        )}
                      </td>

                      {/* Ativo toggle */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => atualizarAfiliado(af.id, { ativo: !af.ativo })}
                          style={{ background: af.ativo ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${af.ativo ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', color: af.ativo ? '#00ff88' : '#ffffff44', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600 }}
                        >
                          {af.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>

                      {/* Comissão % */}
                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          defaultValue={af.comissao_pct}
                          onBlur={e => {
                            const v = Number(e.target.value)
                            if (v !== af.comissao_pct) atualizarAfiliado(af.id, { comissao_pct: v })
                          }}
                          style={{ ...INPUT, width: '70px', padding: '5px 10px', fontSize: '13px' }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Aviso pendente sem wallet */}
          {totalPendenteSemWallet > 0 && (
            <div style={{ margin: '0', padding: '14px 20px', borderTop: '1px solid rgba(255,204,0,0.2)', background: 'rgba(255,204,0,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#ffcc00' }}>
                R$ {totalPendenteSemWallet.toFixed(2).replace('.', ',')} em comissoes pendentes para afiliados sem Wallet ID — pagar manualmente via PIX
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
