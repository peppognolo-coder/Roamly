import { useMemo } from 'react'
import { useRicordiRecenti, useRicordiStessoGiorno } from '@/hooks/useRicordi'
import { useViaggi } from '@/hooks/useViaggi'
import { getRicordoDelGiorno, oggiLocale } from '@/lib/ricordi-utils'
import type { Ricordo, ViaggioConStato } from '@/types'

// ============================================================
// useRicordoDelGiorno — hook consumer della logica B45
// Condiviso tra Home e Diario.
//
// Sorgente dati: useRicordiRecenti(50) — già in cache se l'utente
// ha visitato il Diario. Al primo accesso alla Home, parte il fetch.
// Il viaggio viene cercato nella lista viaggi già in cache.
//
// NOTA TECNICA — Sprint 8:
// B45 attualmente lavora sugli ultimi 50 ricordi tramite useRicordiRecenti(50).
// Se un utente avrà centinaia di ricordi, alcuni eventi storici potrebbero
// non essere considerati dalla logica "On This Day".
// Valutare in Sprint 8 una query dedicata per il recupero completo dei
// ricordi rilevanti (es. tutti i ricordi con data == stesso giorno/mese).
// ============================================================

export interface RicordoDelGiorno {
  ricordo: Ricordo
  viaggio: ViaggioConStato | null
  labelTempo: string | null  // "Un anno fa" | "Due anni fa" | null
}

export function useRicordoDelGiorno(): {
  data: RicordoDelGiorno | null
  isLoading: boolean
} {
  const { data: ricordi, isLoading: isLoadingRicordi } = useRicordiRecenti(50)
  const { data: viaggi, isLoading: isLoadingViaggi }   = useViaggi()
  const oggi = oggiLocale()
  // Ricordi dello stesso giorno in anni passati, senza il limite dei 50
  // più recenti: "Un anno fa" funziona anche con centinaia di ricordi.
  const { data: stessoGiorno, isLoading: isLoadingStessoGiorno } = useRicordiStessoGiorno(oggi)

  const isLoading = isLoadingRicordi || isLoadingViaggi || isLoadingStessoGiorno

  const data = useMemo(() => {
    // Unione senza doppioni: stessoGiorno ha la precedenza (On This Day),
    // i recenti restano il serbatoio per preferiti / fallback.
    const visti = new Set<string>()
    const tutti = [...(stessoGiorno ?? []), ...(ricordi ?? [])].filter((r) => {
      if (visti.has(r.id)) return false
      visti.add(r.id)
      return true
    })
    if (tutti.length === 0) return null

    const risultato = getRicordoDelGiorno(tutti, oggi)
    if (!risultato) return null

    const viaggio = viaggi?.find((v) => v.id === risultato.ricordo.viaggio_id) ?? null

    return {
      ricordo:    risultato.ricordo,
      viaggio,
      labelTempo: risultato.labelTempo,
    }
  }, [ricordi, stessoGiorno, viaggi, oggi])

  return { data, isLoading }
}
