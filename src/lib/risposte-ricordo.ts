import type { RispostaRicordo } from '@/types'

// Domande proposte nel form del ricordo. Cambiare il testo di una
// domanda NON altera i ricordi già salvati: la domanda viene salvata
// insieme alla risposta.
export const DOMANDE_RICORDO = [
  'Cosa hai mangiato?',
  'Cosa ti ha sorpreso?',
  'Chi hai incontrato?',
  'Cosa non vuoi dimenticare?',
  'Cosa rifaresti?',
  'Un suono o un profumo di oggi',
  "Com'era l'atmosfera?",
  'Cosa ti ha fatto ridere?',
  'Cosa è andato storto?',
  'Cosa racconteresti a chi non c\'era?',
] as const

export const MAX_RISPOSTE = 8
export const MAX_CARATTERI_RISPOSTA = 600

/** Tiene solo i blocchi completi (domanda scelta + risposta scritta). */
export function pulisciRisposte(r: RispostaRicordo[] | undefined | null): RispostaRicordo[] {
  return (r ?? [])
    .map((x) => ({ domanda: x.domanda.trim(), risposta: x.risposta.trim() }))
    .filter((x) => x.domanda && x.risposta)
    .slice(0, MAX_RISPOSTE)
}
