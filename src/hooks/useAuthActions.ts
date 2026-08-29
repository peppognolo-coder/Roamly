import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  loginWithEmail,
  loginWithGoogle,
  logout,
  mapAuthError,
  registerWithEmail,
  deleteAccount,
} from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

// ============================================================
// ROAMLY — useAuthActions
// Espone le azioni auth con loading e error state locali.
// Gli errori sono locali a ogni hook — non vanno nello store globale.
// ============================================================

// ------------------------------------------------------------
// useLogin
// ------------------------------------------------------------

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function login(email: string, password: string) {
    setIsLoading(true)
    setError(null)

    const { error: authError } = await loginWithEmail(email, password)

    if (authError) {
      setError(mapAuthError(authError.message))
      setIsLoading(false)
      return { success: false }
    }

    // setIsLoading prima di navigate: il componente potrebbe smontarsi
    // immediatamente dopo il redirect e aggiornare stato su un nodo non montato.
    setIsLoading(false)
    navigate('/', { replace: true })
    return { success: true }
  }

  return { login, isLoading, error, clearError: () => setError(null) }
}

// ------------------------------------------------------------
// useRegister
// ------------------------------------------------------------

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  async function register(email: string, password: string, fullName: string) {
    setIsLoading(true)
    setError(null)

    const { data, error: authError } = await registerWithEmail(email, password, fullName)

    if (authError) {
      setError(mapAuthError(authError.message))
      setIsLoading(false)
      return { success: false }
    }

    // identities vuoto = email già registrata ma non ancora confermata.
    // Supabase non restituisce errore esplicito in questo caso.
    if (data.user && data.user.identities?.length === 0) {
      setError('Esiste già un account con questa email.')
      setIsLoading(false)
      return { success: false }
    }

    setEmailSent(true)
    setIsLoading(false)
    return { success: true }
  }

  return { register, isLoading, error, emailSent, clearError: () => setError(null) }
}

// ------------------------------------------------------------
// useOAuth
// ------------------------------------------------------------

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithGoogle() {
    setIsLoading(true)
    setError(null)

    const { error: authError } = await loginWithGoogle()

    if (authError) {
      setError(mapAuthError(authError.message))
      setIsLoading(false)
      return { success: false }
    }

    // Il browser viene rediretto a Google — isLoading rimane true
    // intenzionalmente finché la pagina non viene abbandonata.
    return { success: true }
  }

  return { signInWithGoogle, isLoading, error }
}

// ------------------------------------------------------------
// useLogout
// ------------------------------------------------------------

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const reset = useAuthStore((s) => s.reset)
  const queryClient = useQueryClient()

  async function handleLogout() {
    setIsLoading(true)

    await logout()

    // Pulisce store e cache React Query prima del navigate,
    // per lo stesso motivo di useLogin: evitare aggiornamenti
    // di stato su componenti già smontati.
    reset()
    queryClient.clear()
    setIsLoading(false)
    navigate('/login', { replace: true })
  }

  return { logout: handleLogout, isLoading }
}

// ------------------------------------------------------------
// useDeleteAccount
// ------------------------------------------------------------

export function useDeleteAccount() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const reset = useAuthStore((s) => s.reset)
  const queryClient = useQueryClient()

  async function handleDeleteAccount(userId: string) {
    setIsLoading(true)
    setError(null)

    const { error: deleteError } = await deleteAccount(userId)

    if (deleteError) {
      setError(deleteError)
      setIsLoading(false)
      return { success: false }
    }

    // L'utente non esiste più lato server: chiude la sessione locale,
    // pulisce store e cache, poi torna al login. Stesso ordine di useLogout.
    await logout()
    reset()
    queryClient.clear()
    setIsLoading(false)
    navigate('/login', { replace: true })
    return { success: true }
  }

  return { deleteAccount: handleDeleteAccount, isLoading, error, clearError: () => setError(null) }
}
