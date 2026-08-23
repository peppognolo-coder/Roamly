import type { Ricordo } from '@/types'
import { formatDataGiorno } from '@/lib/diario-utils'

// ============================================================
// ROAMLY — viaggi-diario-utils
// Funzioni pure per la timeline narrativa in ViaggioDetailPage.
// Diversa da diario-utils (Diario globale):
//   - Ordinamento cronologico ASC (passato → presente)
//   - Statistiche giorno: ricordi + foto
//   - Nessun filtro (mostra tutto)
// ============================================================

export interface GiornoViaggio {
  data:           string         // 'YYYY-MM-DD'
  dataFormattata: string         // 'MARTEDÌ 14 GIUGNO 2025'
  ricordi:        Ricordo[]      // ordinati created_at ASC
  totaleRicordi:  number
  totaleFoto:     number         // da Map<ricordoId, count>
}

// ------------------------------------------------------------
// buildTimelineViaggio
// Raggruppa i ricordi per data in ordine cronologico ASC.
// Arricchisce ogni giorno con il conteggio foto dalla mappa.
// ------------------------------------------------------------

export function buildTimelineViaggio(
  ricordi: Ricordo[],
  fotoCount: Map<string, number>
): GiornoViaggio[] {
  if (ricordi.length === 0) return []

  const mappa = new Map<string, Ricordo[]>()

  for (const r of ricordi) {
    const existing = mappa.get(r.data)
    if (existing) {
      existing.push(r)
    } else {
      mappa.set(r.data, [r])
    }
  }

  // Ordine ASC — dal giorno più vecchio al più recente
  const dateOrdinate = Array.from(mappa.keys()).sort((a, b) => a.localeCompare(b))

  return dateOrdinate.map((data) => {
    const ricordiGiorno = mappa.get(data)!
    const totaleFoto = ricordiGiorno.reduce(
      (acc, r) => acc + (fotoCount.get(r.id) ?? 0),
      0
    )
    return {
      data,
      dataFormattata: formatDataGiorno(data),
      ricordi:        ricordiGiorno,
      totaleRicordi:  ricordiGiorno.length,
      totaleFoto,
    }
  })
}

// ------------------------------------------------------------
// formatDataGiornoBreve
// '26 Giugno 2026' — senza weekday, per l'header giorno
// ------------------------------------------------------------

export function formatDataGiornoBreve(dataISO: string): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  })
}
