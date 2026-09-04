const STORAGE_KEY = 'roamly_referral_pending'

// ============================================================
// referral-utils — codice referral in sospeso in localStorage
// La registrazione via email richiede conferma prima di avere una
// sessione attiva: il codice inserito in fase di registrazione
// non può essere riscattato subito (redimi_codice_referral
// richiede auth.uid()). Lo teniamo qui finché non c'è una sessione,
// poi lo riscattiamo una volta sola (vedi AuthGuard) e lo puliamo.
// ============================================================

export function salvaReferralInSospeso(codice: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, codice.trim().toUpperCase())
  } catch {
    /* noop */
  }
}

export function leggiReferralInSospeso(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function rimuoviReferralInSospeso(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
