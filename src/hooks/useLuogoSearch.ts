import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { cercaLuoghi } from '@/lib/geocoding'
import { queryKeys } from '@/lib/queryKeys'

// ============================================================
// ROAMLY — useLuogoSearch
// Query di ricerca luoghi (Nominatim), già pensata per un input
// debounced a monte (vedi useDebouncedValue + LuogoSearchInput).
// keepPreviousData evita che la lista sparisca per un istante
// tra un giro di digitazione e il successivo.
// ============================================================

export function useLuogoSearch(query: string) {
  const abilitato = query.trim().length >= 3

  return useQuery({
    queryKey: queryKeys.geocoding.search(query.trim().toLowerCase()),
    queryFn: ({ signal }) => cercaLuoghi(query, signal),
    enabled: abilitato,
    staleTime: 1000 * 60 * 10,
    retry: false,
    placeholderData: keepPreviousData,
  })
}
