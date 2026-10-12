import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getLuoghiSalvati, salvaLuogo, rimuoviLuogoSalvato, assegnaLuoghiAViaggio, aggiornaLuogoSalvato } from '@/services/luoghiSalvatiService'
import { useAuth } from '@/hooks/useAuth'
import { recuperaInfoLuogo } from '@/lib/luogo-info'
import { raccolteDi, inRaccolta, aggiungiARaccolte, togliDaRaccolte } from '@/lib/raccolte'
import type { RisultatoGeocoding } from '@/lib/geocoding'
import type { LuogoSalvato, NuovoLuogoSalvato, ModificaLuogoSalvato } from '@/types'

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
      esito?: { onSuccess?: (luogo: LuogoSalvato | null) => void; onError?: (messaggio: string) => void }
    ) => salva.mutate(payload, {
      onSuccess: (luogo) => esito?.onSuccess?.(luogo),
      onError: (e) => esito?.onError?.(e instanceof Error ? e.message : 'Errore sconosciuto'),
    }),
    rimuoviLuogoSalvato: (
      id: string,
      esito?: { onSuccess?: () => void; onError?: (messaggio: string) => void }
    ) => rimuovi.mutate(id, {
      onSuccess: () => esito?.onSuccess?.(),
      onError: (e) => esito?.onError?.(e instanceof Error ? e.message : 'Errore sconosciuto'),
    }),
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

// Modifica un luogo salvato (es. assegnarlo a un viaggio) con esito.
export function useAggiornaLuogo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return async (id: string, patch: ModificaLuogoSalvato): Promise<string | null> => {
    if (!user) return 'Utente non autenticato'
    const { error } = await aggiornaLuogoSalvato(id, user.id, patch)
    if (!error) queryClient.invalidateQueries({ queryKey: queryKeys.luoghiSalvati.mie })
    return error
  }
}

// Recupera descrizione, foto e info pratiche del luogo e le salva.
export function useArricchisciLuogo() {
  const aggiorna = useAggiornaLuogo()

  return async (luogo: LuogoSalvato, risultato?: RisultatoGeocoding) => {
    const patch = await recuperaInfoLuogo({
      nome: luogo.nome,
      lat: luogo.lat,
      lng: luogo.lng,
      categoria: luogo.categoria,
      risultato,
    })
    await aggiorna(luogo.id, patch)
  }
}

// Gestione delle raccolte (cartelle libere): rinomina ed elimina agiscono su
// tutti i posti che le contengono. Eliminare una raccolta toglie solo
// l'etichetta: i posti restano salvati. Restituiscono un messaggio d'errore
// oppure null se è andato tutto bene.
export function useGestioneRaccolte() {
  const aggiorna = useAggiornaLuogo()

  async function perOgniPosto(luoghi: LuogoSalvato[], nome: string, nuovo: (attuali: string[]) => string[]) {
    const coinvolti = luoghi.filter((l) => inRaccolta(l, nome))
    const esiti = await Promise.all(coinvolti.map((l) => aggiorna(l.id, { raccolte: nuovo(raccolteDi(l)) })))
    return esiti.find((e) => e) ?? null
  }

  return {
    rinomina: (luoghi: LuogoSalvato[], vecchio: string, nuovo: string) =>
      perOgniPosto(luoghi, vecchio, (a) => aggiungiARaccolte(togliDaRaccolte(a, vecchio), nuovo)),
    elimina: (luoghi: LuogoSalvato[], nome: string) =>
      perOgniPosto(luoghi, nome, (a) => togliDaRaccolte(a, nome)),
  }
}
