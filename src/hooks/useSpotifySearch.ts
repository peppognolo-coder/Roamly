import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { cercaBraniSpotify } from '@/services/spotifyService'
import { queryKeys } from '@/lib/queryKeys'

// ============================================================
// ROAMLY — useSpotifySearch
// Query di ricerca brani (Spotify), pensata per un input debounced
// a monte — stesso pattern di useLuogoSearch/LuogoSearchInput.
// keepPreviousData evita che la lista sparisca per un istante tra
// un giro di digitazione e il successivo.
// ============================================================

export function useSpotifySearch(query: string) {
  const abilitato = query.trim().length >= 2

  return useQuery({
    queryKey: queryKeys.spotify.search(query.trim().toLowerCase()),
    queryFn: () => cercaBraniSpotify(query),
    select: (result) => result.data,
    enabled: abilitato,
    staleTime: 1000 * 60 * 30,
    retry: false,
    placeholderData: keepPreviousData,
  })
}
