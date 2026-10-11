import type { Meteo, Mood, Ricordo, ViaggioConStato } from '@/types'
import { curvaUmore, lunghezzaPercorso, MOOD_VALENZA } from '@/lib/giorno-utils'
import type { PuntoUmore } from '@/lib/giorno-utils'

// ============================================================
// ROAMLY — wrapped-utils
// Dai ricordi (già in cache) alle "storie" del riepilogo animato.
// Regola d'oro: una storia esiste solo se ha dati veri. Niente
// segnaposto, niente numeri inventati.
// ============================================================

export interface PuntoRotta { lat: number; lng: number }

export type Storia =
  | { tipo: 'copertina'; nome: string; luogo: string; date: string; fotoUrl: string | null }
  | { tipo: 'numeri'; giorni: number | null; ricordi: number; foto: number; luoghi: number }
  | { tipo: 'percorso'; punti: PuntoRotta[]; km: number; luoghi: number }
  | { tipo: 'umore'; mood: Mood; quanti: number; totale: number; curva: PuntoUmore[] }
  | { tipo: 'giornoBello'; titolo: string; luogo: string | null; data: string; mood: Mood; fotoUrl: string | null; ricordoId: string; preferito: boolean }
  | { tipo: 'compagni'; nomi: { nome: string; volte: number }[] }
  | { tipo: 'meteo'; conteggi: { meteo: Meteo; giorni: number }[]; tMax: number | null }
  | { tipo: 'chiusura'; nome: string }

export interface InputWrapped {
  viaggio: ViaggioConStato
  ricordi: Ricordo[]
  coversMap?: Map<string, string>
  fotoCount?: Map<string, number>
  coverViaggio?: string | null
  durataGiorni: number | null
  dateStr: string
}

export function buildStorie(i: InputWrapped): Storia[] {
  const { viaggio, ricordi } = i
  if (ricordi.length === 0) return []

  const storie: Storia[] = []
  const luogoViaggio = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')
  const totaleFoto = i.fotoCount ? Array.from(i.fotoCount.values()).reduce((a, b) => a + b, 0) : 0

  const ordinati = [...ricordi].sort((a, b) => a.data.localeCompare(b.data) || a.ordine - b.ordine)
  const luoghi = new Set(ricordi.map((r) => r.luogo?.split(',')[0]?.trim()).filter(Boolean)).size

  // 1. Copertina — foto del viaggio o, in mancanza, la prima foto di un ricordo
  const primaFoto = ordinati.map((r) => i.coversMap?.get(r.id)).find(Boolean) ?? null
  storie.push({ tipo: 'copertina', nome: viaggio.nome, luogo: luogoViaggio, date: i.dateStr, fotoUrl: i.coverViaggio ?? primaFoto })

  // 2. Numeri
  storie.push({ tipo: 'numeri', giorni: i.durataGiorni, ricordi: ricordi.length, foto: totaleFoto, luoghi })

  // 3. Percorso — servono almeno 2 punti
  const punti: PuntoRotta[] = ordinati
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ lat: r.lat as number, lng: r.lng as number }))
  if (punti.length >= 2) storie.push({ tipo: 'percorso', punti, km: lunghezzaPercorso(punti), luoghi })

  // 4. Umore più frequente
  const conta = new Map<Mood, number>()
  ricordi.forEach((r) => conta.set(r.mood, (conta.get(r.mood) ?? 0) + 1))
  const top = Array.from(conta.entries()).sort((a, b) => b[1] - a[1])[0]
  if (top) storie.push({ tipo: 'umore', mood: top[0], quanti: top[1], totale: ricordi.length, curva: curvaUmore(ricordi) })

  // 5. Il giorno più bello: preferito/highlight, altrimenti valenza più alta (a parità: prima la foto)
  const punteggio = (r: Ricordo) =>
    (r.highlight ? 100 : 0) + (r.preferito ? 50 : 0) + (MOOD_VALENZA[r.mood] ?? 3) * 5 +
    (i.coversMap?.get(r.id) ? 3 : 0) + (r.testo ? 1 : 0)
  const bello = [...ricordi].sort((a, b) => punteggio(b) - punteggio(a))[0]
  if (bello) {
    storie.push({
      tipo: 'giornoBello', titolo: bello.titolo, luogo: bello.luogo, data: bello.data, mood: bello.mood,
      fotoUrl: i.coversMap?.get(bello.id) ?? null, ricordoId: bello.id, preferito: bello.preferito || bello.highlight,
    })
  }

  // 6. Compagni
  const compagni = new Map<string, number>()
  ricordi.forEach((r) => (r.con_chi ?? []).forEach((n) => compagni.set(n, (compagni.get(n) ?? 0) + 1)))
  if (compagni.size > 0) {
    storie.push({
      tipo: 'compagni',
      nomi: Array.from(compagni.entries()).map(([nome, volte]) => ({ nome, volte })).sort((a, b) => b.volte - a.volte).slice(0, 4),
    })
  }

  // 7. Meteo — conta i GIORNI (non i ricordi): per ogni giorno, il meteo prevalente
  const perGiorno = new Map<string, Meteo[]>()
  ricordi.forEach((r) => { if (r.meteo) perGiorno.set(r.data, [...(perGiorno.get(r.data) ?? []), r.meteo]) })
  if (perGiorno.size >= 2) {
    const giorniMeteo = new Map<Meteo, number>()
    perGiorno.forEach((lista) => {
      const c = new Map<Meteo, number>()
      lista.forEach((m) => c.set(m, (c.get(m) ?? 0) + 1))
      const prevalente = Array.from(c.entries()).sort((a, b) => b[1] - a[1])[0][0]
      giorniMeteo.set(prevalente, (giorniMeteo.get(prevalente) ?? 0) + 1)
    })
    const temps = ricordi.map((r) => r.temperatura).filter((t): t is number => t != null)
    storie.push({
      tipo: 'meteo',
      conteggi: Array.from(giorniMeteo.entries()).map(([meteo, giorni]) => ({ meteo, giorni })).sort((a, b) => b.giorni - a.giorni),
      tMax: temps.length ? Math.max(...temps) : null,
    })
  }

  // 8. Chiusura
  storie.push({ tipo: 'chiusura', nome: viaggio.nome })
  return storie
}
