import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { SpotifyTrackSelezionato } from '@/types'

// ============================================================
// ROAMLY — Spotify Service
// Ricerca brani per la "colonna sonora" del ricordo. Passa dalla
// Edge Function `cerca-brano-spotify` — il Client Secret Spotify
// non deve mai finire nel bundle della PWA, quindi la ricerca vera
// e propria (Client Credentials flow) gira lato server.
// Vedi supabase/functions/cerca-brano-spotify/index.ts.
//
// Lancia un'eccezione (invece di restituire un { error } silenzioso)
// quando la Edge Function fallisce, così React Query la espone come
// isError/error e la UI (SpotifyTrackPicker) può mostrare il motivo
// reale invece del generico "Nessun brano trovato" — stesso bug già
// visto e corretto sul bottone "Segna come saldato" del budget.
// ============================================================

export async function cercaBraniSpotify(query: string): Promise<SpotifyTrackSelezionato[]> {
  const testo = query.trim()
  if (testo.length < 2) return []

  const { data, error } = await supabase.functions.invoke('cerca-brano-spotify', {
    body: { q: testo },
  })

  if (error) {
    // Per un errore HTTP della funzione (es. 500), il messaggio reale
    // sta nel body della risposta, non in error.message di default
    // (che è un generico "Edge Function returned a non-2xx status code").
    let dettaglio = error.message
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        if (body?.error) dettaglio = body.error as string
      } catch {
        // body non JSON — teniamo il messaggio generico
      }
    }
    throw new Error(dettaglio)
  }

  return (data?.risultati ?? []) as SpotifyTrackSelezionato[]
}
