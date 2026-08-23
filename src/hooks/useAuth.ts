import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// ============================================================
// useAuthListener
// Da chiamare UNA SOLA VOLTA in App.tsx.
// Inizializza la sessione e ascolta i cambiamenti di stato auth.
// ============================================================

export function useAuthListener() {
  const { setUser, setSession, setIsLoading } = useAuthStore()

  useEffect(() => {
    // Recupera sessione esistente al mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Ascolta cambiamenti di stato auth (login, logout, token refresh, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setIsLoading])
}

// ============================================================
// useAuth
// Hook di lettura — da usare in tutti i componenti.
// API pubblica: user, session, isLoading, isAuthenticated.
// Gli errori auth sono locali ai form (useState) — non globali.
// ============================================================

export function useAuth() {
  const { user, session, isLoading } = useAuthStore()
  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
  }
}
