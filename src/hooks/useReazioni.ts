import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getReazioni, aggiungiReazione, rimuoviReazione, type Reazione } from '@/services/reazioniService'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useAuth } from '@/hooks/useAuth'
import { useMembriViaggio } from '@/hooks/useMembri'

// ============================================================
// ROAMLY — useReazioni
// Reazioni (cuore) su un ricordo — toggle ottimistico + realtime,
// visibili solo su viaggi con più di un membro (su un viaggio
// solitario "reagire" al proprio stesso ricordo non ha senso).
// ============================================================

export function useReazioni(ricordoId: string | undefined, viaggioId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: membri } = useMembriViaggio(viaggioId)
  const isCollaborativo = (membri?.length ?? 0) > 1

  const queryKey = queryKeys.reazioni.byRicordo(ricordoId ?? '')

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getReazioni(ricordoId as string)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!ricordoId && isCollaborativo,
  })

  useRealtimeSync('reazioni_ricordo', 'ricordo_id', isCollaborativo ? ricordoId : undefined, [queryKey])

  const reazioni = query.data ?? []
  const mieReazione = reazioni.some((r) => r.user_id === user?.id)

  const toggle = useMutation({
    mutationFn: async () => {
      if (!ricordoId || !user) return
      if (mieReazione) {
        const { error } = await rimuoviReazione(ricordoId, user.id)
        if (error) throw new Error(error)
      } else {
        const { error } = await aggiungiReazione(ricordoId, user.id)
        if (error) throw new Error(error)
      }
    },
    onMutate: async () => {
      if (!user) return
      await queryClient.cancelQueries({ queryKey })
      const precedente = queryClient.getQueryData<Reazione[]>(queryKey) ?? []

      const aggiornate = mieReazione
        ? precedente.filter((r) => r.user_id !== user.id)
        : [...precedente, {
            id: `temp-${user.id}`,
            ricordo_id: ricordoId ?? '',
            user_id: user.id,
            created_at: new Date().toISOString(),
          }]

      queryClient.setQueryData(queryKey, aggiornate)
      return { precedente }
    },
    onError: (_err, _vars, context) => {
      if (context?.precedente) queryClient.setQueryData(queryKey, context.precedente)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    reazioni,
    totale: reazioni.length,
    mieReazione,
    isLoading: query.isLoading,
    isCollaborativo,
    toggle: () => toggle.mutate(),
  }
}
