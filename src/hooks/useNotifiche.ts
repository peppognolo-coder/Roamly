import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getNotifiche, segnaNotificaLetta, segnaTutteLette } from '@/services/notificheService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useNotifiche
// Feed notifiche dell'utente corrente. Refetch periodico leggero
// (60s) così il pallino "non lette" resta ragionevolmente
// aggiornato senza bisogno di realtime.
// ============================================================

export function useNotifiche() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: user ? queryKeys.notifiche.mie(user.id) : ['notifiche', 'anonimo'],
    queryFn: async () => {
      const { data, error } = await getNotifiche()
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  })

  const notifiche = query.data ?? []
  const nonLette = notifiche.filter((n) => !n.letta).length

  function invalida() {
    if (user) queryClient.invalidateQueries({ queryKey: queryKeys.notifiche.mie(user.id) })
  }

  const segnaLetta = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return
      const { error } = await segnaNotificaLetta(id, user.id)
      if (error) throw new Error(error)
    },
    onSuccess: invalida,
  })

  const segnaTutte = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await segnaTutteLette(user.id)
      if (error) throw new Error(error)
    },
    onSuccess: invalida,
  })

  return {
    notifiche,
    nonLette,
    isLoading: query.isLoading,
    segnaLetta: (id: string) => segnaLetta.mutate(id),
    segnaTutteLette: () => segnaTutte.mutate(),
  }
}
