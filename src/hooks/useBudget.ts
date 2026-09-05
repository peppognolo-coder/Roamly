import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'
import {
  getBudgetVoci,
  createBudgetVoce,
  updateBudgetVoce,
  deleteBudgetVoce,
} from '@/services/budgetService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovaBudgetVoce, ModificaBudgetVoce } from '@/types'

// ============================================================
// ROAMLY — useBudget
// Query + mutations per budget_voci (split spese).
// ============================================================

export function useBudgetVoci(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.budget.byViaggio(viaggioId ?? ''),
    queryFn: () => getBudgetVoci(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}

export function useCreateBudgetVoce(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: NuovaBudgetVoce) => {
      if (!user) throw new Error('Utente non autenticato')
      return createBudgetVoce(user.id, payload)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare la spesa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.byViaggio(viaggioId) })
      showSuccess('Spesa aggiunta')
      navigate(`/viaggi/${viaggioId}/budget`, { replace: true })
    },
    onError: () => setError('Impossibile salvare la spesa. Riprova.'),
  })

  return {
    createBudgetVoce: (payload: NuovaBudgetVoce) => mutation.mutate(payload),
    isLoading: mutation.isPending,
    error,
  }
}

export function useUpdateBudgetVoce(viaggioId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModificaBudgetVoce }) =>
      updateBudgetVoce(id, payload),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiornare la spesa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.byViaggio(viaggioId) })
      showSuccess('Spesa aggiornata')
      navigate(`/viaggi/${viaggioId}/budget`, { replace: true })
    },
    onError: () => setError('Impossibile aggiornare la spesa. Riprova.'),
  })

  return {
    updateBudgetVoce: (id: string, payload: ModificaBudgetVoce) =>
      mutation.mutate({ id, payload }),
    isLoading: mutation.isPending,
    error,
  }
}

export function useDeleteBudgetVoce(viaggioId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (id: string) => deleteBudgetVoce(id),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare la spesa. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.byViaggio(viaggioId) })
      showSuccess('Spesa eliminata')
      navigate(`/viaggi/${viaggioId}/budget`, { replace: true })
    },
    onError: () => setError('Impossibile eliminare la spesa. Riprova.'),
  })

  return {
    deleteBudgetVoce: (id: string) => mutation.mutate(id),
    isLoading: mutation.isPending,
    error,
  }
}
