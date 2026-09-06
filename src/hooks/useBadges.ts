import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getCatalogoBadges, getUserBadges, verificaTraguardi } from '@/services/badgesService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { BadgeConStato } from '@/types'

// ============================================================
// ROAMLY — useBadges
// ============================================================

// ------------------------------------------------------------
// useTraguardi — catalogo completo unito allo stato "posseduto"
// per l'utente corrente, pronto per la griglia in UI.
// ------------------------------------------------------------

export function useTraguardi() {
  const { user } = useAuth()

  const catalogo = useQuery({
    queryKey: queryKeys.badges.all,
    queryFn: getCatalogoBadges,
    select: (r) => r.data,
    staleTime: 1000 * 60 * 60, // il catalogo cambia raramente
  })

  const posseduti = useQuery({
    queryKey: queryKeys.badges.byUtente(user?.id ?? ''),
    queryFn: () => getUserBadges(user!.id),
    select: (r) => r.data,
    enabled: !!user,
  })

  const isLoading = catalogo.isLoading || posseduti.isLoading

  const traguardi: BadgeConStato[] = (catalogo.data ?? []).map((badge) => {
    const mio = posseduti.data?.find((ub) => ub.badge_id === badge.id)
    return { ...badge, posseduto: !!mio, earned_at: mio?.earned_at ?? null }
  })

  return { data: traguardi, isLoading }
}

// ------------------------------------------------------------
// useVerificaTraguardi — "fire and forget" da chiamare dopo
// un'azione che può sbloccare un traguardo. Se ne sblocca uno o
// più, mostra un toast per ciascuno — nessun errore visibile se
// fallisce, stesso principio di useCompletaAzione per i crediti.
// ------------------------------------------------------------

export function useVerificaTraguardi() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: verificaTraguardi,
    onSuccess: (result) => {
      if (result.error || !user || result.nuovi.length === 0) return

      queryClient.invalidateQueries({ queryKey: queryKeys.badges.byUtente(user.id) })
      result.nuovi.forEach((b) => {
        showSuccess(`Nuovo traguardo sbloccato: ${b.nome}`)
      })
    },
    onError: () => {
      // Silenzioso di proposito — è un bonus, non deve disturbare l'azione principale.
    },
  })

  return { verifica: () => mutation.mutate() }
}
