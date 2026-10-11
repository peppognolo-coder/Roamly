// ============================================================
// ROAMLY — Testi per condividere un viaggio
// Varianti del messaggio che accompagna il link. Solo dati veri:
// una variante compare solo se i dati che usa esistono (es. "Per
// chi c'era" solo nei viaggi con più persone). Il link NON è nel
// testo: lo accoda il sistema di condivisione del telefono.
// ============================================================

export type VarianteTesto = 'numeri' | 'emotivo' | 'curioso' | 'scherzoso' | 'gruppo' | 'sobrio'

export interface DatiTesto {
  nome: string
  /** Città o destinazione ("Manchester"), se nota */
  luogo: string | null
  giorni: number | null
  ricordi: number
  foto: number
  /** true se nel viaggio ci sono altre persone oltre al proprietario */
  conAltri: boolean
}

export const ETICHETTE_TESTO: Record<VarianteTesto, string> = {
  numeri: 'Con i numeri',
  emotivo: 'Emotivo',
  curioso: 'Curioso',
  scherzoso: 'Scherzoso',
  gruppo: "Per chi c'era",
  sobrio: 'Sobrio',
}

function elencoIt(parti: string[]): string {
  if (parti.length <= 1) return parti.join('')
  return `${parti.slice(0, -1).join(', ')} e ${parti[parti.length - 1]}`
}

const giorniStr = (g: number) => `${g} ${g === 1 ? 'giorno' : 'giorni'}`

/** Varianti disponibili per questo viaggio, nell'ordine in cui si mostrano. */
export function variantiDisponibili(d: DatiTesto): VarianteTesto[] {
  const v: VarianteTesto[] = ['numeri', 'emotivo', 'curioso']
  if (d.foto > 0) v.push('scherzoso')
  if (d.conAltri) v.push('gruppo')
  v.push('sobrio')
  return v
}

export function costruisciTesto(variante: VarianteTesto, d: DatiTesto): string {
  switch (variante) {
    case 'numeri': {
      const numeri = elencoIt([
        ...(d.giorni ? [giorniStr(d.giorni)] : []),
        ...(d.ricordi ? [`${d.ricordi} ${d.ricordi === 1 ? 'ricordo' : 'ricordi'}`] : []),
        ...(d.foto ? [`${d.foto} foto`] : []),
      ])
      return numeri
        ? `Ho messo insieme "${d.nome}": ${numeri}. Ti porto con me, guarda 👇`
        : `Ho raccontato "${d.nome}" su Roamly. Ti porto con me, guarda 👇`
    }
    case 'emotivo': {
      const apertura =
        d.giorni && d.luogo
          ? `${giorniStr(d.giorni)} a ${d.luogo}`
          : d.luogo
            ? `Il mio viaggio a ${d.luogo}`
            : `Il mio viaggio "${d.nome}"`
      return `${apertura} e un sacco di cose che non voglio dimenticare. Le ho scritte tutte qui, giorno per giorno 👇`
    }
    case 'curioso':
      return `${d.luogo ? `Sai cosa ho fatto a ${d.luogo}?` : 'Sai cosa ho fatto in questo viaggio?'} Ho raccontato tutto, con foto, mappa e come mi sentivo ogni giorno. Vieni a vedere 👇`
    case 'scherzoso':
      return `Giuro, ho scelto solo ${d.foto} ${d.foto === 1 ? 'foto' : 'foto'}. "${d.nome}", dall'inizio alla fine 👇`
    case 'gruppo':
      return `Il nostro "${d.nome}", tutto in un posto: ricordi, foto e percorso. Chi c'era riconoscerà ogni momento 👇`
    case 'sobrio':
      return `Il mio "${d.nome}", raccontato giorno per giorno.`
  }
}
