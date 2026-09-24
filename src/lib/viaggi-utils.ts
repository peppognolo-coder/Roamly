import type { Viaggio, ViaggioConStato, StatoViaggio } from '@/types'

// ------------------------------------------------------------
// coloreCopertinaViaggio
// Colore decorativo per la fascia di copertina della card viaggio
// (lista "I tuoi viaggi", schermata "Mappa" ecc.) — nessun campo
// colore esiste in DB, quindi lo deriviamo in modo deterministico
// dall'id del viaggio: stesso viaggio → sempre lo stesso colore,
// senza dover salvare/inventare un dato che non c'è.
// ------------------------------------------------------------

const PALETTE_COPERTINA = ['#0C2A3D', '#0B6F99', '#D9A63C', '#7C6FC4', '#3C7A5E']
// Tono più scuro abbinato a ciascun colore sopra, stesso indice — usato
// per il gradiente del tema "Mood" nella share card del viaggio.
const PALETTE_COPERTINA_SCURA = ['#081D2A', '#074A66', '#B3822A', '#5B4F99', '#295942']

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash % PALETTE_COPERTINA.length
}

export function coloreCopertinaViaggio(id: string): string {
  return PALETTE_COPERTINA[hashId(id)]
}

// Coppia [chiaro, scuro] per lo stesso indice di coloreCopertinaViaggio —
// così il tema "Mood" della share card resta coerente con il colore
// della fascia di copertina ovunque il viaggio compaia.
export function gradienteCopertinaViaggio(id: string): [string, string] {
  const i = hashId(id)
  return [PALETTE_COPERTINA[i], PALETTE_COPERTINA_SCURA[i]]
}

// ------------------------------------------------------------
// isoDateLocale
// Converte un oggetto Date in stringa 'YYYY-MM-DD' usando i
// componenti data LOCALI (anno/mese/giorno), non UTC.
//
// Non usare `date.toISOString().slice(0, 10)`: toISOString()
// converte prima in UTC, quindi una mezzanotte locale in Italia
// (UTC+1/+2) diventa le 22:00-23:00 del giorno PRIMA in UTC —
// la stringa risultante è sistematicamente sfalsata di un giorno.
// Bug reale riscontrato in CalendarioPage e ItinerarioPage: le
// tappe/prenotazioni comparivano un giorno prima di quello giusto.
// Stesso principio di `oggiLocale()` in ricordi-utils.ts.
// ------------------------------------------------------------

export function isoDateLocale(d: Date): string {
  const anno = d.getFullYear()
  const mese = String(d.getMonth() + 1).padStart(2, '0')
  const giorno = String(d.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

// ------------------------------------------------------------
// getStatoEffettivo
// Calcola lo stato di un viaggio:
//   - se stato IS NOT NULL → override manuale, usa quello
//   - altrimenti → deriva dalle date vs oggi
// ------------------------------------------------------------

export function getStatoEffettivo(viaggio: Viaggio): StatoViaggio {
  if (viaggio.stato !== null && viaggio.stato !== undefined) {
    return viaggio.stato
  }

  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)

  const inizio = viaggio.data_inizio ? new Date(viaggio.data_inizio) : null
  const fine = viaggio.data_fine ? new Date(viaggio.data_fine) : null

  if (!inizio) return 'pianificato'

  if (inizio > oggi) return 'pianificato'

  if (fine && fine < oggi) return 'concluso'

  // inizio <= oggi AND (fine è null o fine >= oggi)
  return 'in_corso'
}

// ------------------------------------------------------------
// arricchisciViaggio
// Aggiunge stato_effettivo al viaggio
// ------------------------------------------------------------

export function arricchisciViaggio(viaggio: Viaggio): ViaggioConStato {
  return {
    ...viaggio,
    stato_effettivo: getStatoEffettivo(viaggio),
  }
}

export function arricchisciViagg(viaggi: Viaggio[]): ViaggioConStato[] {
  return viaggi.map(arricchisciViaggio)
}

// ------------------------------------------------------------
// getViaggioAttivo
// Regola ufficiale:
//   1. Filtra i viaggi con stato_effettivo = 'in_corso'
//   2. Se esiste uno solo → restituisce quello
//   3. Se ne esistono più di uno → restituisce il più recente (data_inizio più alta)
//   4. Se nessuno → restituisce il prossimo pianificato (data_inizio più vicina nel futuro)
//   5. Se nessuno nemmeno pianificato → restituisce null
// ------------------------------------------------------------

export function getViaggioAttivo(
  viaggi: ViaggioConStato[]
): ViaggioConStato | null {
  const inCorso = viaggi.filter((v) => v.stato_effettivo === 'in_corso')

  if (inCorso.length === 1) return inCorso[0]

  if (inCorso.length > 1) {
    return inCorso.sort((a, b) => {
      const da = a.data_inizio ?? ''
      const db = b.data_inizio ?? ''
      return db.localeCompare(da) // più recente prima
    })[0]
  }

  // Nessun viaggio in corso → cerca il prossimo pianificato
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)

  const pianificati = viaggi
    .filter((v) => v.stato_effettivo === 'pianificato' && v.data_inizio)
    .sort((a, b) => {
      const da = a.data_inizio ?? ''
      const db = b.data_inizio ?? ''
      return da.localeCompare(db) // più vicino prima
    })

  return pianificati[0] ?? null
}

