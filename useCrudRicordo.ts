import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import {
  createRicordo,
  updateRicordo,
  deleteRicordo,
  togglePreferito,
} from '@/services/ricordiService'
import { useAuth } from '@/hooks/useAuth'
import type { NuovoRicordo, ModificaRicordo, Ricordo } from '@/types'

// ============================================================
// ROAMLY — useCrudRicordo
// Mutations per create, update, delete, togglePreferito.
//
// Regola invalidazioni:
//   create  → byViaggio + statistiche + recenti
//   update  → byViaggio + detail + recenti          ← 🔴 fix: aggiunto recenti
//   delete  → byViaggio + statistiche + recenti + removeDetail
//   toggle  → ottimistico su byViaggio + detail; poi statistiche
//
// Regola viaggioId opzionale:
//   useUpdateRicordo, useDeleteRicordo, useTogglePreferito
//   accettano viaggioId?: string.
//   Le invalidazioni che dipendono da viaggioId vengono eseguite
//   solo se viaggioId è una stringa non vuota — mai queryKey orfane.
// ============================================================

// ------------------------------------------------------------
// useCreateRicordo
// ------------------------------------------------------------

export function useCreateRicordo(
  opzioni?: {
    /** Callback chiamata dopo la creazione riuscita — riceve il ricordo creato.
     *  Usata da NuovoRicordoPage per caricare le foto pre-selezionate. */
    onCreato?: (ricordoId: string, viaggioId: string) => void
    /** Se true, non naviga automaticamente dopo la creazione. */
    skipNavigate?: boolean
  }
) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (payload: NuovoRicordo) => {
      if (!user) throw new Error('Utente non autenticato')
      return createRicordo(user.id, payload)
    },
    onSuccess: (result, payload) => {
      if (result.error) {
        setError('Impossibile salvare il ricordo. Riprova.')
        return
      }

      setError(null)
      showSuccess('Ricordo salvato')

      queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.byViaggio(payload.viaggio_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.statistiche(payload.viaggio_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.recenti(user!.id) })
      // Invalida statistiche utente globali (Sprint 5 — Quick Stats Home)
      queryClient.invalidateQueries({ queryKey: queryKeys.statistiche.utente(user!.id) })

      // Callback post-creazione (es. NuovoRicordoPage → upload foto pre-selezionate)
      if (opzioni?.onCreato && result.data) {
        opzioni.onCreato(result.data.id, payload.viaggio_id)
      }

      if (!opzioni?.skipNavigate) {
        navigate(`/viaggi/${payload.viaggio_id}`)
      }
    },
    onError: () => {
      setError('Impossibile salvare il ricordo. Riprova.')
    },
  })

  return {
    createRicordo: mutation.mutate,
    isLoading:     mutation.isPending,
    error,
    clearError:    () => setError(null),
  }
}

// ------------------------------------------------------------
// useUpdateRicordo
// viaggioId è opzionale: le invalidazioni dipendenti vengono
// eseguite solo se valorizzato.
// ------------------------------------------------------------

export function useUpdateRicordo(ricordoId: string, viaggioId?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (payload: ModificaRicordo) => updateRicordo(ricordoId, payload),
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile salvare le modifiche. Riprova.')
        return
      }

      setError(null)
      showSuccess('Modifiche salvate')

      // Invalida sempre il detail del ricordo modificato
      queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.detail(ricordoId) })

      // Invalida la lista del viaggio solo se viaggioId è noto
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.byViaggio(viaggioId) })
      }

      // Invalida ricordi recenti: Sprint 5 (Home + B45) non deve vedere dati obsoleti
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.recenti(user.id) })
      }
    },
    onError: () => {
      setError('Impossibile salvare le modifiche. Riprova.')
    },
  })

  return {
    updateRicordo: mutation.mutate,
    isLoading:     mutation.isPending,
    isSuccess:     mutation.isSuccess && !error,
    error,
    clearError:    () => setError(null),
  }
}

