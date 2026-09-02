import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getRicordiDelViaggio } from '@/services/ricordiService'
import { useViaggi } from '@/hooks/useViaggi'
import { useAuth } from '@/hooks/useAuth'
import {
  buildSezioniTimeline,
  selezionaRicordoInEvidenza,
  calcolaTotaliDiario,
  haFiltriAttivi,
  type FiltriDiario,
  type SezioneViaggio,
} from '@/lib/diario-utils'
import type { Ricordo } from '@/types'

// ============================================================
// ROAMLY — useDiario
// Hook orchestratore della schermata Diario.
//
// Query strategy:
//   - useViaggi(): singola query per la lista viaggi (cache Sprint 2)
//   - useQueries(): N query parallele per i ricordi di ogni viaggio
//     usando i service esistenti (getRicordiDelViaggio) e le
//     query key esistenti (queryKeys.ricordi.byViaggio)
//     Nessun nuovo service, nessuna nuova query key.
//   - Al primo accesso: fetch paralleli per i viaggi non in cache
//   - Agli accessi successivi: opera esclusivamente su cache
//
// Il Diario è lettura pura — nessuna mutation, nessuna scrittura.
// ============================================================

export interface OutputUseDiario {
  sezioni: SezioneViaggio[]
  ricordoInEvidenza: Ricordo | null
  isLoading: boolean
  isLoadingParziale: boolean    // true = almeno un viaggio in caricamento, altri già pronti
  isEmpty: boolean              // true = nessun ricordo in assoluto
  isEmptyConFiltri: boolean     // true = filtri azzerano tutti i risultati
  totaleFiltrati: number
  totaleRicordi: number
  haViaggi: boolean             // true = l'utente ha almeno un viaggio — distingue
                                 // "nessun viaggio ancora" da "viaggi sì, ricordi no"
                                 // per lo stato vuoto del Diario
}

export function useDiario(filtri: FiltriDiario): OutputUseDiario {
  const { user } = useAuth()
  const { data: viaggi, isLoading: isLoadingViaggi } = useViaggi()

  // ---- useQueries: fetch paralleli per ricordi di ogni viaggio ----
  // Pattern corretto per N query dinamiche — non viola le regole dei hook.
  // React Query deduplica automaticamente le query già in cache.
  const queryRisultati = useQueries({
    queries: (viaggi ?? []).map((v) => ({
      queryKey: queryKeys.ricordi.byViaggio(v.id),
      queryFn:  async () => {
        const { data, error } = await getRicordiDelViaggio(v.id)
        if (error) throw new Error(error)
        return data
      },
      enabled:   !!user && !!viaggi,
      staleTime: 1000 * 60 * 2,
    })),
  })

  const isLoadingRicordi = queryRisultati.some((q) => q.isLoading)
  const isLoading        = isLoadingViaggi || isLoadingRicordi
  const isLoadingParziale = !isLoadingViaggi && isLoadingRicordi

  // ---- Costruisce la mappa id → Ricordo[] ----
  // Memoizzata: ricalcola solo quando viaggi o i risultati cambiano.
  const ricordiPerViaggio = useMemo(() => {
    const map = new Map<string, Ricordo[]>()
    ;(viaggi ?? []).forEach((v, i) => {
      const data = queryRisultati[i]?.data
      if (data) map.set(v.id, data)
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaggi, queryRisultati])

  // ---- Trasformazioni pure — tutte memoizzate ----
  const sezioni = useMemo(
    () => buildSezioniTimeline(viaggi ?? [], ricordiPerViaggio, filtri),
    [viaggi, ricordiPerViaggio, filtri]
  )

  const ricordoInEvidenza = useMemo(
    () => selezionaRicordoInEvidenza(ricordiPerViaggio),
    [ricordiPerViaggio]
  )

  const { totale, filtrati, haNessunRicordo } = useMemo(
    () => calcolaTotaliDiario(sezioni),
    [sezioni]
  )

  const filtriAttivi = haFiltriAttivi(filtri)

  return {
    sezioni,
    ricordoInEvidenza,
    isLoading,
    isLoadingParziale,
    isEmpty:           haNessunRicordo && !isLoading,
    isEmptyConFiltri:  !haNessunRicordo && filtriAttivi && filtrati === 0,
    totaleFiltrati:    filtrati,
    totaleRicordi:     totale,
    haViaggi:          (viaggi?.length ?? 0) > 0,
  }
}
