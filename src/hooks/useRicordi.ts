import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getRicordiDelViaggio, getRicordo, getRicordiRecenti, getStatisticheUtente, getRicordiViaggioIds } from '@/services/ricordiService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useRicordi
// Hook React Query per la lettura dei ricordi.
// Ordinamento canonico: data DESC, created_at DESC (garantito dal service).
// ============================================================

// ------------------------------------------------------------
// useRicordi — lista ricordi di un viaggio
// ------------------------------------------------------------

export function useRicordi(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.ricordi.byViaggio(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getRicordiDelViaggio(viaggioId!)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user && !!viaggioId,
    staleTime: 1000 * 60 * 2,
  })
}

// ------------------------------------------------------------
// useRicordo — singolo ricordo per ID
// ------------------------------------------------------------

export function useRicordo(ricordoId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.ricordi.detail(ricordoId ?? ''),
    queryFn: async () => {
      const { data, error } = await getRicordo(ricordoId!)
      if (error) throw new Error(error)
      if (!data) throw new Error('Ricordo non trovato')
      return data
    },
    enabled: !!user && !!ricordoId,
    staleTime: 1000 * 60 * 2,
  })
}

// ------------------------------------------------------------
// useRicordiRecenti — ultimi N ricordi dell'utente
// Usato in Home (Sprint 5) e come sorgente per Ricordo del Giorno (B45).
//
// NOTA TECNICA — Ricordo del Giorno (B45, Sprint 5):
// Questo hook è la sorgente dati per il Ricordo del Giorno.
// Sprint 5 implementerà `getRicordoDelGiorno(ricordi)` in lib/ricordi-utils.ts
// con logica: highlight → preferito → random deterministico per data.
// Non serve una query separata: si seleziona da questa cache.
// ------------------------------------------------------------

export function useRicordiRecenti(limit = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...queryKeys.ricordi.recenti(user?.id ?? ''), limit],
    queryFn: async () => {
      const { data, error } = await getRicordiRecenti(user!.id, limit)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  })
}

// ------------------------------------------------------------
// useStatisticheUtente — Quick Stats per la Home
// Query key: queryKeys.statistiche.utente(userId)
// Invalidata da useCreateRicordo e useDeleteRicordo (Sprint 5).
// ------------------------------------------------------------

export function useStatisticheUtente() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.statistiche.utente(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await getStatisticheUtente(user!.id)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minuti — cambia solo dopo create/delete
  })
}

// ------------------------------------------------------------
// useRicordiViaggioIds — solo i viaggio_id di tutti i ricordi,
// per StatistichePage (Q2) → calcolaStatistichePersonali
// ------------------------------------------------------------

export function useRicordiViaggioIds() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.ricordi.viaggioIds(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await getRicordiViaggioIds()
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
