import type { BudgetVoce, BudgetPagamento } from '@/types'

// ============================================================
// ROAMLY — budget-utils
// Settle-up: split sempre equo tra tutti i membri del viaggio
// (coerente col form — "Dividi in tre e salva", nessun picker di
// partecipanti per singola spesa). Funzioni pure, senza dipendenze
// da React/Supabase — facili da verificare a mente.
// ============================================================

export interface MembroPerSaldo {
  userId: string
  nome: string
}

export interface SaldoMembro {
  userId: string
  nome: string
  /** Quanto ha pagato in prima persona, sommando le sue budget_voci */
  pagato: number
  /** Quota equa — totale speso del viaggio diviso il numero di membri */
  quota: number
  /** pagato - quota, nettato dai pareggi già registrati.
   *  Positivo: gli altri gli devono soldi. Negativo: deve soldi. */
  saldo: number
}

const EPS = 0.01 // sotto il centesimo, consideriamo pareggiato

export function calcolaSaldi(
  voci: BudgetVoce[],
  pagamenti: BudgetPagamento[],
  membri: MembroPerSaldo[]
): SaldoMembro[] {
  if (membri.length === 0) return []

  // Solo le voci 'quota' entrano nel pareggio — 'offerta' e
  // 'cointestato' contano nel totale del viaggio (mostrato altrove,
  // es. BudgetPage/SettleUpCard calcolano il proprio totale su TUTTE
  // le voci) ma sono neutre qui: non generano debiti né crediti.
  // Voci senza modalita_pagamento (righe pre-esistenti) sono trattate
  // come 'quota' — comportamento storico invariato.
  const vociDaDividere = voci.filter((v) => (v.modalita_pagamento ?? 'quota') === 'quota')

  const totale = vociDaDividere.reduce((s, v) => s + v.importo, 0)
  const quota = totale / membri.length

  return membri.map((m) => {
    const pagato = vociDaDividere
      .filter((v) => v.user_id === m.userId)
      .reduce((s, v) => s + v.importo, 0)

    // Pareggi già versati/ricevuti riducono il debito/credito residuo.
    const versati = pagamenti
      .filter((p) => p.da_user_id === m.userId)
      .reduce((s, p) => s + p.importo, 0)
    const ricevuti = pagamenti
      .filter((p) => p.a_user_id === m.userId)
      .reduce((s, p) => s + p.importo, 0)

    const saldo = (pagato - quota) + versati - ricevuti

    return { userId: m.userId, nome: m.nome, pagato, quota, saldo }
  })
}

export interface Trasferimento {
  daUserId: string
  daNome: string
  aUserId: string
  aNome: string
  importo: number
}

// Numero minimo di trasferimenti per pareggiare tutti i saldi —
// algoritmo greedy: ad ogni passo il debitore più esposto paga il
// creditore più esposto, per il minore dei due importi residui.
// Non è l'unica soluzione possibile (chi ha effettivamente pagato chi
// nella realtà può differire), ma è quella con meno passaggi di denaro.
export function calcolaGiroConti(saldi: SaldoMembro[]): Trasferimento[] {
  const creditori = saldi
    .filter((s) => s.saldo > EPS)
    .map((s) => ({ ...s }))
    .sort((a, b) => b.saldo - a.saldo)
  const debitori = saldi
    .filter((s) => s.saldo < -EPS)
    .map((s) => ({ ...s }))
    .sort((a, b) => a.saldo - b.saldo)

  const trasferimenti: Trasferimento[] = []
  let i = 0
  let j = 0
  while (i < debitori.length && j < creditori.length) {
    const debitore = debitori[i]
    const creditore = creditori[j]
    const importo = Math.min(-debitore.saldo, creditore.saldo)

    if (importo > EPS) {
      trasferimenti.push({
        daUserId: debitore.userId,
        daNome:   debitore.nome,
        aUserId:  creditore.userId,
        aNome:    creditore.nome,
        importo:  Math.round(importo * 100) / 100,
      })
      debitore.saldo += importo
      creditore.saldo -= importo
    }

    if (Math.abs(debitore.saldo) < EPS) i++
    if (Math.abs(creditore.saldo) < EPS) j++
  }

  return trasferimenti
}
