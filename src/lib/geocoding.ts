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
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

export async function cercaLuoghi(
  query: string,
  signal?: AbortSignal
): Promise<RisultatoGeocoding[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=0`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Ricerca luoghi non riuscita')

  const data = (await res.json()) as NominatimResult[]

  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }))
}
