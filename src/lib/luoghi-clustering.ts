import type { LuogoSalvato } from '@/types'

// ============================================================
// ROAMLY — luoghi-clustering
// Logica pura: trova gruppi di luoghi salvati geograficamente
// vicini tra loro (distanza reale lat/lng, non nomi di città
// estratti da un indirizzo libero — troppo fragile per essere
// affidabile). Nessuna chiamata esterna, nessun dato inventato:
// se non ci sono abbastanza luoghi vicini, non c'è suggerimento.
// ============================================================

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// Formula haversine — distanza in km tra due coordinate.
export function distanzaKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Raggruppamento greedy: per ogni luogo non ancora assegnato,
// prende tutti gli altri non assegnati entro `sogliaKm` — se il
// gruppo raggiunge `minimo` elementi diventa un cluster, altrimenti
// il luogo resta da solo e si passa al successivo. Restituisce i
// cluster trovati, dal più numeroso.
export function trovaClusterVicini(
  luoghi: LuogoSalvato[],
  sogliaKm = 25,
  minimo = 3
): LuogoSalvato[][] {
  const assegnati = new Set<string>()
  const clusters: LuogoSalvato[][] = []

  for (const base of luoghi) {
    if (assegnati.has(base.id)) continue

    const vicini = luoghi.filter(
      (l) => !assegnati.has(l.id) && distanzaKm(base, l) <= sogliaKm
    )

    if (vicini.length >= minimo) {
      vicini.forEach((l) => assegnati.add(l.id))
      clusters.push(vicini)
    }
  }

  return clusters.sort((a, b) => b.length - a.length)
}
