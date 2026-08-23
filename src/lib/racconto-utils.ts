import type { Ricordo, ViaggioConStato } from '@/types'
import { formatDataGiorno }              from '@/lib/diario-utils'
import { calcolaDurataViaggio }          from '@/lib/viaggi-utils'

// ============================================================
// ROAMLY — racconto-utils
// Funzioni pure di trasformazione per la tab "Racconto".
// Input:  dati grezzi dal DB (già in cache React Query)
// Output: struttura narrativa pronta per il render
//
// Nessuna chiamata Supabase. Nessun side-effect.
// ============================================================

// ------------------------------------------------------------
// Tipi narrativi
// ------------------------------------------------------------

export interface RicordoRacconto {
  ricordo:    Ricordo
  coverUrl:   string | undefined  // thumbnailSignedUrl cover
  fotoCount:  number              // totale foto del ricordo
  isSpeciale: boolean             // preferito || highlight
}

export interface CapitoloRacconto {
  data:              string           // 'YYYY-MM-DD'
  dataFormattata:    string           // '27 Giugno 2026'
  numeroCapitolo:    number           // 1-indexed ASC
  ricordi:           RicordoRacconto[]
  haFoto:            boolean
  haMomentiSpeciali: boolean
}

export interface DatiRacconto {
  capitoli:      CapitoloRacconto[]
  totaleRicordi: number
  totaleFoto:    number
  durataGiorni:  number | null
  haContenuto:   boolean
}

// ------------------------------------------------------------
// raggruppaPerData — ordine cronologico ASC
// Inlined da viaggi-diario-utils (file eliminato Sprint 8.5A)
// ------------------------------------------------------------

function raggruppaPerData(ricordi: Ricordo[]): Map<string, Ricordo[]> {
  const mappa = new Map<string, Ricordo[]>()
  for (const r of ricordi) {
    const existing = mappa.get(r.data)
    if (existing) existing.push(r)
    else mappa.set(r.data, [r])
  }
  return mappa
}

// ------------------------------------------------------------
// formatDataCapitolo — '27 Giugno 2026'
// ------------------------------------------------------------

export function formatDataCapitolo(dataISO: string): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ------------------------------------------------------------
// buildRacconto — struttura narrativa completa
// ------------------------------------------------------------

export function buildRacconto(
  viaggio:   ViaggioConStato,
  ricordi:   Ricordo[],
  coversMap: Map<string, string> | undefined,
  fotoCount: Map<string, number> | undefined,
): DatiRacconto {
  if (ricordi.length === 0) {
    return {
      capitoli: [], totaleRicordi: 0, totaleFoto: 0,
      durataGiorni: calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine),
      haContenuto: false,
    }
  }

  const covers = coversMap ?? new Map<string, string>()
  const counts = fotoCount ?? new Map<string, number>()

  const mappa     = raggruppaPerData(ricordi)
  const dateASC   = Array.from(mappa.keys()).sort((a, b) => a.localeCompare(b))

  const capitoli: CapitoloRacconto[] = dateASC.map((data, idx) => {
    const rArr: RicordoRacconto[] = (mappa.get(data) ?? []).map((r) => ({
      ricordo:    r,
      coverUrl:   covers.get(r.id),
      fotoCount:  counts.get(r.id) ?? 0,
      isSpeciale: r.preferito || r.highlight,
    }))
    return {
      data,
      dataFormattata:    formatDataCapitolo(data),
      // Fallback a formatDataGiorno per compatibilità
      // formatDataGiorno ritorna 'MARTEDÌ 14 GIUGNO' — usiamo formatDataCapitolo
      // che produce '14 Giugno 2026' più adatto alla lettura
      numeroCapitolo:    idx + 1,
      ricordi:           rArr,
      haFoto:            rArr.some((r) => !!r.coverUrl),
      haMomentiSpeciali: rArr.some((r) => r.isSpeciale),
    }
  })

  const totaleFoto = Array.from(counts.values()).reduce((a, b) => a + b, 0)

  return {
    capitoli,
    totaleRicordi:  ricordi.length,
    totaleFoto,
    durataGiorni:   calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine),
    haContenuto:    true,
  }
}

// Re-export per retrocompatibilità con qualsiasi import futuro
export { formatDataGiorno }
