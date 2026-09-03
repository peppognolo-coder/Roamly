import type { Ricordo, ViaggioConStato, Mood } from '@/types'
import type { MembroConProfilo } from '@/services/membriService'

// ============================================================
// ROAMLY — diario-utils
// Funzioni pure di trasformazione per la schermata Diario.
// Nessuna chiamata Supabase, nessun side-effect.
// Tutte le funzioni sono memoizzabili e testabili in isolamento.
//
// NOTA TECNICA — campo `highlight` (Opzione C approvata):
//   - `highlight` è presente nel modello dati e nella logica Hero
//   - NON viene esposto in UI nel MVP (nessun toggle, nessun form field)
//   - Sarà una feature utente in V1.1
//   - Nel MVP è sempre `false` per tutti i ricordi — il primo ramo
//     della logica Hero non viene mai eseguito, ma la struttura è pronta
// ============================================================

// ------------------------------------------------------------
// Tipi interni al Diario
// Vivono qui, non in types/index.ts — sono tipi di presentazione,
// non tipi di dominio.
// ------------------------------------------------------------

export interface FiltriDiario {
  mood: Mood[]
  soloPreferiti: boolean
  autori: string[]   // user_id — vuoto = tutti
}

export interface GiornoTimeline {
  data: string              // 'YYYY-MM-DD'
  dataFormattata: string    // 'MARTEDÌ 14 GIUGNO 2025'
  ricordi: Ricordo[]        // già ordinati data DESC created_at DESC (dal service)
}

export interface SezioneViaggio {
  viaggio: ViaggioConStato
  giorni: GiornoTimeline[]   // ordinati data DESC (giorno più recente prima)
  totaleRicordi: number      // conteggio pre-filtro
  totaleFiltrati: number     // conteggio post-filtro
  isEmpty: boolean           // true se nessun ricordo esiste per questo viaggio
  isEmptyConFiltri: boolean  // true se filtri hanno azzerato i risultati
}

// ------------------------------------------------------------
// applicaFiltri
// Filtra una lista di ricordi secondo i filtri attivi.
// Logica AND: un ricordo deve soddisfare TUTTI i filtri attivi.
// ------------------------------------------------------------

export function applicaFiltri(
  ricordi: Ricordo[],
  filtri: FiltriDiario
): Ricordo[] {
  return ricordi.filter((r) => {
    // Filtro mood: passa se nessun mood selezionato, o se il mood del ricordo è tra quelli
    const passaMood = filtri.mood.length === 0 || filtri.mood.includes(r.mood)
    // Filtro preferiti: passa se il toggle è off, o se il ricordo è preferito
    const passaPreferiti = !filtri.soloPreferiti || r.preferito
    // Filtro autore: passa se nessun autore selezionato, o se chi ha scritto è tra quelli
    const passaAutore = filtri.autori.length === 0 || filtri.autori.includes(r.user_id)
    return passaMood && passaPreferiti && passaAutore
  })
}

// ------------------------------------------------------------
// formatDataGiorno
// Converte 'YYYY-MM-DD' in 'MARTEDÌ 14 GIUGNO 2025'
// Parsing locale: evita lo shift UTC su stringhe ISO date
// ------------------------------------------------------------

export function formatDataGiorno(dataISO: string): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase()
}

// ------------------------------------------------------------
// raggruppaPeData
// Raggruppa una lista di ricordi per data (YYYY-MM-DD).
// Mantiene l'ordine dei ricordi già ordinati dal service.
// I giorni risultanti sono ordinati data DESC (più recente prima).
// ------------------------------------------------------------

export function raggruppaPeData(ricordi: Ricordo[]): GiornoTimeline[] {
  const mappa = new Map<string, Ricordo[]>()

  for (const r of ricordi) {
    const existing = mappa.get(r.data)
    if (existing) {
      existing.push(r)
    } else {
      mappa.set(r.data, [r])
    }
  }

  // Ordina le date DESC — il service garantisce già l'ordine dei ricordi
  const dateOrdinate = Array.from(mappa.keys()).sort((a, b) => b.localeCompare(a))

  return dateOrdinate.map((data) => ({
    data,
    dataFormattata: formatDataGiorno(data),
    ricordi: mappa.get(data)!,
  }))
}

// ------------------------------------------------------------
// buildSezioniTimeline
// Costruisce la struttura completa della timeline del Diario.
// Input: viaggi già ordinati data_inizio DESC (da useViaggi)
//        mappa id → ricordi[] (da useQueries)
//        filtri attivi
// Output: array di SezioneViaggio, pronto per il render
// ------------------------------------------------------------

