import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getLuoghiSalvati, salvaLuogo, rimuoviLuogoSalvato, assegnaLuoghiAViaggio } from '@/services/luoghiSalvatiService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovoLuogoSalvato } from '@/types'

// ============================================================
// ROAMLY — useLuoghiSalvati
// Wishlist personale. Con `viaggioId` filtra ai soli luoghi
// salvati per quel viaggio (Mappa · "Salvati"); senza, restituisce
// tutta la wishlist dell'utente (futura vista "Salvati" globale).
// ============================================================

export function useLuoghiSalvati(viaggioId?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = viaggioId ? queryKeys.luoghiSalvati.byViaggio(viaggioId) : queryKeys.luoghiSalvati.mie

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getLuoghiSalvati(viaggioId)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  function invalidaTutto() {
    queryClient.invalidateQueries({ queryKey: queryKeys.luoghiSalvati.mie })
    if (viaggioId) queryClient.invalidateQueries({ queryKey: queryKeys.luoghiSalvati.byViaggio(viaggioId) })
  }

  const salva = useMutation({
    mutationFn: async (payload: NuovoLuogoSalvato) => {
      if (!user) throw new Error('Utente non autenticato')
      const { data, error } = await salvaLuogo(user.id, payload)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: invalidaTutto,
  })

  const rimuovi = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return
      const { error } = await rimuoviLuogoSalvato(id, user.id)
      if (error) throw new Error(error)
    },
    onSuccess: invalidaTutto,
  })

  return {
    luoghi: query.data ?? [],
    isLoading: query.isLoading,
    salvaLuogo: (
      payload: NuovoLuogoSalvato,
      esito?: { onSuccess?: () => void; onError?: (messaggio: string) => void }
    ) => salva.mutate(payload, {
      onSuccess: () => esito?.onSuccess?.(),
      onError: (e) => esito?.onError?.(e instanceof Error ? e.message : 'Errore sconosciuto'),
    }),
    rimuoviLuogoSalvato: (id: string) => rimuovi.mutate(id),
    isSalvando: salva.isPending,
  }
}

// Assegna dei luoghi salvati a un viaggio appena creato.
export function useAssegnaLuoghi() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return async (ids: string[], viaggioId: string) => {
    if (!user || ids.length === 0) return
    const { error } = await assegnaLuoghiAViaggio(ids, viaggioId, user.id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: queryKeys.luoghiSalvati.mie })
    }
  }
}
