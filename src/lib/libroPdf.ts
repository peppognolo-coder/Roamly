// ============================================================
// libroPdf — motore che disegna il "libro del viaggio" in PDF.
// Nessuna dipendenza dal resto dell'app: riceve dati già pronti
// (LibroDati) e restituisce i byte del PDF. pdf-lib e i font
// vengono caricati solo quando serve (import dinamico).
// ============================================================

export interface LibroRicordo {
  data: string                 // 'YYYY-MM-DD'
  titolo: string
  testo: string | null
  luogo: string | null
  mood: string | null          // etichetta, es. "Felice"
  foto: Uint8Array[]           // JPEG già ritagliati 3:2 (max 3)
}

export interface LibroTappa {
  nome: string
  lat: number | null
  lng: number | null
}

export interface LibroDati {
  nome: string
  luogo: string | null         // "Grecia" ecc.
  dataInizio: string | null
  dataFine: string | null
  copertina: Uint8Array | null // JPEG 3:2
  ricordi: LibroRicordo[]      // ordinati per data
  tappe: LibroTappa[]
  citazione: string | null
}

const A4 = { w: 595.28, h: 841.89 }
const M = 52                                   // margine laterale
const COL = {
  notte: [0.047, 0.165, 0.239] as const,       // #0C2A3D
  corallo: [1, 0.42, 0.29] as const,           // #FF6B4A
  azzurro: [0.373, 0.722, 0.851] as const,     // #5FB8D9
  testo: [0.12, 0.16, 0.2] as const,
  grigio: [0.45, 0.5, 0.55] as const,
  linea: [0.86, 0.88, 0.9] as const,
  carta: [0.985, 0.98, 0.965] as const,
  bianco: [1, 1, 1] as const,
}

const fmtData = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', opts)

function giorniTra(a: string, b: string): number {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)
}

async function caricaFont(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url)
  if (!r.ok) throw new Error('Font non disponibile')
  return r.arrayBuffer()
}

