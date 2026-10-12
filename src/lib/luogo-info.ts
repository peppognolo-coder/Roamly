import { cercaLuoghi, type RisultatoGeocoding } from '@/lib/geocoding'
import { distanzaKm } from '@/lib/luoghi-clustering'
import type { ModificaLuogoSalvato } from '@/types'

// ============================================================
// ROAMLY — luogo-info
// Recupera una volta sola la "scheda" di un luogo salvato:
//   • OpenStreetMap (Nominatim, extratags): sito, orari, telefono,
//     tipo di luogo e — quando c'è — il tag della pagina Wikipedia;
//   • Wikipedia (gratuita, senza chiavi): descrizione breve in
//     italiano e foto di copertina (da Wikimedia Commons).
// Nessun dato inventato: se un luogo non ha una pagina Wikipedia
// (tipico di ristoranti e negozi) restano solo le info di OSM, e
// la scheda mostra un segnaposto al posto della foto.
// Ogni passaggio è protetto: un errore di rete non rompe nulla,
// restituisce semplicemente meno informazioni.
// ============================================================

const TIMEOUT_MS = 7000

interface WikiSummary {
  title?: string
  type?: string
  extract?: string
  thumbnail?: { source: string }
  coordinates?: { lat: number; lon: number }
  content_urls?: { desktop?: { page?: string } }
}

function conTimeout(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS)
}

async function json<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: conTimeout() })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function normalizza(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function titoliSimili(a: string, b: string): boolean {
  const x = normalizza(a)
  const y = normalizza(b)
  return x.length > 2 && y.length > 2 && (x === y || x.includes(y) || y.includes(x))
}

// "en:Colosseum" → { lang:'en', titolo:'Colosseum' }
function leggiTagWikipedia(tag: string): { lang: string; titolo: string } | null {
  const i = tag.indexOf(':')
  if (i < 2) return null
  return { lang: tag.slice(0, i), titolo: tag.slice(i + 1) }
}

// Se la pagina è in un'altra lingua, prova a trovare la versione italiana
async function titoloItaliano(lang: string, titolo: string): Promise<string | null> {
  if (lang === 'it') return titolo
  const d = await json<{ query?: { pages?: Record<string, { langlinks?: { '*': string }[] }> } }>(
    `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titolo)}` +
      `&prop=langlinks&lllang=it&format=json&origin=*`
  )
  const pagina = d?.query?.pages ? Object.values(d.query.pages)[0] : null
  return pagina?.langlinks?.[0]?.['*'] ?? null
}

async function summary(lang: string, titolo: string): Promise<WikiSummary | null> {
  const d = await json<WikiSummary>(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titolo.replace(/ /g, '_'))}?redirect=true`
  )
  if (!d || d.type === 'disambiguation' || !d.extract) return null
  return d
}

// Pagine Wikipedia in italiano vicine alle coordinate, con titolo simile al nome
async function cercaVicino(nome: string, lat: number, lng: number): Promise<string | null> {
  const d = await json<{ query?: { geosearch?: { title: string }[] } }>(
    `https://it.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}` +
      `&gsradius=500&gslimit=10&format=json&origin=*`
  )
  const trovato = d?.query?.geosearch?.find((g) => titoliSimili(g.title, nome))
  return trovato?.title ?? null
}

// Foto più grande della miniatura standard (passi ammessi da Wikimedia)
function fotoGrande(src: string): string {
  return src.replace(/\/\d+px-/, '/960px-')
}

function accorcia(testo: string, max = 650): string {
  if (testo.length <= max) return testo
  const taglio = testo.slice(0, max)
  const punto = Math.max(taglio.lastIndexOf('. '), taglio.lastIndexOf('! '))
  return punto > 250 ? taglio.slice(0, punto + 1) : `${taglio.trim()}…`
}

export interface InputInfoLuogo {
  nome: string
  lat: number
  lng: number
  categoria?: string | null
  /** Risultato della ricerca da cui il luogo è stato salvato, se disponibile */
  risultato?: RisultatoGeocoding
}

/**
 * Restituisce le informazioni trovate per il luogo, pronte da salvare.
 * `info_aggiornate_at` è sempre valorizzato: anche se non si trova nulla,
 * la ricerca non viene ripetuta a ogni apertura della scheda.
 */
export async function recuperaInfoLuogo(input: InputInfoLuogo): Promise<ModificaLuogoSalvato> {
  const patch: ModificaLuogoSalvato = { info_aggiornate_at: new Date().toISOString() }

  try {
    // 1. Dati OpenStreetMap: dal risultato di ricerca, o cercando il nome vicino alle coordinate
    let base = input.risultato ?? null
    if (!base) {
      try {
        const trovati = await cercaLuoghi(input.nome, conTimeout(), { lat: input.lat, lng: input.lng })
        base = trovati.find((r) => distanzaKm(r, input) < 2) ?? null
      } catch { /* nessun dato OSM */ }
    }

    if (base?.sitoWeb) patch.sito_web = base.sitoWeb
    if (base?.orari) patch.orari = base.orari
    if (base?.telefono) patch.telefono = base.telefono
    if (base?.tipo && !input.categoria) patch.categoria = base.tipo

    // 2. Pagina Wikipedia: tag OSM → luoghi vicini → (città) titolo = nome
    let pagina: WikiSummary | null = null
    const tag = base?.wikipedia ? leggiTagWikipedia(base.wikipedia) : null

    if (tag) {
      const titoloIt = await titoloItaliano(tag.lang, tag.titolo)
      if (titoloIt) pagina = await summary('it', titoloIt)
      if (!pagina && tag.lang !== 'it') pagina = await summary(tag.lang, tag.titolo)
    }

    if (!pagina) {
      const titolo = await cercaVicino(input.nome, input.lat, input.lng)
      if (titolo) pagina = await summary('it', titolo)
    }

    if (!pagina && (!base?.tipo || ['Città', 'Località', 'Comune', 'Isola', 'Regione', 'Paese'].includes(base.tipo))) {
      // Città e località: la pagina ha il nome del luogo; si accetta solo se le
      // coordinate coincidono (entro 30 km), per non prendere un omonimo.
      const candidata = await summary('it', input.nome)
      const c = candidata?.coordinates
      if (candidata && c && distanzaKm({ lat: c.lat, lng: c.lon }, input) <= 30) pagina = candidata
    }

    if (pagina?.extract) {
      patch.descrizione = accorcia(pagina.extract)
      if (pagina.content_urls?.desktop?.page) patch.wikipedia_url = pagina.content_urls.desktop.page
      if (pagina.thumbnail?.source) {
        patch.foto_url = fotoGrande(pagina.thumbnail.source)
        patch.foto_credito = 'Wikimedia Commons'
      }
    }
  } catch {
    /* si salva comunque il marcatore "info_aggiornate_at" */
  }

  return patch
}
