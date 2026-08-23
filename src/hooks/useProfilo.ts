import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import { getProfilo, aggiornaProfilo, type AggiornamentoProfilo } from '@/services/profiloService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useProfilo
// Hook React Query per il profilo dell'utente corrente.
// ============================================================

// ------------------------------------------------------------
// useProfilo — lettura
// ------------------------------------------------------------

export function useProfilo() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.profilo.detail(user?.id ?? ''),
    queryFn: () => getProfilo(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minuti — il profilo cambia raramente
    select: (result) => result.data,
  })
}

// ------------------------------------------------------------
// useAggiornaProfilo — mutation con invalidazione automatica
// ------------------------------------------------------------

export function useAggiornaProfilo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (payload: AggiornamentoProfilo) => {
      if (!user) throw new Error('Utente non autenticato')
      return aggiornaProfilo(user.id, payload)
    },
    onSuccess: () => {
      if (!user) return
      // Invalida la query del profilo → refetch automatico
      showSuccess('Profilo aggiornato')
      queryClient.invalidateQueries({
        queryKey: queryKeys.profilo.detail(user.id),
      })
    },
  })
}
