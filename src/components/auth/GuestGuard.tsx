import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface GuestGuardProps {
  children: React.ReactNode
}

// ============================================================
// GuestGuard — protegge le route pubbliche (es. /login).
// Se l'utente È già autenticato → redirect a /.
// Usare su tutte le route che non devono essere accessibili
// quando si è già loggati.
// ============================================================

export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-roamly-bg">
        <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
