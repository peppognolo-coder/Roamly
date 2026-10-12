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

// ------------------------------------------------------------
// Descrizione di un cluster: nome della zona, paese, centro e
// chiave stabile (per ricordare un suggerimento già scartato).
// Il nome della zona è il termine più ricorrente negli indirizzi
// salvati (esclusi il primo — il nome del posto — e l'ultimo — il
// paese); se non emerge nulla di affidabile resta null e la UI
// dice solo "nella stessa zona".
// ------------------------------------------------------------
export interface DescrizioneCluster {
  ids: string[]
  nomeZona: string | null
  paese: string | null
  lat: number
  lng: number
  chiave: string
}

export function descriviCluster(cluster: LuogoSalvato[]): DescrizioneCluster {
  const conteggio = new Map<string, number>()
  const paesi = new Map<string, number>()

  for (const l of cluster) {
    const parti = (l.indirizzo ?? '').split(',').map((p) => p.trim()).filter(Boolean)
    if (parti.length >= 3) {
      const paese = parti[parti.length - 1]
      paesi.set(paese, (paesi.get(paese) ?? 0) + 1)
      for (const parte of new Set(parti.slice(1, -1))) {
        if (/^\d+$/.test(parte)) continue
        conteggio.set(parte, (conteggio.get(parte) ?? 0) + 1)
      }
    }
  }

  const migliore = (m: Map<string, number>, minimo: number) => {
    let best: string | null = null
    let n = 0
    for (const [k, v] of m) if (v > n) { best = k; n = v }
    return n >= minimo ? best : null
  }

  const lat = cluster.reduce((a, l) => a + l.lat, 0) / cluster.length
  const lng = cluster.reduce((a, l) => a + l.lng, 0) / cluster.length
  const ids = cluster.map((l) => l.id)

  return {
    ids,
    nomeZona: migliore(conteggio, Math.max(2, Math.ceil(cluster.length / 2))),
    paese: migliore(paesi, 1),
    lat,
    lng,
    chiave: [...ids].sort().join('|'),
  }
}
