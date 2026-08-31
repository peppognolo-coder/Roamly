import type { ViaggioConStato } from '@/types'

// ============================================================
// ROAMLY — Statistiche personali ("I tuoi numeri")
// Funzioni pure di calcolo, nessuna chiamata di rete qui —
// prendono dati già in cache (viaggi + viaggio_id dei ricordi)
// e derivano le tre metriche in StatistichePage.
// ============================================================

export interface StatistichePersonali {
  viaggioPiuLungo: { nome: string; giorni: number } | null
  mesePiuPartenze: { mese: string; count: number } | null
  metaPiuRicordi:  { nome: string; count: number } | null
}

function capitalizza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function calcolaStatistichePersonali(
  viaggi: ViaggioConStato[],
  ricordiViaggioIds: string[]
): StatistichePersonali {

  // ── Viaggio più lungo (in giorni, inclusivo) ──
  let viaggioPiuLungo: StatistichePersonali['viaggioPiuLungo'] = null
  for (const v of viaggi) {
    if (!v.data_inizio || !v.data_fine) continue
    const giorni = Math.round(
      (new Date(v.data_fine).getTime() - new Date(v.data_inizio).getTime()) / 86_400_000
    ) + 1
    if (giorni > 0 && (!viaggioPiuLungo || giorni > viaggioPiuLungo.giorni)) {
      viaggioPiuLungo = { nome: v.nome, giorni }
    }
  }

  // ── Mese con più partenze ──
  const mesiCount = new Map<string, number>()
  for (const v of viaggi) {
    if (!v.data_inizio) continue
    const mese = capitalizza(
      new Date(v.data_inizio + 'T00:00:00').toLocaleDateString('it-IT', { month: 'long' })
    )
    mesiCount.set(mese, (mesiCount.get(mese) ?? 0) + 1)
  }
  let mesePiuPartenze: StatistichePersonali['mesePiuPartenze'] = null
  for (const [mese, count] of mesiCount) {
    if (!mesePiuPartenze || count > mesePiuPartenze.count) {
      mesePiuPartenze = { mese, count }
    }
  }

  // ── Meta (viaggio) con più ricordi ──
  const ricordiCount = new Map<string, number>()
  for (const viaggioId of ricordiViaggioIds) {
    ricordiCount.set(viaggioId, (ricordiCount.get(viaggioId) ?? 0) + 1)
  }
  let metaPiuRicordi: StatistichePersonali['metaPiuRicordi'] = null
  for (const [viaggioId, count] of ricordiCount) {
    const viaggio = viaggi.find((v) => v.id === viaggioId)
    if (!viaggio) continue
    if (!metaPiuRicordi || count > metaPiuRicordi.count) {
      metaPiuRicordi = { nome: viaggio.destinazione || viaggio.nome, count }
    }
  }

  return { viaggioPiuLungo, mesePiuPartenze, metaPiuRicordi }
}
