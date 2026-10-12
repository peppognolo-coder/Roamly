import type { LuogoSalvato } from '@/types'

// ============================================================
// ROAMLY — raccolte
// Le "raccolte" sono cartelle libere di "Voglio andarci" (es. "Road trip",
// "Con amici"). Non hanno una tabella propria: ogni posto porta l'elenco
// dei nomi a cui appartiene, e una raccolta esiste finché ha almeno un
// posto. I nomi si confrontano senza badare a maiuscole/minuscole.
// ============================================================

export interface Raccolta {
  nome: string
  luoghi: LuogoSalvato[]
  /** Fino a 4 foto dei posti, per il mosaico della cartella */
  foto: string[]
}

const chiave = (nome: string) => nome.trim().toLowerCase()

export function pulisciNomeRaccolta(testo: string): string {
  return testo.replace(/\s+/g, ' ').trim().slice(0, 40)
}

export function raccolteDi(luogo: LuogoSalvato): string[] {
  return luogo.raccolte ?? []
}

export function inRaccolta(luogo: LuogoSalvato, nome: string): boolean {
  return raccolteDi(luogo).some((r) => chiave(r) === chiave(nome))
}

export function elencoRaccolte(luoghi: LuogoSalvato[]): Raccolta[] {
  const mappa = new Map<string, Raccolta>()
  for (const l of luoghi) {
    for (const nome of raccolteDi(l)) {
      const k = chiave(nome)
      if (!k) continue
      const r = mappa.get(k) ?? { nome, luoghi: [], foto: [] }
      r.luoghi.push(l)
      if (l.foto_url && r.foto.length < 4) r.foto.push(l.foto_url)
      mappa.set(k, r)
    }
  }
  return Array.from(mappa.values()).sort(
    (a, b) => b.luoghi.length - a.luoghi.length || a.nome.localeCompare(b.nome, 'it')
  )
}

/** Se esiste già una raccolta con lo stesso nome (senza badare alle maiuscole) restituisce quel nome */
export function nomeEsistenteONuovo(tutte: string[], digitato: string): string {
  const pulito = pulisciNomeRaccolta(digitato)
  return tutte.find((r) => chiave(r) === chiave(pulito)) ?? pulito
}

export function aggiungiARaccolte(attuali: string[], nome: string): string[] {
  return attuali.some((r) => chiave(r) === chiave(nome)) ? attuali : [...attuali, nome]
}

export function togliDaRaccolte(attuali: string[], nome: string): string[] {
  return attuali.filter((r) => chiave(r) !== chiave(nome))
}
