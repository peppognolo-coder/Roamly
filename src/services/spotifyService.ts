import { supabase } from '@/lib/supabase'
import type { SpotifyTrackSelezionato } from '@/types'

// ============================================================
// ROAMLY — Spotify Service
// Ricerca brani per la "colonna sonora" del ricordo. Passa dalla
// Edge Function `cerca-brano-spotify` — il Client Secret Spotify
// non deve mai finire nel bundle della PWA, quindi la ricerca vera
// e propria (Client Credentials flow) gira lato server.
// Vedi supabase/functions/cerca-brano-spotify/index.ts.
// ============================================================

export async function cercaBraniSpotify(query: string): Promise<{
  data: SpotifyTrackSelezionato[]
  error: string | null
}> {
  const testo = query.trim()
  if (testo.length < 2) return { data: [], error: null }

  const { data, error } = await supabase.functions.invoke('cerca-brano-spotify', {
    body: { q: testo },
  })

  if (error) return { data: [], error: error.message }

  return { data: (data?.risultati ?? []) as SpotifyTrackSelezionato[], error: null }
}
