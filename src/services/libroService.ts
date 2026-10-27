import { getViaggio } from '@/services/viaggiService'
import { getRicordiDelViaggio } from '@/services/ricordiService'
import { getFotoByRicordo, generaSignedUrl } from '@/services/fotoService'
import { getTappe } from '@/services/tappeService'
import { MOOD_OPTIONS } from '@/types'
import type { Foto, Ricordo } from '@/types'
import type { LibroDati } from '@/lib/libroPdf'

// ============================================================
// libroService — raccoglie viaggio, ricordi, tappe e foto e
// produce il PDF "libro del viaggio" (motore in lib/libroPdf).
// ============================================================

const FOTO_MAX_PER_RICORDO = 3
const LARGHEZZA_FOTO = 1000          // px, rapporto 3:2
const PARALLELE = 4

async function fotoPronta(f: Foto): Promise<Uint8Array | null> {
  try {
    const { url } = await generaSignedUrl(f.path, f.bucket)
    if (!url) return null
    const blob = await (await fetch(url)).blob()
    const bmp = await createImageBitmap(blob)
    const w = LARGHEZZA_FOTO, h = Math.round(w / 1.5)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // ritaglio "cover" 3:2 centrato
    const r = Math.max(w / bmp.width, h / bmp.height)
    const sw = w / r, sh = h / r
    ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h)
    bmp.close?.()
    const out = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.75))
    return out ? new Uint8Array(await out.arrayBuffer()) : null
  } catch {
    return null
  }
}

async function inParallelo<T, R>(voci: T[], fn: (v: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(voci.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.min(PARALLELE, voci.length) }, async () => {
    while (i < voci.length) { const k = i++; out[k] = await fn(voci[k]) }
  }))
  return out
}

// Frase di chiusura: preferito → highlight → testo più lungo.
export function sceltaCitazione(ricordi: Ricordo[]): string | null {
  const conTesto = ricordi.filter(r => (r.testo ?? '').trim().length > 20)
  const scelto =
    conTesto.find(r => r.preferito) ??
    conTesto.find(r => r.highlight) ??
    [...conTesto].sort((a, b) => (b.testo!.length - a.testo!.length))[0]
  if (!scelto) return null
  const t = scelto.testo!.trim().replace(/\s+/g, ' ')
  const frase = t.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t
  return frase.length > 140 ? frase.slice(0, 137).replace(/\s+\S*$/, '') + '…' : frase
}

export async function costruisciDatiLibro(
  viaggioId: string,
  onProgress?: (p: number) => void
): Promise<LibroDati> {
  const [v, r, t] = await Promise.all([getViaggio(viaggioId), getRicordiDelViaggio(viaggioId), getTappe(viaggioId)])
  if (!v.data) throw new Error('Viaggio non trovato')
  if (r.error) throw new Error(r.error)

  const ricordi = [...r.data].sort((a, b) => a.data.localeCompare(b.data) || a.created_at.localeCompare(b.created_at))
  onProgress?.(8)

  const foto = await inParallelo(ricordi, async rc => (await getFotoByRicordo(rc.id)).data)
  const tutte = foto.map(l => l.slice(0, FOTO_MAX_PER_RICORDO))
  const piatte = tutte.flat()
  let fatte = 0
  const bytes = new Map<string, Uint8Array | null>()
  await inParallelo(piatte, async f => {
    bytes.set(f.id, await fotoPronta(f))
    onProgress?.(8 + Math.round((++fatte / Math.max(1, piatte.length)) * 42))
  })

  const cover = foto.flat().find(f => f.is_cover) ?? foto.flat()[0]
  let copertina = cover ? bytes.get(cover.id) ?? null : null
  if (cover && !copertina) copertina = await fotoPronta(cover)

  return {
    nome: v.data.nome,
    luogo: v.data.paese ?? v.data.destinazione,
    dataInizio: v.data.data_inizio,
    dataFine: v.data.data_fine,
    copertina,
    ricordi: ricordi.map((rc, i) => ({
      data: rc.data,
      titolo: rc.titolo,
      testo: rc.testo,
      luogo: rc.luogo,
      mood: MOOD_OPTIONS.find(m => m.value === rc.mood)?.label ?? null,
      foto: tutte[i].map(f => bytes.get(f.id)).filter((b): b is Uint8Array => !!b),
    })),
    tappe: t.data.map(x => ({ nome: x.nome, lat: x.lat, lng: x.lng })),
    citazione: sceltaCitazione(ricordi),
  }
}

export function nomeFileLibro(nome: string): string {
  const base = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `roamly-${base || 'viaggio'}.pdf`
}

// Genera il PDF e lo consegna: foglio di condivisione se disponibile, altrimenti download.
export async function scaricaLibroViaggio(
  viaggioId: string,
  onProgress?: (p: number) => void
): Promise<void> {
  const dati = await costruisciDatiLibro(viaggioId, p => onProgress?.(Math.min(p, 50)))
  const { generaLibroPdf } = await import('@/lib/libroPdf')
  const pdf = await generaLibroPdf(dati, p => onProgress?.(50 + Math.round(p / 2)))
  const nome = nomeFileLibro(dati.nome)
  const file = new File([pdf.slice().buffer as ArrayBuffer], nome, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: dati.nome }); return }
    catch (e) { if ((e as Error).name === 'AbortError') return }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url; a.download = nome
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
