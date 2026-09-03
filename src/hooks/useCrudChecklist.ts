import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  createChecklistItem,
  createChecklistItemsBatch,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from '@/services/checklistService'
import { useAuth } from '@/hooks/useAuth'
import type { ChecklistItem } from '@/types'

// ============================================================
// ROAMLY — useCrudChecklist
// Mutations per la checklist.
//
// Toggle: aggiornamento ottimistico — stesso pattern di useTogglePreferito.
// Batch:  un solo insert multiplo + una sola invalidazione.
// ============================================================

// ------------------------------------------------------------
// useCreateChecklistItem — singolo item
// ------------------------------------------------------------

export function useCreateChecklistItem(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ testo, ordine }: { testo: string; ordine: number }) => {
      if (!user) throw new Error('Utente non autenticato')
      return createChecklistItem(user.id, viaggioId, testo, ordine)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiungere il punto. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })
    },
    onError: () => {
      setError('Impossibile aggiungere il punto. Riprova.')
    },
  })

  return {
    createItem: mutation.mutate,
    isLoading:  mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useCreateChecklistItemsBatch — insert multiplo (suggerimenti)
// Una sola chiamata Supabase, una sola invalidazione React Query.
// ------------------------------------------------------------

export function useCreateChecklistItemsBatch(viaggioId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({
      items,
      ordineBase,
    }: {
      items: { testo: string }[]
      ordineBase: number
    }) => {
      if (!user) throw new Error('Utente non autenticato')
      const payload = items.map((item, i) => ({
        testo:  item.testo,
        ordine: ordineBase + i,
      }))
      return createChecklistItemsBatch(user.id, viaggioId, payload)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile aggiungere i suggerimenti. Riprova.')
        return
      }
      setError(null)
      // Una sola invalidazione per tutti gli item aggiunti
      queryClient.invalidateQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })
    },
    onError: () => {
      setError('Impossibile aggiungere i suggerimenti. Riprova.')
    },
  })

  return {
    createBatch: mutation.mutate,
    isLoading:   mutation.isPending,
    error,
    clearError:  () => setError(null),
  }
}

// ------------------------------------------------------------
// useToggleChecklistItem — aggiornamento ottimistico
// Inverte `completato` immediatamente in cache, rollback su errore.
// ------------------------------------------------------------

export function useToggleChecklistItem(viaggioId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ itemId, valore }: { itemId: string; valore: boolean }) =>
      updateChecklistItem(itemId, { completato: valore }),

    onMutate: async ({ itemId, valore }) => {
      // Cancella refetch in volo per evitare sovrascritture
      await queryClient.cancelQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })

      // Snapshot per rollback
      const snapshot = queryClient.getQueryData<ChecklistItem[]>(
        queryKeys.checklist.byViaggio(viaggioId)
      )

      // Aggiornamento ottimistico
      queryClient.setQueryData<ChecklistItem[]>(
        queryKeys.checklist.byViaggio(viaggioId),
        (old) => old?.map((item) =>
          item.id === itemId ? { ...item, completato: valore } : item
        )
      )

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      // Rollback snapshot → ripristina lo stato pre-ottimistico
      if (context?.snapshot) {
        queryClient.setQueryData(
          queryKeys.checklist.byViaggio(viaggioId),
          context.snapshot
        )
      }
    },

    // onSettled: garantisce la sincronizzazione finale con il DB
    // in TUTTI i casi — successo, errore di rete, errori applicativi.
    // Scatta dopo onSuccess e dopo onError.
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })
    },
  })

  return {
    toggle: (itemId: string, completatoCorrente: boolean) =>
      mutation.mutate({ itemId, valore: !completatoCorrente }),
    isLoading: mutation.isPending,
  }
}

// ------------------------------------------------------------
// useDeleteChecklistItem
// ------------------------------------------------------------

export function useDeleteChecklistItem(viaggioId: string) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (itemId: string) => deleteChecklistItem(itemId),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare il punto. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })
    },
    onError: () => {
      setError('Impossibile eliminare il punto. Riprova.')
    },
  })

  return {
    deleteItem: mutation.mutate,
    isLoading:  mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useReorderChecklist — drag-and-drop
// Aggiornamento ottimistico: la cache riflette subito il nuovo
// ordine (drag fluido), il salvataggio batch parte in background.
// Rollback allo snapshot precedente in caso di errore di rete.
// Stesso pattern di useToggleChecklistItem.
// ------------------------------------------------------------

export function useReorderChecklist(viaggioId: string) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (items: { id: string; ordine: number }[]) =>
      reorderChecklistItems(items),

    onMutate: async (items) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })

      const snapshot = queryClient.getQueryData<ChecklistItem[]>(
        queryKeys.checklist.byViaggio(viaggioId)
      )

      const nuovoOrdine = new Map(items.map((i) => [i.id, i.ordine]))
      queryClient.setQueryData<ChecklistItem[]>(
        queryKeys.checklist.byViaggio(viaggioId),
        (old) =>
          old
            ?.map((item) => ({
              ...item,
              ordine: nuovoOrdine.get(item.id) ?? item.ordine,
            }))
            .sort((a, b) => a.ordine - b.ordine)
      )

      return { snapshot }
    },

    onSuccess: (result) => {
      if (result.error) setError('Impossibile salvare il nuovo ordine.')
      else setError(null)
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(
          queryKeys.checklist.byViaggio(viaggioId),
          context.snapshot
        )
      }
      setError('Impossibile salvare il nuovo ordine.')
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.checklist.byViaggio(viaggioId),
      })
    },
  })

  return {
    reorder: (items: { id: string; ordine: number }[]) => mutation.mutate(items),
    error,
  }
}
