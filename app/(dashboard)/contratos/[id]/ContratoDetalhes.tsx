'use client'

import { useState } from 'react'
import { Copy, Check, Printer, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Perfil {
  nome_loja: string | null
  cpf_cnpj: string | null
  telefone: string | null
  endereco: string | null
  assinatura_loja: string | null
}

interface Props {
  contrato: {
    id: string
    cliente_nome: string | null
    cliente_cpf: string | null
    cliente_telefone: string | null
    cliente_email: string | null
    cliente_endereco: string | null
    evento_data: string
    evento_local: string | null
    evento_horario: string | null
    itens: { id: number; descricao: string; quantidade: number; valor: number }[]
    valor_total: number
    forma_pagamento: string | null
    valor_sinal: number
    regras: string | null
    status: string
    token_assinatura: string
    assinado_em: string | null
    assinatura_dados: string | null
  }
  perfil: Perfil | null
}

export default function ContratoDetalhes({ contrato, perfil }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [confirmDeletar, setConfirmDeletar] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function copiarLink() {
    const linkAssinatura = `${window.location.origin}/assinar/${contrato.token_assinatura}`
    await navigator.clipboard.writeText(linkAssinatura)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function deletarContrato() {
    setDeletando(true)
    await supabase.from('contratos').delete().eq('id', contrato.id)
    router.push('/contratos')
    router.refresh()
  }

  function imprimirContrato() {
    const dataEvento = new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')
    const dataAssinatura = contrato.assinado_em
      ? new Date(contrato.assinado_em).toLocaleString('pt-BR')
      : null

    const itensHtml = contrato.itens.map(item => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0;">${item.descricao}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align:center;">${item.quantidade}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align:right;">R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align:right; font-weight:700;">R$ ${(item.quantidade * item.valor).toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contrato de Locação</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #111;
            background: #fff;
            padding: 60px 80px;
            line-height: 1.6;
          }
          h1 { font-size: 18pt; text-align: center; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 4px; }
          .subtitulo { text-align: center; font-size: 11pt; color: #555; margin-bottom: 32px; }
          .linha-divisoria { border: none; border-top: 2px solid #111; margin: 8px 0 32px 0; }
          .secao-titulo {
            font-size: 11pt; font-weight: bold; text-transform: uppercase;
            letter-spacing: 1px; border-bottom: 1px solid #111;
            padding-bottom: 4px; margin-bottom: 14px; margin-top: 24px;
          }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 8px; }
          .campo label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; color: #777; display: block; margin-bottom: 2px; }
          .campo span { font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11pt; }
          thead tr { background: #f5f5f5; }
          thead td { padding: 8px 12px; font-weight: bold; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
          .total-row { font-weight: bold; font-size: 12pt; }
          .total-row td { padding: 12px; border-top: 2px solid #111; }
          .regras { font-size: 10pt; line-height: 1.8; color: #333; white-space: pre-wrap; }
          .assinatura-area { margin-top: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
          .assinatura-box { text-align: center; }
          .assinatura-linha { border-top: 1px solid #111; margin-top: 60px; padding-top: 8px; font-size: 10pt; }
          .assinatura-img { max-height: 80px; margin-bottom: -20px; }
          .rodape { margin-top: 40px; text-align: center; font-size: 9pt; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
          .loja-header { text-align: center; margin-bottom: 24px; }
          .loja-header h2 { font-size: 14pt; font-weight: bold; }
          .loja-header p { font-size: 10pt; color: #555; }
          @media print { body { padding: 40px 60px; } @page { margin: 0; } }
        </style>
      </head>
      <body>

        ${perfil?.nome_loja ? `
        <div class="loja-header">
          <h2>${perfil.nome_loja}</h2>
          <p>
            ${perfil.cpf_cnpj ?? ''}
            ${perfil.telefone ? ` · ${perfil.telefone}` : ''}
            ${perfil.endereco ? ` · ${perfil.endereco}` : ''}
          </p>
        </div>
        ` : ''}

        <h1>Contrato de Locação</h1>
        <div class="subtitulo">Locação de itens para eventos e festas</div>
        <hr class="linha-divisoria">

        <div class="secao-titulo">Das Partes</div>
        <p style="margin-bottom:8px;">
          <strong>LOCADOR:</strong> ${perfil?.nome_loja ?? '___________________________'},
          ${perfil?.cpf_cnpj ? `inscrito(a) sob o CPF/CNPJ nº ${perfil.cpf_cnpj},` : ''}
          ${perfil?.telefone ? `telefone ${perfil.telefone},` : ''}
          ${perfil?.endereco ? `com endereço em ${perfil.endereco}.` : ''}
        </p>
        <p>
          <strong>LOCATÁRIO:</strong> ${contrato.cliente_nome || '___________________________'},
          ${contrato.cliente_cpf ? `inscrito(a) sob o CPF nº ${contrato.cliente_cpf},` : ''}
          ${contrato.cliente_telefone ? `telefone ${contrato.cliente_telefone},` : ''}
          ${contrato.cliente_endereco ? `residente em ${contrato.cliente_endereco}.` : ''}
        </p>

        <div class="secao-titulo">Do Evento</div>
        <div class="grid-2">
          <div class="campo"><label>Data do Evento</label><span>${dataEvento}</span></div>
          ${contrato.evento_horario ? `<div class="campo"><label>Horário</label><span>${contrato.evento_horario}</span></div>` : ''}
          ${contrato.evento_local ? `<div class="campo" style="grid-column: 1 / -1"><label>Local</label><span>${contrato.evento_local}</span></div>` : ''}
        </div>

        <div class="secao-titulo">Dos Itens Locados</div>
        <table>
          <thead>
            <tr>
              <td>Descrição</td>
              <td style="text-align:center;">Qtd</td>
              <td style="text-align:right;">Valor Unit.</td>
              <td style="text-align:right;">Total</td>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td style="text-align:right;">R$ ${Number(contrato.valor_total).toFixed(2).replace('.', ',')}</td>
          </tr>
        </table>

        <div class="secao-titulo">Do Pagamento</div>
        <div class="grid-2">
          ${contrato.forma_pagamento ? `<div class="campo"><label>Forma de Pagamento</label><span>${contrato.forma_pagamento}</span></div>` : ''}
          ${Number(contrato.valor_sinal) > 0 ? `<div class="campo"><label>Sinal</label><span>R$ ${Number(contrato.valor_sinal).toFixed(2).replace('.', ',')}</span></div>` : ''}
          ${Number(contrato.valor_sinal) > 0 ? `<div class="campo"><label>Saldo Restante</label><span>R$ ${(Number(contrato.valor_total) - Number(contrato.valor_sinal)).toFixed(2).replace('.', ',')}</span></div>` : ''}
        </div>

        ${contrato.regras ? `
        <div class="secao-titulo">Das Responsabilidades</div>
        <div class="regras">${contrato.regras}</div>
        ` : ''}

        <div class="assinatura-area">
          <div class="assinatura-box">
            ${perfil?.assinatura_loja ? `<img src="${perfil.assinatura_loja}" class="assinatura-img" />` : ''}
            <div class="assinatura-linha">
              <strong>${perfil?.nome_loja ?? 'Locador'}</strong><br>
              Locador
            </div>
          </div>
          <div class="assinatura-box">
            ${contrato.assinatura_dados ? `<img src="${contrato.assinatura_dados}" class="assinatura-img" />` : ''}
            <div class="assinatura-linha">
              <strong>${contrato.cliente_nome || '___________________________'}</strong><br>
              Locatário
              ${dataAssinatura ? `<br><small>Assinado em ${dataAssinatura}</small>` : ''}
            </div>
          </div>
        </div>

        <div class="rodape">
          Documento gerado eletronicamente · ${new Date().toLocaleDateString('pt-BR')}
          ${perfil?.nome_loja ? ` · ${perfil.nome_loja}` : ''}
        </div>

      </body>
      </html>
    `

    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(html)
    janela.document.close()
    janela.focus()
    setTimeout(() => janela.print(), 500)
  }

  const badgeStatus = {
    pendente: { label: 'Aguardando assinatura', cor: '#cc8800', bg: '#fff8e6' },
    assinado: { label: 'Assinado', cor: '#00aa55', bg: '#e6fff2' },
    cancelado: { label: 'Cancelado', cor: '#cc0000', bg: '#fff0f0' },
  }[contrato.status] ?? { label: 'Pendente', cor: '#cc8800', bg: '#fff8e6' }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #eeeeee',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
  }

  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    fontWeight: 600,
    color: '#00000044',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    display: 'block',
  }

  const valorStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#140033',
    fontWeight: 500,
  }

  return (
    <div>

      {/* Status + ações */}
      <div style={{
        background: '#fff', border: '1px solid #eeeeee', borderRadius: '16px',
        padding: '20px 24px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{
          background: badgeStatus.bg, color: badgeStatus.cor,
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px',
          padding: '6px 14px', borderRadius: '100px',
        }}>
          {badgeStatus.label}
        </span>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {contrato.status === 'pendente' && (
            <button onClick={copiarLink} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: copiado ? '#e6fff2' : '#f5f0ff',
              border: `1px solid ${copiado ? '#00aa5533' : '#9900ff33'}`,
              borderRadius: '10px', padding: '10px 16px',
              color: copiado ? '#00aa55' : '#9900ff',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}>
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? 'Link copiado!' : 'Copiar link para assinar'}
            </button>
          )}

          <button onClick={imprimirContrato} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #ff33cc, #9900ff)',
            border: 'none', borderRadius: '10px', padding: '10px 16px',
            color: '#fff', fontFamily: 'Inter, sans-serif',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}>
            <Printer size={14} />
            Baixar / Imprimir PDF
          </button>

          {confirmDeletar ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={deletarContrato} disabled={deletando} style={{
                background: '#ff33cc', border: 'none', borderRadius: '10px',
                padding: '10px 16px', color: '#fff', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}>
                {deletando ? 'Deletando...' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmDeletar(false)} style={{
                background: '#f9f9f9', border: '1px solid #eeeeee', borderRadius: '10px',
                padding: '10px 16px', color: '#00000066', fontFamily: 'Inter, sans-serif',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeletar(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fff5fd', border: '1px solid #ff33cc33',
              borderRadius: '10px', padding: '10px 16px',
              color: '#ff33cc', fontFamily: 'Inter, sans-serif',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}>
              <Trash2 size={14} />
              Deletar
            </button>
          )}
        </div>
      </div>

      {/* Dados do cliente */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          👤 Dados do cliente
        </h2>
        {contrato.cliente_nome ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Nome', valor: contrato.cliente_nome },
              { label: 'CPF', valor: contrato.cliente_cpf },
              { label: 'Telefone', valor: contrato.cliente_telefone },
              { label: 'E-mail', valor: contrato.cliente_email },
              { label: 'Endereço', valor: contrato.cliente_endereco },
            ].map(campo => campo.valor && (
              <div key={campo.label}>
                <span style={labelStyle}>{campo.label}</span>
                <span style={valorStyle}>{campo.valor}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#00000044', fontStyle: 'italic' }}>
            Aguardando o cliente preencher os dados pelo link de assinatura.
          </p>
        )}
      </div>

      {/* Evento */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          📅 Evento
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <span style={labelStyle}>Data</span>
            <span style={valorStyle}>{new Date(contrato.evento_data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
          {contrato.evento_horario && (
            <div>
              <span style={labelStyle}>Horário</span>
              <span style={valorStyle}>{contrato.evento_horario}</span>
            </div>
          )}
          {contrato.evento_local && (
            <div>
              <span style={labelStyle}>Local</span>
              <span style={valorStyle}>{contrato.evento_local}</span>
            </div>
          )}
        </div>
      </div>

      {/* Itens */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          🎪 Itens locados
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              {['Descrição', 'Qtd', 'Valor unit.', 'Total'].map(col => (
                <th key={col} style={{
                  textAlign: 'left', padding: '8px 0',
                  fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  fontWeight: 600, color: '#00000044',
                  letterSpacing: '1px', textTransform: 'uppercase',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contrato.itens.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '12px 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{item.descricao}</td>
                <td style={{ padding: '12px 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>{item.quantidade}</td>
                <td style={{ padding: '12px 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033' }}>R$ {item.valor.toFixed(2).replace('.', ',')}</td>
                <td style={{ padding: '12px 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#140033', fontWeight: 700 }}>
                  R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#00000066' }}>Total</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '20px', color: '#140033' }}>
            R$ {Number(contrato.valor_total).toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Pagamento */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
          💰 Pagamento
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {contrato.forma_pagamento && (
            <div>
              <span style={labelStyle}>Forma de pagamento</span>
              <span style={valorStyle}>{contrato.forma_pagamento}</span>
            </div>
          )}
          <div>
            <span style={labelStyle}>Valor do sinal</span>
            <span style={valorStyle}>R$ {Number(contrato.valor_sinal).toFixed(2).replace('.', ',')}</span>
          </div>
          <div>
            <span style={labelStyle}>Restante</span>
            <span style={{ ...valorStyle, color: '#9900ff', fontWeight: 700 }}>
              R$ {(Number(contrato.valor_total) - Number(contrato.valor_sinal)).toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>

      {/* Regras */}
      {contrato.regras && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '15px', color: '#140033', margin: '0 0 16px 0' }}>
            📜 Regras
          </h2>
          <pre style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000088', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>
            {contrato.regras}
          </pre>
        </div>
      )}

      {/* Assinado */}
      {contrato.status === 'assinado' && contrato.assinado_em && (
        <div style={{ background: '#e6fff2', border: '1px solid #00aa5533', borderRadius: '16px', padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: '#00aa55', fontSize: '16px', margin: '0 0 4px 0' }}>
            ✅ Contrato assinado digitalmente
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#00000055', margin: 0 }}>
            Assinado em {new Date(contrato.assinado_em).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  )
}