import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'
import {
  getNote,
  createNota,
  updateNota,
  deleteNota,
} from '@/services/noteViaggioService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useNoteViaggio
// Query + mutations per note_viaggio. A differenza di Prenotazioni
// e Tappe, non naviga: le note si aggiungono/modificano/eliminano
// tutte sulla stessa pagina (NoteViaggioPage), niente form dedicato.
// ============================================================

export function useNoteViaggio(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.noteViaggio.byViaggio(viaggioId ?? ''),
    queryFn: () => getNote(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}

export function useCreateNota(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (contenuto: string) => {
      if (!user) throw new Error('Utente non autenticato')
      return createNota(user.id, { viaggio_id: viaggioId, contenuto })
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare la nota. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.noteViaggio.byViaggio(viaggioId) })
    },
    onError: () => setError('Impossibile salvare la nota. Riprova.'),
  })

  return {
    createNota: (contenuto: string) => mutation.mutate(contenuto),
    isLoading: mutation.isPending,
    error,
  }
}

export function useUpdateNota(viaggioId: string) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ id, contenuto }: { id: string; contenuto: string }) =>
      updateNota(id, contenuto),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiornare la nota. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.noteViaggio.byViaggio(viaggioId) })
    },
    onError: () => setError('Impossibile aggiornare la nota. Riprova.'),
  })

  return {
    updateNota: (id: string, contenuto: string) => mutation.mutate({ id, contenuto }),
    isLoading: mutation.isPending,
    error,
  }
}

export function useDeleteNota(viaggioId: string) {
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (id: string) => deleteNota(id),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare la nota. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.noteViaggio.byViaggio(viaggioId) })
      showSuccess('Nota eliminata')
    },
    onError: () => setError('Impossibile eliminare la nota. Riprova.'),
  })

  return {
    deleteNota: (id: string) => mutation.mutate(id),
    isLoading: mutation.isPending,
    error,
  }
}
