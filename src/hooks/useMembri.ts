import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getMioRuolo, getMembriViaggio } from '@/services/membriService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useMembri
// Base minimale per M2 — estesa nel Blocco M4.
// ============================================================

export function useMioRuolo(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.membri.mioRuolo(viaggioId ?? '', user?.id ?? ''),
    queryFn: () => getMioRuolo(viaggioId as string, user!.id),
    select: (result) => result.ruolo,
    enabled: !!viaggioId && !!user,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMembriViaggio(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.membri.byViaggio(viaggioId ?? ''),
    queryFn: () => getMembriViaggio(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}
