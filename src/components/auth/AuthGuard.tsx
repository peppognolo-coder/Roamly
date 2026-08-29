import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { hasSeenOnboarding } from '@/lib/onboarding-utils'
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
