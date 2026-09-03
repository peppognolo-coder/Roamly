import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getTappeNascosteUtente, nascondiTappa, mostraTappa } from '@/services/tappeNascosteService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useTappeNascoste
// "Nascondi per me" — l'elenco delle tappa_id che l'utente
// corrente ha scelto di non vedere in Attività/Calendario.
// Preferenza personale: non tocca la tappa condivisa, non la
// elimina, non la nasconde agli altri membri.
// ============================================================

export function useTappeNascoste() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.tappeNascoste.mie,
    queryFn: async () => {
      const { data, error } = await getTappeNascosteUtente()
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const idNascosti = new Set(query.data ?? [])

  const nascondi = useMutation({
    mutationFn: async (tappaId: string) => {
      if (!user) return
      const { error } = await nascondiTappa(tappaId, user.id)
      if (error) throw new Error(error)
    },
    onMutate: async (tappaId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tappeNascoste.mie })
      const precedente = queryClient.getQueryData<string[]>(queryKeys.tappeNascoste.mie) ?? []
      queryClient.setQueryData(queryKeys.tappeNascoste.mie, [...precedente, tappaId])
      return { precedente }
    },
    onError: (_err, _tappaId, context) => {
      if (context?.precedente) queryClient.setQueryData(queryKeys.tappeNascoste.mie, context.precedente)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tappeNascoste.mie })
    },
  })

  const mostra = useMutation({
    mutationFn: async (tappaId: string) => {
      if (!user) return
      const { error } = await mostraTappa(tappaId, user.id)
      if (error) throw new Error(error)
    },
    onMutate: async (tappaId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tappeNascoste.mie })
      const precedente = queryClient.getQueryData<string[]>(queryKeys.tappeNascoste.mie) ?? []
      queryClient.setQueryData(queryKeys.tappeNascoste.mie, precedente.filter((id) => id !== tappaId))
      return { precedente }
    },
    onError: (_err, _tappaId, context) => {
      if (context?.precedente) queryClient.setQueryData(queryKeys.tappeNascoste.mie, context.precedente)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tappeNascoste.mie })
    },
  })

  return {
    idNascosti,
    isLoading: query.isLoading,
    nascondiTappa: (tappaId: string) => nascondi.mutate(tappaId),
    mostraTappa:   (tappaId: string) => mostra.mutate(tappaId),
  }
}