// ------------------------------------------------------------
// useDeleteRicordo
// viaggioId è opzionale: le invalidazioni e la navigazione
// dipendenti vengono eseguite solo se valorizzato.
// ------------------------------------------------------------

export function useDeleteRicordo(viaggioId?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (ricordoId: string) => deleteRicordo(ricordoId, user!.id),
    onSuccess: (result, ricordoId) => {
      if (result.error) {
        setError('Impossibile eliminare il ricordo. Riprova.')
        return
      }

      // Rimuove il detail dalla cache prima del navigate
      queryClient.removeQueries({ queryKey: queryKeys.ricordi.detail(ricordoId) })

      // Invalida dipendenti da viaggioId solo se noto
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.byViaggio(viaggioId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.statistiche(viaggioId) })
      }

      // Invalida recenti e statistiche utente globali (Sprint 5 — Home)
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.recenti(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.statistiche.utente(user.id) })
      }

      setError(null)
      showSuccess('Ricordo eliminato')

      // Naviga al viaggio se noto, altrimenti alla home
      navigate(viaggioId ? `/viaggi/${viaggioId}` : '/', { replace: true })
    },
    onError: () => {
      setError('Impossibile eliminare il ricordo. Riprova.')
    },
  })

  return {
    deleteRicordo: mutation.mutate,
    isLoading:     mutation.isPending,
    error,
    clearError:    () => setError(null),
  }
}

// ------------------------------------------------------------
// useTogglePreferito — aggiornamento ottimistico
// viaggioId è opzionale: le operazioni sulla lista byViaggio
// vengono eseguite solo se valorizzato, mai con stringa vuota.
// ------------------------------------------------------------

export function useTogglePreferito(viaggioId?: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ ricordoId, valore }: { ricordoId: string; valore: boolean }) =>
      togglePreferito(ricordoId, valore),

    onMutate: async ({ ricordoId, valore }) => {
      // Cancella refetch in volo per byViaggio (se noto) e detail
      if (viaggioId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.ricordi.byViaggio(viaggioId) })
      }
      await queryClient.cancelQueries({ queryKey: queryKeys.ricordi.detail(ricordoId) })

      // Snapshot della lista per rollback
      const snapshotLista = viaggioId
        ? queryClient.getQueryData<Ricordo[]>(queryKeys.ricordi.byViaggio(viaggioId))
        : undefined

      // Snapshot del detail per rollback
      const snapshotDetail = queryClient.getQueryData<Ricordo>(
        queryKeys.ricordi.detail(ricordoId)
      )

      // Aggiornamento ottimistico lista
      if (viaggioId) {
        queryClient.setQueryData<Ricordo[]>(
          queryKeys.ricordi.byViaggio(viaggioId),
          (old) => old?.map((r) => r.id === ricordoId ? { ...r, preferito: valore } : r)
        )
      }

      // Aggiornamento ottimistico detail
      queryClient.setQueryData<Ricordo>(
        queryKeys.ricordi.detail(ricordoId),
        (old) => old ? { ...old, preferito: valore } : old
      )

      return { snapshotLista, snapshotDetail }
    },

    onError: (_err, { ricordoId }, context) => {
      // Rollback lista
      if (viaggioId && context?.snapshotLista) {
        queryClient.setQueryData(queryKeys.ricordi.byViaggio(viaggioId), context.snapshotLista)
      }
      // Rollback detail
      if (context?.snapshotDetail) {
        queryClient.setQueryData(queryKeys.ricordi.detail(ricordoId), context.snapshotDetail)
      }

      // Forza refetch per allineare con il DB
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.byViaggio(viaggioId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.detail(ricordoId) })
    },

    onSuccess: (_result, { ricordoId }) => {
      // Invalida statistiche (contatore preferiti) e detail per sicurezza
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.statistiche(viaggioId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.ricordi.detail(ricordoId) })
    },
  })

  return {
    toggle: (ricordoId: string, valoreCorrente: boolean) =>
      mutation.mutate({ ricordoId, valore: !valoreCorrente }),
    isLoading: mutation.isPending,
  }
}
