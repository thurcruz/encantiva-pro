import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { fatias, nome } = body as {
      fatias: string[]
      nome: string
    }

    if (!fatias || fatias.length === 0) throw new Error('Nenhuma fatia recebida')

    const pdfDoc = await PDFDocument.create()

    const larguraPagina = 842  // A4 paisagem
    const alturaPagina = 595
    const sangria = 28  // 1cm

    for (let i = 0; i < fatias.length; i++) {
      const page = pdfDoc.addPage([larguraPagina, alturaPagina])

      const base64Data = fatias[i].replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      let image
      if (fatias[i].includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes)
      } else {
        image = await pdfDoc.embedJpg(imageBytes)
      }

      // Imagem dentro das margens, sem ultrapassar bordas
      page.drawImage(image, {
        x: sangria,
        y: sangria,
        width: larguraPagina - sangria * 2,
        height: alturaPagina - sangria * 2,
      })

      // Guias de corte nos 4 cantos
      const g = 20
      const cor = rgb(0.7, 0.7, 0.7)
      const t = 0.5

      page.drawLine({ start: { x: 0, y: alturaPagina - sangria }, end: { x: g, y: alturaPagina - sangria }, thickness: t, color: cor })
      page.drawLine({ start: { x: sangria, y: alturaPagina }, end: { x: sangria, y: alturaPagina - g }, thickness: t, color: cor })
      page.drawLine({ start: { x: larguraPagina - g, y: alturaPagina - sangria }, end: { x: larguraPagina, y: alturaPagina - sangria }, thickness: t, color: cor })
      page.drawLine({ start: { x: larguraPagina - sangria, y: alturaPagina }, end: { x: larguraPagina - sangria, y: alturaPagina - g }, thickness: t, color: cor })
      page.drawLine({ start: { x: 0, y: sangria }, end: { x: g, y: sangria }, thickness: t, color: cor })
      page.drawLine({ start: { x: sangria, y: 0 }, end: { x: sangria, y: g }, thickness: t, color: cor })
      page.drawLine({ start: { x: larguraPagina - g, y: sangria }, end: { x: larguraPagina, y: sangria }, thickness: t, color: cor })
      page.drawLine({ start: { x: larguraPagina - sangria, y: 0 }, end: { x: larguraPagina - sangria, y: g }, thickness: t, color: cor })

      page.drawText(`${i + 1}/${fatias.length} - ${nome}`, {
        x: larguraPagina / 2 - 40,
        y: 4,
        size: 7,
        color: rgb(0.6, 0.6, 0.6),
      })
    }

    // Página de montagem
    const paginaMontagem = pdfDoc.addPage([larguraPagina, alturaPagina])
    const linhaY = alturaPagina - 80

    paginaMontagem.drawText('GUIA DE MONTAGEM', {
      x: larguraPagina / 2 - 80,
      y: linhaY,
      size: 18,
      color: rgb(0.08, 0, 0.2),
    })

    const instrucoes = [
      'Grade: 2 colunas x 3 linhas (vertical)',
      '',
      '[ 1 ] [ 2 ]',
      '[ 3 ] [ 4 ]',
      '[ 5 ] [ 6 ]',
      '',
      '1. Imprima todas as 6 folhas em A4 vertical.',
      '2. Recorte na linha de corte (marcas nos cantos).',
      '3. Sobreponha 1cm nas bordas ao colar',
      '   para esconder as emendas.',
      '4. Cole na ordem indicada acima.',
      '5. O painel finalizado tera ~50x50cm.',
    ]

    instrucoes.forEach((linha, idx) => {
      if (!linha) return
      paginaMontagem.drawText(linha, {
        x: larguraPagina / 2 - 130,
        y: linhaY - 50 - idx * 26,
        size: linha.startsWith('[') ? 14 : 11,
        color: linha.startsWith('[') ? rgb(0.6, 0, 0.8) : rgb(0.2, 0.2, 0.2),
      })
    })

    const pdfBytes = await pdfDoc.save()
    const uint8Array = new Uint8Array(pdfBytes)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    const pdfBase64 = btoa(binary)

    return new Response(
      JSON.stringify({ pdf: pdfBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('ERRO:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})