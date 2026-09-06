import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getRecapViaggio } from '@/services/recapService'

// ============================================================
// ROAMLY — useRecapViaggio
// ============================================================

export function useRecapViaggio(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recap.byViaggio(viaggioId ?? ''),
    queryFn: () => getRecapViaggio(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}
