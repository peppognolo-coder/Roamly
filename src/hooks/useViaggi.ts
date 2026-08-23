import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getViaggi, getViaggio, getStatisticheViaggio } from '@/services/viaggiService'
import { arricchisciViaggio, arricchisciViagg, getViaggioAttivo } from '@/lib/viaggi-utils'
import { useAuth } from '@/hooks/useAuth'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ROAMLY — useViaggi
// Hook React Query per la lettura dei viaggi.
// Tutti i dati esposti sono ViaggioConStato — mai Viaggio raw.
// Lo stato derivato viene calcolato una sola volta nel hook.
// ============================================================

// ------------------------------------------------------------
// useViaggi — lista completa con stato derivato
// ------------------------------------------------------------

export function useViaggi() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.viaggi.list(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await getViaggi(user!.id)
      if (error) throw new Error(error)
      return arricchisciViagg(data)
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minuti
  })
}

// ------------------------------------------------------------
// useViaggio — singolo viaggio con stato derivato
// Fetch dedicato per ID. La cache viene popolata (e invalidata)
// dalle mutations in useCrudViaggio.
// ------------------------------------------------------------

export function useViaggio(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.viaggi.detail(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getViaggio(viaggioId!)
      if (error) throw new Error(error)
      if (!data) throw new Error('Viaggio non trovato')
      return arricchisciViaggio(data)
    },
    enabled: !!user && !!viaggioId,
    staleTime: 1000 * 60 * 2,
  })
}

// ------------------------------------------------------------
// useViaggioAttivo — derivato dalla cache di useViaggi
// Non esegue fetch aggiuntivi. Legge dalla lista già in cache
// e applica la regola formale dei 6 punti da viaggi-utils.
// ------------------------------------------------------------

export function useViaggioAttivo(): {
  viaggio: ViaggioConStato | null
  isLoading: boolean
} {
  const { data: viaggi, isLoading } = useViaggi()

  if (isLoading || !viaggi) {
    return { viaggio: null, isLoading: true }
  }

  return {
    viaggio: getViaggioAttivo(viaggi),
    isLoading: false,
  }
}

// ------------------------------------------------------------
// useViaggiPerStato — lista raggruppata per stato
// Ordine canonico: in_corso → pianificato → concluso
// ------------------------------------------------------------

export function useViaggiPerStato() {
  const query = useViaggi()

  const grouped = {
    in_corso:    [] as ViaggioConStato[],
    pianificato: [] as ViaggioConStato[],
    concluso:    [] as ViaggioConStato[],
  }

  if (query.data) {
    for (const v of query.data) {
      grouped[v.stato_effettivo].push(v)
    }

    // Ordine interno: in_corso → data_inizio DESC (più recente prima)
    grouped.in_corso.sort((a, b) =>
      (b.data_inizio ?? '').localeCompare(a.data_inizio ?? '')
    )
    // pianificato → data_inizio ASC (il più prossimo prima)
    grouped.pianificato.sort((a, b) =>
      (a.data_inizio ?? '').localeCompare(b.data_inizio ?? '')
    )
    // concluso → data_fine DESC (il più recente prima)
    grouped.concluso.sort((a, b) =>
      (b.data_fine ?? '').localeCompare(a.data_fine ?? '')
    )
  }

  return {
    ...query,
    grouped,
    isEmpty: query.data?.length === 0,
  }
}

// ------------------------------------------------------------
// useStatisticheViaggio — statistiche base per ViaggioDetailPage
// Key dedicata: queryKeys.viaggi.statistiche(id)
// Invalidata esplicitamente da createRicordo, deleteRicordo, togglePreferito.
// staleTime allineato a 2 minuti come il resto del sistema.
// ------------------------------------------------------------

export function useStatisticheViaggio(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.viaggi.statistiche(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getStatisticheViaggio(viaggioId!)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user && !!viaggioId,
    staleTime: 1000 * 60 * 2,
  })
}
