// ============================================================
// ROAMLY — Geocoding (Nominatim / OpenStreetMap)
// Ricerca luoghi testuale → coordinate. Gratuito, nessuna API key,
// coerente con lo stack mappe già in uso (Leaflet + tile OSM in
// AttivitaPage). Alimenta sia il link "Apri in Maps" con coordinate
// precise, sia l'auto-popolamento dei pin in Attività.
//
// Uso corretto delle policy Nominatim: nessuna chiamata ad ogni
// tasto premuto — il chiamante (useLuogoSearch) debounca l'input e
// richiede solo da 3 caratteri in su, con risultati messi in cache
// da React Query (staleTime lungo, le ricerche testuali non cambiano).
// ============================================================

export interface RisultatoGeocoding {
  label: string
  lat: number
  lng: number
  /** Nome del paese in italiano (es. "Grecia") — solo se disponibile */
  paese?: string
  /** Codice ISO 3166-1 alpha-2 in maiuscolo (es. "GR") — solo se disponibile */
  codicePaese?: string
}

/** Priorità di ricerca verso la destinazione di un viaggio specifico —
 *  facoltativa, usata quando si cerca una tappa da aggiungere a un
 *  viaggio già geolocalizzato (LuogoSearchInput in TappaForm). */
export interface BiasGeocoding {
  /** Centro della destinazione — da viaggio.destinazione_lat/lng */
  lat?: number | null
  lng?: number | null
  /** Codice ISO paese — da viaggio.paese_codice, restringe ai soli
   *  risultati di quel paese quando presente */
  codicePaese?: string | null
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    country?: string
    country_code?: string   // minuscolo per convenzione Nominatim, es. "gr"
  }
}

// Ampiezza approssimativa del riquadro di priorità attorno alla
// destinazione — abbastanza larga da coprire una città e i dintorni
// (~1° di latitudine/longitudine, circa 100km), non così larga da
// perdere il vantaggio della priorità. Nominatim la usa come
// preferenza di ranking (non filtro rigido: bounded non è impostato,
// quindi risultati fuori dal riquadro restano comunque raggiungibili
// se non c'è nulla di meglio dentro).
const RAGGIO_BIAS_GRADI = 1

export async function cercaLuoghi(
  query: string,
  signal?: AbortSignal,
  bias?: BiasGeocoding
): Promise<RisultatoGeocoding[]> {
  const q = query.trim()
  if (q.length < 3) return []

  // addressdetails=1 → aggiunge address.country/country_code al risultato,
  // usati per dedurre automaticamente il paese del viaggio (e il suo
  // emisfero, per i suggerimenti stagionali della Valigia) invece di farlo
  // scrivere a mano. accept-language=it → nomi paese in italiano quando
  // disponibili, coerente con la lingua dell'app.
  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1&accept-language=it`

  // Priorità alla destinazione del viaggio, se nota — non un filtro
  // rigido (niente bounded=1): un risultato ottimo altrove resta
  // comunque raggiungibile, semplicemente uno buono vicino alla
  // destinazione vince a parità di rilevanza testuale.
  if (bias?.lat != null && bias?.lng != null) {
    const viewbox = [
      bias.lng - RAGGIO_BIAS_GRADI, bias.lat - RAGGIO_BIAS_GRADI,
      bias.lng + RAGGIO_BIAS_GRADI, bias.lat + RAGGIO_BIAS_GRADI,
    ].join(',')
    url += `&viewbox=${viewbox}`
  }
  if (bias?.codicePaese) {
    url += `&countrycodes=${bias.codicePaese.toLowerCase()}`
  }

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Ricerca luoghi non riuscita')

  const data = (await res.json()) as NominatimResult[]

  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    paese: d.address?.country,
    codicePaese: d.address?.country_code?.toUpperCase(),
  }))
}
