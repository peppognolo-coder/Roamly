import { useState, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { hasSeenOnboarding } from '@/lib/onboarding-utils'
import { leggiReferralInSospeso, rimuoviReferralInSospeso } from '@/lib/referral-utils'
import { useRedimiReferral } from '@/hooks/useCrediti'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'

interface AuthGuardProps {
  children: React.ReactNode
}

// ============================================================
// AuthGuard — protegge le route che richiedono autenticazione.
// Se l'utente NON è autenticato → redirect a /login.
// Se autenticato ma non ha ancora visto l'onboarding → lo mostra
// una sola volta (flag in localStorage), poi rende children.
// Non gestisce il caso "già autenticato" — quello spetta a GuestGuard.
// ============================================================

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  // Letto una sola volta al mount: se completa onboarding durante la sessione,
  // il callback onComplete aggiorna questo stato locale.
  const [onboardingVisto, setOnboardingVisto] = useState(hasSeenOnboarding)

  // Riscatto automatico di un eventuale codice referral inserito in
  // fase di registrazione (email+password richiede conferma prima di
  // avere una sessione, quindi non poteva essere riscattato allora).
  // useRef invece di useEffect+dipendenze: deve girare una sola volta
  // per sessione app, non ad ogni cambio di isAuthenticated.
  const { redimi: redimiReferral } = useRedimiReferral()
  const referralTentato = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || referralTentato.current) return
    const codice = leggiReferralInSospeso()
    if (!codice) return

    referralTentato.current = true
    redimiReferral(codice)
    // Rimosso subito, indipendentemente dall'esito: se il codice non
    // era valido non vogliamo ritentare all'infinito ad ogni accesso.
    rimuoviReferralInSospeso()
  }, [isAuthenticated, redimiReferral])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-roamly-bg">
        <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!onboardingVisto) {
    return <OnboardingFlow onComplete={() => setOnboardingVisto(true)} />
  }

  return <>{children}</>
}
