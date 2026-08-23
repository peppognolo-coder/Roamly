import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getChecklistItems } from '@/services/checklistService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useChecklist
// Hook React Query per la lettura degli item della checklist.
//
// LAZY LOADING: il parametro `abilitato` controlla quando
// la query viene eseguita. Viene passato `true` solo quando
// l'accordion del viaggio viene aperto per la prima volta.
// React Query gestisce poi la cache: gli accessi successivi
// alla stessa checklist non generano nuove richieste Supabase.
// ============================================================

export function useChecklist(
  viaggioId: string | undefined,
  abilitato: boolean   // true solo quando l'accordion è aperto
) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.checklist.byViaggio(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getChecklistItems(viaggioId!)
      if (error) throw new Error(error)
      return data
    },
    // La query parte SOLO quando:
    //   - l'utente è autenticato
    //   - il viaggioId è valido
    //   - l'accordion è stato aperto almeno una volta (abilitato = true)
    enabled: !!user && !!viaggioId && abilitato,
    staleTime: 1000 * 60 * 2,
  })
}
