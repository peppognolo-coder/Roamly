import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'
import {
  getPrenotazioni,
  createPrenotazione,
  updatePrenotazione,
  deletePrenotazione,
} from '@/services/prenotazioniService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovaPrenotazione, ModificaPrenotazione } from '@/types'

// ============================================================
// ROAMLY — usePrenotazioni
// Query + mutations per la tabella wallet (Prenotazioni).
// Stesso pattern di useCrudViaggio: navigazione + toast dentro
// l'hook onSuccess, non nel componente chiamante.
// ============================================================

export function usePrenotazioni(viaggioId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.prenotazioni.byViaggio(viaggioId ?? ''),
    queryFn: () => getPrenotazioni(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId && enabled,
  })
}

export function useCreatePrenotazione(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: NuovaPrenotazione) => {
      if (!user) throw new Error('Utente non autenticato')
      return createPrenotazione(user.id, payload)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare la prenotazione. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.prenotazioni.byViaggio(viaggioId) })
      showSuccess('Prenotazione aggiunta')
      // replace: evita che il back-button dopo il salvataggio
      // riporti al form invece che alla lista
      navigate(`/viaggi/${viaggioId}/prenotazioni`, { replace: true })
    },
    onError: () => setError('Impossibile salvare la prenotazione. Riprova.'),
  })

  return {
    createPrenotazione: (payload: NuovaPrenotazione) => mutation.mutate(payload),
    isLoading: mutation.isPending,
    error,
  }
}

export function useUpdatePrenotazione(viaggioId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModificaPrenotazione }) =>
      updatePrenotazione(id, payload),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiornare la prenotazione. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.prenotazioni.byViaggio(viaggioId) })
      showSuccess('Prenotazione aggiornata')
      navigate(`/viaggi/${viaggioId}/prenotazioni`, { replace: true })
    },
    onError: () => setError('Impossibile aggiornare la prenotazione. Riprova.'),
  })

  return {
    updatePrenotazione: (id: string, payload: ModificaPrenotazione) =>
      mutation.mutate({ id, payload }),
    isLoading: mutation.isPending,
    error,
  }
}

export function useDeletePrenotazione(viaggioId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (id: string) => deletePrenotazione(id),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare la prenotazione. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.prenotazioni.byViaggio(viaggioId) })
      showSuccess('Prenotazione eliminata')
      navigate(`/viaggi/${viaggioId}/prenotazioni`, { replace: true })
    },
    onError: () => setError('Impossibile eliminare la prenotazione. Riprova.'),
  })

  return {
    deletePrenotazione: (id: string) => mutation.mutate(id),
    isLoading: mutation.isPending,
    error,
  }
}