// ------------------------------------------------------------
// formatDataViaggio
// Formatta un range di date in italiano
// Es: "12 giu – 20 giu 2025" | "Dal 12 giugno" | "2025"
// ------------------------------------------------------------

export function formatDataViaggio(
  dataInizio: string | null,
  dataFine: string | null
): string {
  if (!dataInizio && !dataFine) return 'Date non definite'

  const opzioniCorte: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const opzioniAnno: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

  if (dataInizio && dataFine) {
    const i = new Date(dataInizio)
    const f = new Date(dataFine)
    const iStr = i.toLocaleDateString('it-IT', opzioniCorte)
    const fStr = f.toLocaleDateString('it-IT', opzioniAnno)
    return `${iStr} – ${fStr}`
  }

  if (dataInizio) {
    const i = new Date(dataInizio)
    return `Dal ${i.toLocaleDateString('it-IT', opzioniAnno)}`
  }

  const f = new Date(dataFine!)
  return `Fino al ${f.toLocaleDateString('it-IT', opzioniAnno)}`
}

// ------------------------------------------------------------
// calcolaGiorniAlPartenza
// Restituisce i giorni mancanti alla data_inizio di un viaggio pianificato.
// Parsing locale esplicito: evita lo shift UTC di new Date('YYYY-MM-DD')
// che può produrre risultati errati tra mezzanotte e le 02:00 in UTC+2.
// Strategia uniforme all'uso già adottato in Ricordi e Diario.
// ------------------------------------------------------------

export function calcolaGiorniAlPartenza(dataInizio: string): number {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)

  // Parsing locale: new Date('YYYY-MM-DD') interpreta come UTC mezzanotte
  // causando uno shift di +2h in timezone italiana — si usa il costruttore
  // con componenti esplicite che produce mezzanotte locale.
  const [y, m, d] = dataInizio.split('-').map(Number)
  const partenza = new Date(y, m - 1, d)

  const diff = partenza.getTime() - oggi.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ------------------------------------------------------------
// calcolaDurataViaggio
// Numero di giorni tra data_inizio e data_fine (inclusi).
// Restituisce null se una delle date manca.
// Parsing locale — no UTC shift.
// ------------------------------------------------------------

export function calcolaDurataViaggio(
  dataInizio: string | null,
  dataFine: string | null
): number | null {
  if (!dataInizio || !dataFine) return null
  const [iy, im, id] = dataInizio.split('-').map(Number)
  const [fy, fm, fd] = dataFine.split('-').map(Number)
  const inizio = new Date(iy, im - 1, id)
  const fine   = new Date(fy, fm - 1, fd)
  const diff   = fine.getTime() - inizio.getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

// ------------------------------------------------------------
// calcolaPercentualeTrascorsa
// % di giorni trascorsi sul totale del viaggio (0-100). Prima
// della partenza → 0. Dopo la fine → 100. Parsing locale — stesso
// principio delle altre funzioni in questo file (no UTC shift).
// ------------------------------------------------------------

export function calcolaPercentualeTrascorsa(
  dataInizio: string | null,
  dataFine: string | null
): number | null {
  const durata = calcolaDurataViaggio(dataInizio, dataFine)
  if (!durata || !dataInizio) return null

  const [iy, im, id] = dataInizio.split('-').map(Number)
  const inizio = new Date(iy, im - 1, id)
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)

  const giorniTrascorsi = Math.floor((oggi.getTime() - inizio.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const clampato = Math.max(0, Math.min(giorniTrascorsi, durata))
  return Math.round((clampato / durata) * 100)
}
