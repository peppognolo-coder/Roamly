import type { Meteo, Mood, Ricordo, TappaViaggio, ViaggioConStato } from '@/types'

// ============================================================
// ROAMLY — giorno-utils
// Funzioni pure per la Pagina del giorno e il Racconto v2:
// riepilogo di una giornata, distanza percorsa, curva dell'umore.
// Nessuna chiamata Supabase, nessun side-effect.
// ============================================================

export interface PuntoMappa {
  id: string
  tipo: 'ricordo' | 'tappa'
  nome: string
  lat: number
  lng: number
  /** Numero d'ordine nel percorso del giorno (1-based) */
  ordine: number
}

export interface RiepilogoGiorno {
  data: string
  numeroGiorno: number | null
  ricordi: Ricordo[]
  tappe: TappaViaggio[]
  moodDominante: Mood | null
  mood: Mood[]                 // tutti, in ordine, senza ripetizioni
  meteo: Meteo | null          // il più frequente tra i ricordi
  temperatura: number | null   // massima registrata
  compagni: string[]
  km: number
  punti: PuntoMappa[]
}

// ── Distanza ────────────────────────────────────────────────

export function distanzaKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function lunghezzaPercorso(punti: { lat: number; lng: number }[]): number {
  let tot = 0
  for (let i = 1; i < punti.length; i++) {
    tot += distanzaKm([punti[i - 1].lat, punti[i - 1].lng], [punti[i].lat, punti[i].lng])
  }
  return tot
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`
}

// ── Date ────────────────────────────────────────────────────

export function parseISO(d: string): Date {
  const [y, m, g] = d.split('-').map(Number)
  return new Date(y, m - 1, g)
}

export function aggiungiGiorni(d: string, n: number): string {
  const x = parseISO(d)
  x.setDate(x.getDate() + n)
  return x.toLocaleDateString('sv')
}

/** Giorno N del viaggio (1-based) o null se fuori range / senza date. */
export function numeroGiorno(viaggio: Pick<ViaggioConStato, 'data_inizio'>, data: string): number | null {
  if (!viaggio.data_inizio) return null
  const diff = Math.round((parseISO(data).getTime() - parseISO(viaggio.data_inizio).getTime()) / 86_400_000)
  return diff >= 0 ? diff + 1 : null
}

// ── Riepilogo giornata ──────────────────────────────────────

function piuFrequente<T>(valori: T[]): T | null {
  const conta = new Map<T, number>()
  for (const v of valori) conta.set(v, (conta.get(v) ?? 0) + 1)
  let best: T | null = null
  let max = 0
  for (const [v, n] of conta) if (n > max) { best = v; max = n }
  return best
}

export function buildGiorno(
  viaggio: Pick<ViaggioConStato, 'data_inizio'>,
  ricordi: Ricordo[],
  tappe: TappaViaggio[],
  data: string
): RiepilogoGiorno {
  const rGiorno = ricordi
    .filter((r) => r.data === data)
    .sort((a, b) => a.ordine - b.ordine || a.created_at.localeCompare(b.created_at))

  const tGiorno = tappe
    .filter((t) => t.giorno && t.giorno <= data && (t.giorno_fine ?? t.giorno) >= data)
    .sort((a, b) => (a.ora ?? '99').localeCompare(b.ora ?? '99') || a.ordine - b.ordine)

  // Percorso: tappe in ordine d'orario, poi ricordi non già coperti da una tappa vicina
  const punti: PuntoMappa[] = []
  for (const t of tGiorno) {
    if (t.lat != null && t.lng != null) {
      punti.push({ id: t.id, tipo: 'tappa', nome: t.nome, lat: t.lat, lng: t.lng, ordine: 0 })
    }
  }
  for (const r of rGiorno) {
    if (r.lat != null && r.lng != null) {
      punti.push({ id: r.id, tipo: 'ricordo', nome: r.titolo, lat: r.lat, lng: r.lng, ordine: 0 })
    }
  }
  punti.forEach((p, i) => { p.ordine = i + 1 })

  const mood = rGiorno.map((r) => r.mood).filter((m, i, a) => a.indexOf(m) === i)
  const temps = rGiorno.map((r) => r.temperatura).filter((t): t is number => t != null)
  const compagni = Array.from(new Set(rGiorno.flatMap((r) => r.con_chi ?? [])))

  return {
    data,
    numeroGiorno: numeroGiorno(viaggio, data),
    ricordi: rGiorno,
    tappe: tGiorno,
    moodDominante: piuFrequente(rGiorno.map((r) => r.mood)),
    mood,
    meteo: piuFrequente(rGiorno.map((r) => r.meteo).filter((m): m is Meteo => !!m)),
    temperatura: temps.length ? Math.max(...temps) : null,
    compagni,
    km: lunghezzaPercorso(punti),
    punti,
  }
}

/** Tutte le date "vive" del viaggio: range del viaggio + date con ricordi/tappe. */
export function dateDelViaggio(
  viaggio: Pick<ViaggioConStato, 'data_inizio' | 'data_fine'>,
  ricordi: Ricordo[],
  tappe: TappaViaggio[]
): string[] {
  const set = new Set<string>()
  ricordi.forEach((r) => set.add(r.data))
  tappe.forEach((t) => t.giorno && set.add(t.giorno))
  if (viaggio.data_inizio) {
    const fine = viaggio.data_fine ?? viaggio.data_inizio
    for (let d = viaggio.data_inizio, n = 0; d <= fine && n < 400; d = aggiungiGiorni(d, 1), n++) set.add(d)
  }
  return Array.from(set).sort()
}

// ── Curva dell'umore ────────────────────────────────────────
// Valenza 1 (giù) … 5 (al settimo cielo): serve solo a disegnare
// l'andamento del viaggio, non è un giudizio sulle persone.

export const MOOD_VALENZA: Record<Mood, number> = {
  entusiasta: 5, innamorato: 5, felice: 5, avventuroso: 5, meravigliato: 5, orgoglioso: 5, divertito: 5,
  ispirato: 4, grato: 4, spensierato: 4, curioso: 4, affamato: 4, sorpreso: 4,
  sereno: 3, nostalgico: 3, commosso: 3,
  stanco: 2, confuso: 2,
  ansioso: 1, frustrato: 1,
}

export interface PuntoUmore {
  data: string
  valore: number // media 1..5
  mood: Mood     // dominante
}

export function curvaUmore(ricordi: Ricordo[]): PuntoUmore[] {
  const perGiorno = new Map<string, Ricordo[]>()
  for (const r of ricordi) perGiorno.set(r.data, [...(perGiorno.get(r.data) ?? []), r])
  return Array.from(perGiorno.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, rs]) => ({
      data,
      valore: rs.reduce((s, r) => s + (MOOD_VALENZA[r.mood] ?? 3), 0) / rs.length,
      mood: piuFrequente(rs.map((r) => r.mood)) as Mood,
    }))
}
