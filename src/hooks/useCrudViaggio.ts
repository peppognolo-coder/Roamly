import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import {
  createViaggio,
  updateViaggio,
  deleteViaggio,
} from '@/services/viaggiService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovoViaggio, ModificaViaggio } from '@/types'

// ============================================================
// ROAMLY — useCrudViaggio
// Mutations per create, update, delete dei viaggi.
// Ogni mutation invalida le query corrette per mantenere
// la UI sincronizzata senza reload manuale.
// ============================================================

// ------------------------------------------------------------
// useCreateViaggio
// ------------------------------------------------------------

export function useCreateViaggio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (payload: NuovoViaggio) => {
      if (!user) throw new Error('Utente non autenticato')
      return createViaggio(user.id, payload)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile creare il viaggio. Riprova.')
        return
      }

      // Invalida la lista → refetch automatico
      queryClient.invalidateQueries({
        queryKey: queryKeys.viaggi.list(user!.id),
      })

      // Naviga al dettaglio del viaggio appena creato
      if (result.data) {
        setError(null)
        showSuccess('Viaggio creato')
        navigate(`/viaggi/${result.data.id}`)
      }
    },
    onError: () => {
      setError('Impossibile creare il viaggio. Riprova.')
    },
  })

  return {
    createViaggio: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useUpdateViaggio
// ------------------------------------------------------------

export function useUpdateViaggio(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (payload: ModificaViaggio) =>
      updateViaggio(viaggioId, payload),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare le modifiche. Riprova.')
        return
      }

      setError(null)
      showSuccess('Modifiche salvate')

      // Invalida lista e detail — refetch automatico
      queryClient.invalidateQueries({
        queryKey: queryKeys.viaggi.list(user!.id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.viaggi.detail(viaggioId),
      })
    },
    onError: () => {
      setError('Impossibile salvare le modifiche. Riprova.')
    },
  })

  return {
    updateViaggio: mutation.mutate,
    isLoading:     mutation.isPending,
    // isSuccess è true solo nel ciclo di render immediatamente successivo
    // alla mutation completata — React Query lo gestisce senza timer
    isSuccess:     mutation.isSuccess && !error,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useDeleteViaggio
// ------------------------------------------------------------

export function useDeleteViaggio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (viaggioId: string) => deleteViaggio(viaggioId),
    onSuccess: (result, viaggioId) => {
      if (result.error) {
        setError('Impossibile eliminare il viaggio. Riprova.')
        return
      }

      // Rimuove il detail dalla cache prima del navigate per evitare
      // flash del dato eliminato se si torna indietro
      queryClient.removeQueries({
        queryKey: queryKeys.viaggi.detail(viaggioId),
      })

      // Invalida la lista
      queryClient.invalidateQueries({
        queryKey: queryKeys.viaggi.list(user!.id),
      })

      setError(null)
      showSuccess('Viaggio eliminato')
      navigate('/viaggi', { replace: true })
    },
    onError: () => {
      setError('Impossibile eliminare il viaggio. Riprova.')
    },
  })

  return {
    deleteViaggio: mutation.mutate,
    isLoading: mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
