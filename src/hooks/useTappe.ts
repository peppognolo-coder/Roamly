import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'
import {
  getTappe,
  createTappa,
  updateTappa,
  deleteTappa,
} from '@/services/tappeService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovaTappaViaggio, ModificaTappaViaggio } from '@/types'

// ============================================================
// ROAMLY — useTappe
// Query + mutations per tappe_viaggio. Alimenta sia Itinerario
// (vista per giorno) sia Attività (vista mappa) — stesso dato.
// ============================================================

export function useTappe(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tappe.byViaggio(viaggioId ?? ''),
    queryFn: () => getTappe(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}

export function useCreateTappa(viaggioId: string, redirectTo: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: NuovaTappaViaggio) => {
      if (!user) throw new Error('Utente non autenticato')
      return createTappa(user.id, payload)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare la tappa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.tappe.byViaggio(viaggioId) })
      showSuccess('Tappa aggiunta')
      navigate(redirectTo)
    },
    onError: () => setError('Impossibile salvare la tappa. Riprova.'),
  })

  return {
    createTappa: (payload: NuovaTappaViaggio) => mutation.mutate(payload),
    isLoading: mutation.isPending,
    error,
  }
}

export function useUpdateTappa(viaggioId: string, redirectTo: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModificaTappaViaggio }) =>
      updateTappa(id, payload),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiornare la tappa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.tappe.byViaggio(viaggioId) })
      showSuccess('Tappa aggiornata')
      navigate(redirectTo)
    },
    onError: () => setError('Impossibile aggiornare la tappa. Riprova.'),
  })

  return {
    updateTappa: (id: string, payload: ModificaTappaViaggio) =>
      mutation.mutate({ id, payload }),
    isLoading: mutation.isPending,
    error,
  }
}

export function useDeleteTappa(viaggioId: string, redirectTo: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (id: string) => deleteTappa(id),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare la tappa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.tappe.byViaggio(viaggioId) })
      showSuccess('Tappa eliminata')
      navigate(redirectTo)
    },
    onError: () => setError('Impossibile eliminare la tappa. Riprova.'),
  })

  return {
    deleteTappa: (id: string) => mutation.mutate(id),
    isLoading: mutation.isPending,
    error,
  }
}
