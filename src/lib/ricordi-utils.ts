import type { Ricordo } from '@/types'

// ============================================================
// ROAMLY — ricordi-utils
// Logica pura per la selezione del Ricordo del Giorno (B45).
// Condivisa tra Home e Diario — nessun side-effect, nessuna chiamata
// a Supabase. Tutte le funzioni ricevono `oggi` come parametro
// per facilitare il testing.
//
// Logica B45 — Priorità:
//   1. "On This Day": ricordi con data == stesso giorno/mese di anni passati
//   2. highlight = true   (V1.1 — sempre false nel MVP)
//   3. preferito = true   (random deterministico tra tutti i preferiti)
//   4. fallback           (random deterministico tra tutti i ricordi)
//
// Random deterministico: hash djb2 della data odierna come seed.
// Stesso giorno → stesso ricordo. Giorno diverso → distribuzione uniforme.
// ============================================================

// ------------------------------------------------------------
// djb2Hash — funzione hash deterministica
// Algoritmo: Dan Bernstein hash (djb2)
// Distribuisce uniformemente: stringa diversa → indice diverso.
// Usato per evitare il bias di `seed % length` su seed sequenziali.
// ------------------------------------------------------------

export function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    // eslint-disable-next-line no-bitwise
    hash = hash & hash // Mantiene il valore entro 32 bit signed
  }
  return Math.abs(hash)
}

// ------------------------------------------------------------
// randomDeterministico
// Seleziona un elemento dall'array in modo deterministico per data.
// Stesso `oggi` → stesso elemento. Giorno successivo → elemento diverso.
// ------------------------------------------------------------

export function randomDeterministico<T>(items: T[], oggi: string): T {
  if (items.length === 0) throw new Error('Array vuoto')
  if (items.length === 1) return items[0]
  const hash = djb2Hash(oggi)
  return items[hash % items.length]
}

// ------------------------------------------------------------
// getLabelTempo
// Calcola la label "Un anno fa", "Due anni fa", etc.
// Restituisce null se il ricordo non è di un anno passato (data == oggi).
// ------------------------------------------------------------

export function getLabelTempo(dataRicordo: string, oggi: string): string | null {
  const [ry, rm, rd] = dataRicordo.split('-').map(Number)
  const [oy, om, od] = oggi.split('-').map(Number)

  // Stesso giorno e mese ma anno diverso → "X anni fa"
  if (rm === om && rd === od && ry < oy) {
    const anni = oy - ry
    if (anni === 1) return 'Un anno fa'
    if (anni === 2) return 'Due anni fa'
    if (anni === 3) return 'Tre anni fa'
    return `${anni} anni fa`
  }

  return null
}

// ------------------------------------------------------------
// getRicordoDelGiorno
// Implementazione logica B45.
// Input: lista ricordi (da useRicordiRecenti), data odierna
// Output: { ricordo, labelTempo } o null se lista vuota
// ------------------------------------------------------------

export function getRicordoDelGiorno(
  ricordi: Ricordo[],
  oggi: string   // 'YYYY-MM-DD' — iniettato per testabilità
): { ricordo: Ricordo; labelTempo: string | null } | null {
  if (ricordi.length === 0) return null

  const [, om, od] = oggi.split('-').map(Number)

  // ---- 1. "On This Day" ----
  // Ricordi con stesso giorno e mese di oggi, ma di anni passati.
  // Ordinati per anno DESC (più recente prima: 2025 prima di 2024).
  const onThisDay = ricordi
    .filter((r) => {
      const [ry, rm, rd] = r.data.split('-').map(Number)
      const [oy] = oggi.split('-').map(Number)
      return rm === om && rd === od && ry < oy
    })
    .sort((a, b) => b.data.localeCompare(a.data))

  if (onThisDay.length > 0) {
    const ricordo = onThisDay[0]
    return { ricordo, labelTempo: getLabelTempo(ricordo.data, oggi) }
  }

  // ---- 2. highlight = true (V1.1 — sempre false nel MVP) ----
  const conHighlight = ricordi.filter((r) => r.highlight)
  if (conHighlight.length > 0) {
    const ricordo = randomDeterministico(conHighlight, oggi)
    return { ricordo, labelTempo: null }
  }

  // ---- 3. preferito = true — random deterministico ----
  const conPreferito = ricordi.filter((r) => r.preferito)
  if (conPreferito.length > 0) {
    const ricordo = randomDeterministico(conPreferito, oggi)
    return { ricordo, labelTempo: null }
  }

  // ---- 4. Fallback — random deterministico su tutti ----
  const ricordo = randomDeterministico(ricordi, oggi)
  return { ricordo, labelTempo: null }
}

// ------------------------------------------------------------
// oggiLocale — restituisce la data odierna in 'YYYY-MM-DD' locale
// Usato come default per `oggi` nei hook consumer.
// Non usare `new Date().toISOString()` — produce data UTC.
// ------------------------------------------------------------

export function oggiLocale(): string {
  return new Date().toLocaleDateString('sv') // 'sv' = YYYY-MM-DD in locale
}
