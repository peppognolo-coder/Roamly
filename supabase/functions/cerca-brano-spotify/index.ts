// ============================================================
// ROAMLY — Edge Function: cerca-brano-spotify
//
// Gira su Supabase (Deno). Proxy di ricerca verso la Web API di
// Spotify (Client Credentials flow) — il Client Secret non può
// mai stare nel bundle della PWA, quindi la ricerca vera passa
// da qui. Richiede login (verify_jwt di default: non deployare
// con --no-verify-jwt), coerente col resto dell'app.
//
// Variabili d'ambiente richieste (Supabase secrets):
//   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
//   → da developer.spotify.com/dashboard, vedi istruzioni di deploy
//
// Input:  POST { q: string }  (query di ricerca, min 2 caratteri)
// Output: { risultati: [{ id, nome, artista, immagineUrl }] }
//
// Token cache: il Client Credentials token dura 1h — lo teniamo
// in una variabile di modulo così le invocazioni "calde" dello
// stesso worker non lo richiedono ogni volta. Sui cold start viene
// semplicemente rigenerato: nessuno stato persistente necessario.
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')

let cachedToken: { value: string; scadeAlle: number } | null = null

async function otteniToken(): Promise<string> {
  if (cachedToken && cachedToken.scadeAlle > Date.now()) {
    return cachedToken.value
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      'SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET non configurate come secret della funzione.'
    )
  }

  const basic = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`Autenticazione Spotify fallita (${res.status})`)
  }

  const json = await res.json() as { access_token: string; expires_in: number }

  // Margine di sicurezza di 60s prima della scadenza reale
  cachedToken = {
    value: json.access_token,
    scadeAlle: Date.now() + (json.expires_in - 60) * 1000,
  }

  return cachedToken.value
}

interface SpotifyTrackApi {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: { url: string; width: number }[] }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { q } = await req.json() as { q?: string }
    const query = (q ?? '').trim()

    if (query.length < 2) {
      return new Response(JSON.stringify({ risultati: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = await otteniToken()

    const url = new URL('https://api.spotify.com/v1/search')
    url.searchParams.set('q', query)
    url.searchParams.set('type', 'track')
    url.searchParams.set('limit', '8')
    url.searchParams.set('market', 'IT')

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      throw new Error(`Ricerca Spotify fallita (${res.status})`)
    }

    const json = await res.json() as { tracks: { items: SpotifyTrackApi[] } }

    const risultati = json.tracks.items.map((t) => ({
      id: t.id,
      nome: t.name,
      artista: t.artists.map((a) => a.name).join(', '),
      immagineUrl: t.album.images[1]?.url ?? t.album.images[0]?.url ?? null,
    }))

    return new Response(JSON.stringify({ risultati }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[cerca-brano-spotify]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Errore sconosciuto' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
