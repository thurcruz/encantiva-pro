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
    const { fatias, nome, orientacao } = body as {
      fatias: string[]
      nome: string
      orientacao?: 'retrato' | 'paisagem'
    }

    if (!fatias || fatias.length === 0) throw new Error('Nenhuma fatia recebida')

    const pdfDoc = await PDFDocument.create()

    // Paisagem (2 cols × 3 linhas) = folha A4 deitada (842 × 595)
    // Retrato  (3 cols × 2 linhas) = folha A4 em pé  (595 × 842)
    const isPaisagem = orientacao === 'paisagem'
    const larguraPagina = isPaisagem ? 842 : 595
    const alturaPagina  = isPaisagem ? 595 : 842
    const sangria = 28

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

    // ─── PÁGINA DE MONTAGEM ───────────────────────────────────────────────────
    const paginaMontagem = pdfDoc.addPage([larguraPagina, alturaPagina])
    const centroX = larguraPagina / 2
    const topo = alturaPagina - 50

    paginaMontagem.drawText('GUIA DE MONTAGEM', {
      x: centroX - 85,
      y: topo,
      size: 18,
      color: rgb(0.08, 0, 0.2),
    })

    if (isPaisagem) {
      // ── Paisagem: 2 colunas × 3 linhas, folha deitada ──
      paginaMontagem.drawText('Grade: 2 colunas x 3 linhas  |  Folha deitada (paisagem)', {
        x: centroX - 155,
        y: topo - 28,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
      })

      const celulaW = 90
      const celulaH = 58
      const gap = 6
      const grade = [['1','2'], ['3','4'], ['5','6']]
      const gradeW = 2 * celulaW + gap
      const gradeH = 3 * celulaH + 2 * gap
      const startX = centroX - gradeW / 2
      const startY = topo - 60

      grade.forEach((linha, row) => {
        linha.forEach((num, col) => {
          const x = startX + col * (celulaW + gap)
          const y = startY - row * (celulaH + gap) - celulaH
          paginaMontagem.drawRectangle({ x, y, width: celulaW, height: celulaH, color: rgb(0.96, 0.90, 1.0), borderColor: rgb(0.6, 0, 0.8), borderWidth: 1 })
          paginaMontagem.drawText(num, { x: x + celulaW / 2 - 5, y: y + celulaH / 2 - 7, size: 14, color: rgb(0.6, 0, 0.8) })
        })
      })

      const instrucoes = [
        '1. Imprima as 6 folhas em A4 paisagem (deitado).',
        '2. Recorte nas marcas de corte dos cantos.',
        '3. Cole: coluna 1 (folhas 1-3-5) e coluna 2 (folhas 2-4-6).',
        '4. Sobreponha ~1cm nas bordas para esconder as emendas.',
        '5. Painel finalizado: ~50 x 50cm.',
      ]
      instrucoes.forEach((linha, idx) => {
        paginaMontagem.drawText(linha, { x: centroX - 185, y: startY - gradeH - 40 - idx * 22, size: 10, color: rgb(0.2, 0.2, 0.2) })
      })

    } else {
      // ── Retrato: 3 colunas × 2 linhas, folha em pé ──
      paginaMontagem.drawText('Grade: 3 colunas x 2 linhas  |  Folha em pe (retrato)', {
        x: centroX - 155,
        y: topo - 28,
        size: 10,
        color: rgb(0.4, 0.4, 0.4),
      })

      const celulaW = 58
      const celulaH = 90
      const gap = 6
      const grade = [['1','2','3'], ['4','5','6']]
      const gradeW = 3 * celulaW + 2 * gap
      const gradeH = 2 * celulaH + gap
      const startX = centroX - gradeW / 2
      const startY = topo - 60

      grade.forEach((linha, row) => {
        linha.forEach((num, col) => {
          const x = startX + col * (celulaW + gap)
          const y = startY - row * (celulaH + gap) - celulaH
          paginaMontagem.drawRectangle({ x, y, width: celulaW, height: celulaH, color: rgb(0.96, 0.90, 1.0), borderColor: rgb(0.6, 0, 0.8), borderWidth: 1 })
          paginaMontagem.drawText(num, { x: x + celulaW / 2 - 5, y: y + celulaH / 2 - 7, size: 14, color: rgb(0.6, 0, 0.8) })
        })
      })

      const instrucoes = [
        '1. Imprima as 6 folhas em A4 retrato (em pe).',
        '2. Recorte nas marcas de corte dos cantos.',
        '3. Cole: linha 1 (folhas 1-2-3) e linha 2 (folhas 4-5-6).',
        '4. Sobreponha ~1cm nas bordas para esconder as emendas.',
        '5. Painel finalizado: ~50 x 50cm.',
      ]
      instrucoes.forEach((linha, idx) => {
        paginaMontagem.drawText(linha, { x: centroX - 170, y: startY - gradeH - 40 - idx * 22, size: 10, color: rgb(0.2, 0.2, 0.2) })
      })
    }

    // ─── EXPORTAR ─────────────────────────────────────────────────────────────
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