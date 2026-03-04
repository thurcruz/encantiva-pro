import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    console.log('Iniciando geração de PDF...')
    
    const body = await req.json()
    console.log('Body recebido - tipo:', body.tipo, '- fatias:', body.fatias?.length, '- nome:', body.nome)

    const { fatias, tipo, nome } = body as {
      fatias: string[]
      tipo: '6' | '9'
      nome: string
    }

    if (!fatias || fatias.length === 0) {
      throw new Error('Nenhuma fatia recebida')
    }

    console.log('Criando documento PDF...')
    const pdfDoc = await PDFDocument.create()

    const paisagem = tipo === '6'
    const larguraPagina = paisagem ? 842 : 595
    const alturaPagina = paisagem ? 595 : 842
    const sangria = 14

    for (let i = 0; i < fatias.length; i++) {
      console.log(`Processando fatia ${i + 1}/${fatias.length}...`)
      const page = pdfDoc.addPage([larguraPagina, alturaPagina])

      const base64Data = fatias[i].replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      let image
      if (fatias[i].includes('image/png')) {
        image = await pdfDoc.embedPng(imageBytes)
      } else {
        image = await pdfDoc.embedJpg(imageBytes)
      }

      page.drawImage(image, {
        x: sangria,
        y: sangria,
        width: larguraPagina - sangria * 2,
        height: alturaPagina - sangria * 2,
      })

      const guiasTamanho = 20
      const corGuia = rgb(0.7, 0.7, 0.7)
      const espessura = 0.5

      page.drawLine({ start: { x: 0, y: alturaPagina - sangria }, end: { x: guiasTamanho, y: alturaPagina - sangria }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: sangria, y: alturaPagina }, end: { x: sangria, y: alturaPagina - guiasTamanho }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: larguraPagina - guiasTamanho, y: alturaPagina - sangria }, end: { x: larguraPagina, y: alturaPagina - sangria }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: larguraPagina - sangria, y: alturaPagina }, end: { x: larguraPagina - sangria, y: alturaPagina - guiasTamanho }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: 0, y: sangria }, end: { x: guiasTamanho, y: sangria }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: sangria, y: 0 }, end: { x: sangria, y: guiasTamanho }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: larguraPagina - guiasTamanho, y: sangria }, end: { x: larguraPagina, y: sangria }, thickness: espessura, color: corGuia })
      page.drawLine({ start: { x: larguraPagina - sangria, y: 0 }, end: { x: larguraPagina - sangria, y: guiasTamanho }, thickness: espessura, color: corGuia })

      page.drawText(`${i + 1}/${fatias.length} - ${nome}`, {
        x: larguraPagina / 2 - 40,
        y: 6,
        size: 7,
        color: rgb(0.6, 0.6, 0.6),
      })
    }

    console.log('Adicionando pagina de montagem...')
    const paginaMontagem = pdfDoc.addPage([larguraPagina, alturaPagina])
    const linhaY = alturaPagina - 60

    paginaMontagem.drawText('GUIA DE MONTAGEM', {
      x: larguraPagina / 2 - 70,
      y: linhaY,
      size: 16,
      color: rgb(0.08, 0, 0.2),
    })

    const instrucoes = tipo === '6'
      ? [
          'Grade: 3 colunas x 2 linhas (paisagem)',
          '',
          '[ 1 ] [ 2 ] [ 3 ]',
          '[ 4 ] [ 5 ] [ 6 ]',
          '',
          '1. Imprima todas as folhas em A4 paisagem.',
          '2. Recorte nas marcas de sangria cinzas.',
          '3. Cole na ordem indicada acima.',
          '4. O painel finalizado tera ~50x50cm.',
        ]
      : [
          'Grade: 3 colunas x 3 linhas (vertical)',
          '',
          '[ 1 ] [ 2 ] [ 3 ]',
          '[ 4 ] [ 5 ] [ 6 ]',
          '[ 7 ] [ 8 ] [ 9 ]',
          '',
          '1. Imprima todas as folhas em A4 vertical.',
          '2. Recorte nas marcas de sangria cinzas.',
          '3. Cole na ordem indicada acima.',
          '4. O painel finalizado tera ~50x50cm.',
        ]

    instrucoes.forEach((linha, idx) => {
      if (!linha) return
      paginaMontagem.drawText(linha, {
        x: larguraPagina / 2 - 120,
        y: linhaY - 40 - idx * 22,
        size: linha.startsWith('[') ? 13 : 11,
        color: linha.startsWith('[') ? rgb(0.6, 0, 0.8) : rgb(0.2, 0.2, 0.2),
      })
    })

    console.log('Salvando PDF...')
    const pdfBytes = await pdfDoc.save()
    
    const uint8Array = new Uint8Array(pdfBytes)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    const pdfBase64 = btoa(binary)
    console.log('PDF gerado! Tamanho base64:', pdfBase64.length)

    return new Response(
      JSON.stringify({ pdf: pdfBase64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('ERRO NA EDGE FUNCTION:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})