export async function generaLibroPdf(
  dati: LibroDati,
  onProgress?: (percentuale: number) => void
): Promise<Uint8Array> {
  const [{ PDFDocument, rgb, StandardFonts }, fontkitMod, lora, loraIt, sans, sansMed] = await Promise.all([
    import('pdf-lib'),
    import('@pdf-lib/fontkit'),
    import('@fontsource/lora/files/lora-latin-600-normal.woff?url'),
    import('@fontsource/lora/files/lora-latin-400-italic.woff?url'),
    import('@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff?url'),
    import('@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff?url'),
  ])
  const fontkit = (fontkitMod as { default?: unknown }).default ?? fontkitMod

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit as never)
  doc.setTitle(dati.nome)
  doc.setCreator('Roamly')
  doc.setProducer('Roamly')

  const [bLora, bLoraIt, bSans, bSansMed] = await Promise.all([
    caricaFont(lora.default), caricaFont(loraIt.default),
    caricaFont(sans.default), caricaFont(sansMed.default),
  ])
  const fTitolo  = await doc.embedFont(bLora,   { subset: true })
  const fCorsivo = await doc.embedFont(bLoraIt, { subset: true })
  const fTesto   = await doc.embedFont(bSans,   { subset: true })
  const fGrasso  = await doc.embedFont(bSansMed, { subset: true })
  void StandardFonts

  onProgress?.(55)

  // Caratteri assenti dal font (emoji, simboli rari) → rimossi
  const set = new Map<unknown, Set<number>>()
  const ok = (f: typeof fTesto, ch: string) => {
    let s = set.get(f)
    if (!s) { s = new Set(f.getCharacterSet()); set.set(f, s) }
    return s.has(ch.codePointAt(0)!)
  }
  const pulisci = (f: typeof fTesto, t: string) => {
    let out = ''
    for (const ch of t.normalize('NFC')) {
      if (ch === '\n') { out += ch; continue }
      if (ch === '’' || ch === '‘') out += "'"
      else if (ok(f, ch)) out += ch
      else if (/\s/.test(ch)) out += ' '
    }
    return out
  }

  const c = (k: readonly [number, number, number]) => rgb(k[0], k[1], k[2])

  // ---- testo: a capo e misure --------------------------------
  function righe(f: typeof fTesto, t: string, size: number, larg: number): string[] {
    const out: string[] = []
    for (const par of pulisci(f, t).split('\n')) {
      if (!par.trim()) { out.push(''); continue }
      let riga = ''
      for (const parola of par.split(/\s+/).filter(Boolean)) {
        const prova = riga ? riga + ' ' + parola : parola
        if (f.widthOfTextAtSize(prova, size) <= larg) { riga = prova; continue }
        if (riga) out.push(riga)
        // parola più lunga della riga: spezza
        let resto = parola
        while (f.widthOfTextAtSize(resto, size) > larg) {
          let n = resto.length
          while (n > 1 && f.widthOfTextAtSize(resto.slice(0, n), size) > larg) n--
          out.push(resto.slice(0, n)); resto = resto.slice(n)
        }
        riga = resto
      }
      if (riga) out.push(riga)
    }
    return out
  }

  const nomeBreve = pulisci(fTesto, dati.nome)
  let pagina = doc.addPage([A4.w, A4.h])
  let numero = 0
  let y = 0

  function nuovaPagina(sfondo?: readonly [number, number, number]) {
    pagina = doc.addPage([A4.w, A4.h])
    numero++
    if (sfondo) pagina.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: c(sfondo) })
    return pagina
  }
  function piede() {
    pagina.drawLine({ start: { x: M, y: 44 }, end: { x: A4.w - M, y: 44 }, thickness: 0.5, color: c(COL.linea) })
    pagina.drawText(nomeBreve.toUpperCase().slice(0, 48), { x: M, y: 28, size: 7.5, font: fGrasso, color: c(COL.grigio) })
    const n = String(numero + 1)
    pagina.drawText(n, { x: A4.w - M - fGrasso.widthOfTextAtSize(n, 8), y: 28, size: 8, font: fGrasso, color: c(COL.grigio) })
  }
  const testoCentrato = (t: string, f: typeof fTesto, size: number, yy: number, col: readonly [number, number, number]) =>
    pagina.drawText(t, { x: (A4.w - f.widthOfTextAtSize(t, size)) / 2, y: yy, size, font: f, color: c(col) })

  // ---- statistiche ------------------------------------------
  const ricordi = dati.ricordi
  const nFoto = ricordi.reduce((s, r) => s + r.foto.length, 0)
  const luoghi = new Set(ricordi.map(r => (r.luogo ?? '').trim().toLowerCase()).filter(Boolean)).size
  const inizio = dati.dataInizio ?? ricordi[0]?.data ?? null
  const fine = dati.dataFine ?? ricordi[ricordi.length - 1]?.data ?? null
  const nGiorni = inizio && fine ? Math.max(1, giorniTra(inizio, fine) + 1) : new Set(ricordi.map(r => r.data)).size
  const periodo = inizio && fine
    ? (inizio === fine
        ? fmtData(inizio, { day: 'numeric', month: 'long', year: 'numeric' })
        : `${fmtData(inizio, { day: 'numeric', month: 'long' })} – ${fmtData(fine, { day: 'numeric', month: 'long', year: 'numeric' })}`)
    : ''

  // ============ COPERTINA ====================================
  pagina.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: c(COL.notte) })
  // marchio: puntino corallo + anello
  pagina.drawCircle({ x: M + 6, y: A4.h - 62, size: 6, color: c(COL.corallo) })
  pagina.drawCircle({ x: M + 6, y: A4.h - 62, size: 11, borderColor: c(COL.azzurro), borderWidth: 1, opacity: 0, borderOpacity: 0.7 })
  pagina.drawText('ROAMLY', { x: M + 26, y: A4.h - 66, size: 10, font: fGrasso, color: c(COL.bianco) })

  let yc = A4.h - 130
  if (dati.copertina) {
    const img = await doc.embedJpg(dati.copertina)
    const w = A4.w - M * 2, h = w / 1.5
    pagina.drawImage(img, { x: M, y: yc - h, width: w, height: h })
    yc -= h + 46
  } else {
    yc -= 60
  }
  const titoloRighe = righe(fTitolo, dati.nome, 34, A4.w - M * 2)
  for (const r of titoloRighe.slice(0, 4)) {
    pagina.drawText(r, { x: M, y: yc, size: 34, font: fTitolo, color: c(COL.bianco) }); yc -= 42
  }
  if (dati.luogo) {
    pagina.drawText(pulisci(fTesto, dati.luogo).toUpperCase(), { x: M, y: yc - 4, size: 10, font: fGrasso, color: c(COL.azzurro) }); yc -= 22
  }
  if (periodo) pagina.drawText(periodo, { x: M, y: yc - 4, size: 11, font: fTesto, color: c(COL.bianco), opacity: 0.8 })

  // tre numeri in fondo
  const stat = [[nGiorni, 'GIORNI'], [ricordi.length, 'RICORDI'], [nFoto, 'FOTO']] as const
  const colW = (A4.w - M * 2) / 3
  stat.forEach(([n, l], i) => {
    const x = M + colW * i
    pagina.drawText(String(n), { x, y: 96, size: 26, font: fTitolo, color: c(COL.corallo) })
    pagina.drawText(l, { x, y: 78, size: 7.5, font: fGrasso, color: c(COL.azzurro) })
  })
  onProgress?.(62)

  // ============ RIEPILOGO + MAPPA ============================
  nuovaPagina(COL.carta)
  y = A4.h - 70
  pagina.drawText('IL VIAGGIO IN BREVE', { x: M, y, size: 8.5, font: fGrasso, color: c(COL.corallo) }); y -= 30
  for (const r of righe(fTitolo, dati.nome, 22, A4.w - M * 2).slice(0, 2)) {
    pagina.drawText(r, { x: M, y, size: 22, font: fTitolo, color: c(COL.notte) }); y -= 28
  }
  y -= 6
  const stat4 = [[nGiorni, 'giorni'], [ricordi.length, 'ricordi'], [nFoto, 'foto'], [luoghi, 'luoghi']] as const
  const w4 = (A4.w - M * 2) / 4
  stat4.forEach(([n, l], i) => {
    const x = M + w4 * i
    pagina.drawText(String(n), { x, y, size: 20, font: fTitolo, color: c(COL.notte) })
    pagina.drawText(l.toUpperCase(), { x, y: y - 14, size: 7.5, font: fGrasso, color: c(COL.grigio) })
  })
  y -= 44

  // punti per la mappa: tappe con coordinate, altrimenti luoghi dei ricordi
  type P = { nome: string; lat: number; lng: number }
  let punti: P[] = dati.tappe.filter(t => t.lat != null && t.lng != null).map(t => ({ nome: t.nome, lat: t.lat!, lng: t.lng! }))
  if (punti.length < 2) {
    punti = []
  }
  const haPosizione = punti.length > 0

  if (haPosizione) {
    const bw = A4.w - M * 2, bh = 230
    const top = y
    pagina.drawRectangle({ x: M, y: top - bh, width: bw, height: bh, color: c([0.93, 0.96, 0.975]), borderColor: c(COL.linea), borderWidth: 0.6 })
    // reticolo
    for (let i = 1; i < 8; i++) {
      pagina.drawLine({ start: { x: M + (bw / 8) * i, y: top - bh }, end: { x: M + (bw / 8) * i, y: top }, thickness: 0.3, color: c([0.85, 0.9, 0.93]) })
    }
    for (let i = 1; i < 5; i++) {
      pagina.drawLine({ start: { x: M, y: top - (bh / 5) * i }, end: { x: M + bw, y: top - (bh / 5) * i }, thickness: 0.3, color: c([0.85, 0.9, 0.93]) })
    }
    const lats = punti.map(p => p.lat), lngs = punti.map(p => p.lng)
    const latMin = Math.min(...lats), latMax = Math.max(...lats)
    const lngMin = Math.min(...lngs), lngMax = Math.max(...lngs)
    const k = Math.cos(((latMin + latMax) / 2) * Math.PI / 180)
    const spanX = Math.max((lngMax - lngMin) * k, 0.01), spanY = Math.max(latMax - latMin, 0.01)
    const pad = 34
    const scala = Math.min((bw - pad * 2) / spanX, (bh - pad * 2) / spanY)
    const ox = M + (bw - spanX * scala) / 2, oy = top - bh + (bh - spanY * scala) / 2
    const proj = (p: P) => ({ x: ox + (p.lng - lngMin) * k * scala, y: oy + (p.lat - latMin) * scala })
    const pr = punti.map(proj)
    for (let i = 0; i < pr.length - 1; i++) {
      pagina.drawLine({ start: pr[i], end: pr[i + 1], thickness: 1.2, color: c(COL.azzurro), dashArray: [1.5, 4], lineCap: 1 })
    }
    pr.forEach((p, i) => {
      pagina.drawCircle({ x: p.x, y: p.y, size: 9, color: c(COL.corallo), borderColor: c(COL.bianco), borderWidth: 1.5 })
      const n = String(i + 1)
      pagina.drawText(n, { x: p.x - fGrasso.widthOfTextAtSize(n, 8) / 2, y: p.y - 2.8, size: 8, font: fGrasso, color: c(COL.bianco) })
    })
    y = top - bh - 26
    pagina.drawText('TAPPE', { x: M, y, size: 8.5, font: fGrasso, color: c(COL.corallo) }); y -= 18
    const maxTappe = Math.min(punti.length, 14)
    for (let i = 0; i < maxTappe; i++) {
      const col2 = i >= 7
      const x = M + (col2 ? bw / 2 : 0)
      const yy = y - (i % 7) * 18
      pagina.drawCircle({ x: x + 6, y: yy + 3, size: 6.5, color: c(COL.corallo) })
      const n = String(i + 1)
      pagina.drawText(n, { x: x + 6 - fGrasso.widthOfTextAtSize(n, 7) / 2, y: yy + 0.6, size: 7, font: fGrasso, color: c(COL.bianco) })
      const nome = righe(fTesto, punti[i].nome, 10, bw / 2 - 30)[0] ?? ''
      pagina.drawText(nome, { x: x + 20, y: yy, size: 10, font: fTesto, color: c(COL.testo) })
    }
  } else {
    // niente coordinate: elenco dei luoghi dei ricordi
    const elenco = [...new Set(ricordi.map(r => (r.luogo ?? '').trim()).filter(Boolean))].slice(0, 16)
    if (elenco.length) {
      pagina.drawText('LUOGHI', { x: M, y, size: 8.5, font: fGrasso, color: c(COL.corallo) }); y -= 20
      for (const l of elenco) {
        pagina.drawCircle({ x: M + 4, y: y + 3, size: 2.5, color: c(COL.corallo) })
        pagina.drawText(righe(fTesto, l, 10.5, A4.w - M * 2 - 20)[0] ?? '', { x: M + 16, y, size: 10.5, font: fTesto, color: c(COL.testo) }); y -= 18
      }
    }
  }
  piede()
  onProgress?.(68)

  // ============ GIORNI =======================================
  const perGiorno = new Map<string, LibroRicordo[]>()
  for (const r of ricordi) {
    if (!perGiorno.has(r.data)) perGiorno.set(r.data, [])
    perGiorno.get(r.data)!.push(r)
  }
  const giorni = [...perGiorno.keys()].sort()
  const LARG = A4.w - M * 2
  const YMIN = 66
  let fatti = 0

  for (const g of giorni) {
    const n = inizio ? giorniTra(inizio, g) + 1 : giorni.indexOf(g) + 1
    const intestazione = (segue: boolean) => {
      nuovaPagina(COL.carta)
      y = A4.h - 70
      const etichetta = `GIORNO ${n > 0 ? n : giorni.indexOf(g) + 1}${segue ? ' · SEGUE' : ''}`
      pagina.drawText(etichetta, { x: M, y, size: 8.5, font: fGrasso, color: c(COL.corallo) }); y -= 24
      pagina.drawText(pulisci(fTitolo, fmtData(g, { weekday: 'long', day: 'numeric', month: 'long' })), { x: M, y, size: 19, font: fTitolo, color: c(COL.notte) })
      y -= 16
      pagina.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.6, color: c(COL.linea) })
      y -= 26
      piede()
    }
    intestazione(false)

    for (const r of perGiorno.get(g)!) {
      const titRighe = righe(fTitolo, r.titolo || 'Senza titolo', 15, LARG)
      const corpo = r.testo ? righe(fTesto, r.testo, 10.5, LARG) : []
      const hMeta = 16
      const hTit = titRighe.length * 19 + 6
      const nF = r.foto.length
      const fW = nF === 1 ? LARG * 0.72 : nF ? (LARG - (nF - 1) * 8) / nF : 0
      const fH = fW / 1.5
      const hFoto = nF ? fH + 14 : 0
      const lh = 15.5

      // il blocco "intestazione ricordo" deve stare almeno con 2 righe di testo
      const minBlocco = hMeta + hTit + Math.min(corpo.length, 2) * lh + 10
      if (y - minBlocco < YMIN) intestazione(true)

      const metaTesto = [r.mood, r.luogo].filter(Boolean).map(s => pulisci(fGrasso, s!)).join('  ·  ')
      if (metaTesto) pagina.drawText(metaTesto.toUpperCase(), { x: M, y, size: 7.5, font: fGrasso, color: c(COL.azzurro) })
      y -= hMeta
      for (const t of titRighe) { pagina.drawText(t, { x: M, y, size: 15, font: fTitolo, color: c(COL.notte) }); y -= 19 }
      y -= 6

      let i = 0
      while (i < corpo.length) {
        if (y - lh < YMIN) intestazione(true)
        const l = corpo[i]
        if (l) pagina.drawText(l, { x: M, y, size: 10.5, font: fTesto, color: c(COL.testo) })
        y -= l ? lh : lh * 0.6
        i++
      }
      if (nF) {
        y -= 6
        if (y - hFoto < YMIN) intestazione(true)
        for (let k = 0; k < nF; k++) {
          const img = await doc.embedJpg(r.foto[k])
          pagina.drawImage(img, { x: M + k * (fW + 8), y: y - fH, width: fW, height: fH })
        }
        y -= hFoto
      }
      y -= 22
    }
    fatti++
    onProgress?.(68 + Math.round((fatti / giorni.length) * 27))
  }

  // ============ CHIUSURA =====================================
  nuovaPagina(COL.notte)
  const cy = A4.h / 2 + 40
  if (dati.citazione) {
    const q = righe(fCorsivo, '“' + dati.citazione + '”', 19, A4.w - M * 2 - 40).slice(0, 7)
    let yy = cy + (q.length * 27) / 2
    for (const r of q) { testoCentrato(r, fCorsivo, 19, yy, COL.bianco); yy -= 27 }
    pagina.drawLine({ start: { x: A4.w / 2 - 14, y: yy - 8 }, end: { x: A4.w / 2 + 14, y: yy - 8 }, thickness: 1.5, color: c(COL.corallo) })
  } else {
    testoCentrato(pulisci(fTitolo, dati.nome), fTitolo, 24, cy, COL.bianco)
  }
  testoCentrato('Creato con Roamly  ·  roamly.app', fGrasso, 8.5, 60, COL.azzurro)

  onProgress?.(97)
  const bytes = await doc.save()
  onProgress?.(100)
  return bytes
}
