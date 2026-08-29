const STORAGE_KEY = 'roamly_onboarding_seen'

// ============================================================
// onboarding-utils — flag persistito in localStorage
// Stesso pattern di src/components/pwa/InstallBanner.tsx
// ============================================================

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return true // se localStorage non è disponibile, non blocchiamo l'utente
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    /* noop */
  }
}