export function buildSezioniTimeline(
  viaggi: ViaggioConStato[],
  ricordiPerViaggio: Map<string, Ricordo[]>,
  filtri: FiltriDiario
): SezioneViaggio[] {
  return viaggi.map((viaggio) => {
    const tuttiRicordi = ricordiPerViaggio.get(viaggio.id) ?? []
    const ricordiFiltrati = applicaFiltri(tuttiRicordi, filtri)

    return {
      viaggio,
      giorni: raggruppaPeData(ricordiFiltrati),
      totaleRicordi:    tuttiRicordi.length,
      totaleFiltrati:   ricordiFiltrati.length,
      isEmpty:          tuttiRicordi.length === 0,
      isEmptyConFiltri: tuttiRicordi.length > 0 && ricordiFiltrati.length === 0,
    }
  })
}

// ------------------------------------------------------------
// selezionaRicordoInEvidenza
// Regola: highlight (V1.1) → preferito → ultimo per created_at
//
// NOTA: `highlight` è sempre false nel MVP (Opzione C).
// Il primo ramo non viene mai eseguito ma la struttura è pronta per V1.1.
// ------------------------------------------------------------

export function selezionaRicordoInEvidenza(
  ricordiPerViaggio: Map<string, Ricordo[]>
): Ricordo | null {
  const tutti: Ricordo[] = []
  for (const lista of ricordiPerViaggio.values()) {
    tutti.push(...lista)
  }

  if (tutti.length === 0) return null

  // 1. Primo highlight (V1.1 — sempre false nel MVP)
  const conHighlight = tutti.filter((r) => r.highlight)
  if (conHighlight.length > 0) {
    return conHighlight.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  }

  // 2. Primo preferito (più recente)
  const conPreferito = tutti.filter((r) => r.preferito)
  if (conPreferito.length > 0) {
    return conPreferito.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  }

  // 3. Ultimo ricordo creato
  return tutti.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
}

// ------------------------------------------------------------
// calcolaTotaliDiario
// Statistiche aggregate per il contatore nella FiltriBar
// ------------------------------------------------------------

export function calcolaTotaliDiario(sezioni: SezioneViaggio[]): {
  totale: number
  filtrati: number
  haNessunRicordo: boolean
} {
  const totale   = sezioni.reduce((acc, s) => acc + s.totaleRicordi, 0)
  const filtrati = sezioni.reduce((acc, s) => acc + s.totaleFiltrati, 0)
  return {
    totale,
    filtrati,
    haNessunRicordo: totale === 0,
  }
}

// ------------------------------------------------------------
// haFiltriAttivi — utility per la FiltriBar
// ------------------------------------------------------------

export function haFiltriAttivi(filtri: FiltriDiario): boolean {
  return filtri.mood.length > 0 || filtri.soloPreferiti || filtri.autori.length > 0
}

// ------------------------------------------------------------
// estraiAutoriDistinti
// Elenco di autori selezionabili come filtro — solo persone che
// hanno effettivamente scritto almeno un ricordo, e solo su viaggi
// con più di un membro (su un viaggio solitario "filtrare per
// persona" non avrebbe alcun senso). "Tu" viene sempre primo.
// ------------------------------------------------------------

export interface AutoreFiltro {
  userId: string
  nome: string
  avatarUrl: string | null
}

export function estraiAutoriDistinti(
  ricordiPerViaggio: Map<string, Ricordo[]>,
  membriPerViaggio: Map<string, MembroConProfilo[]>,
  mioUserId: string | undefined
): AutoreFiltro[] {
  const mappa = new Map<string, AutoreFiltro>()

  for (const [viaggioId, ricordi] of ricordiPerViaggio) {
    const membri = membriPerViaggio.get(viaggioId) ?? []
    if (membri.length <= 1) continue // non collaborativo — nessun filtro persona qui

    for (const r of ricordi) {
      if (mappa.has(r.user_id)) continue
      const membro = membri.find((m) => m.user_id === r.user_id)
      const seiTu = r.user_id === mioUserId
      mappa.set(r.user_id, {
        userId: r.user_id,
        nome: seiTu ? 'Tu' : (membro?.display_name?.trim() || 'Un collaboratore'),
        avatarUrl: membro?.avatar_url ?? null,
      })
    }
  }

  return Array.from(mappa.values()).sort((a, b) => {
    if (a.nome === 'Tu') return -1
    if (b.nome === 'Tu') return 1
    return a.nome.localeCompare(b.nome)
  })
}
