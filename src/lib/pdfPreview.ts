
// ============================================================
// pdfPreview — converte la prima pagina di un PDF in un'immagine
// (data URL PNG), per mostrarla nella schermata di dettaglio del
// Wallet esattamente come un'immagine caricata: sempre a piena
// larghezza, zero tagli dovuti allo zoom del viewer nativo del
// browser (che su un PDF largo/orizzontale, come molte carte
// d'imbarco, "tagliava" il contenuto a destra finché non si
// scorreva — vedi DocumentoWalletDetailPage).
//
// Il worker di pdf.js viene caricato come asset Vite (?url) invece
// che da CDN: nessuna chiamata di rete fuori dall'allowlist, e
// funziona anche offline una volta installata la PWA.
// ============================================================

// pdf.js (~370 KB) si scarica solo quando serve davvero un'anteprima PDF,
// non quando si apre la pagina del documento.
let pdfjsPronta: Promise<typeof import('pdfjs-dist')> | null = null
function caricaPdfjs() {
  if (!pdfjsPronta) {
    pdfjsPronta = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default
      return lib
    })
    pdfjsPronta.catch(() => { pdfjsPronta = null })
  }
  return pdfjsPronta
}

export async function renderPdfFirstPageAsDataUrl(
  url: string,
  targetWidthPx: number
): Promise<string> {
  const pdfjsLib = await caricaPdfjs()
  const pdf = await pdfjsLib.getDocument(url).promise
  const page = await pdf.getPage(1)

  // Scala per adattarsi alla larghezza desiderata, con devicePixelRatio
  // (limitato a 2x) per restare nitida sugli schermi retina senza
  // generare canvas inutilmente enormi.
  const baseViewport = page.getViewport({ scale: 1 })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const scale = (targetWidthPx / baseViewport.width) * dpr
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D non supportato')

  await page.render({ canvasContext: context, viewport }).promise
  return canvas.toDataURL('image/png')
}
