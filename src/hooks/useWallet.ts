import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { getDocumentiConUrl, uploadDocumento, deleteDocumento } from '@/services/walletService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { DocumentoWallet, NuovoDocumentoWallet } from '@/types'

// ============================================================
// ROAMLY — useWallet
// Mirror di useLuoghiSalvati (stesso pattern globale/per-viaggio),
// con gli errori delle mutation sempre esposti via toast — niente
// stato locale "error" mai letto da nessuno (vedi il bug del
// pulsante "Segna come saldato" in useBudget: una mutation che
// fallisce in silenzio è peggio di nessuna mutation).
// ============================================================

export function useDocumentiWallet(viaggioId?: string) {
  const { user } = useAuth()
  const queryKey = viaggioId ? queryKeys.wallet.byViaggio(viaggioId) : queryKeys.wallet.mie

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getDocumentiConUrl(viaggioId)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  return {
    documenti: query.data ?? [],
    isLoading: query.isLoading,
  }
}

export function useUploadDocumento() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const mutation = useMutation({
    mutationFn: async ({ file, payload }: {
      file: File
      payload: Omit<NuovoDocumentoWallet, 'path' | 'mime_type' | 'size_bytes'>
    }) => {
      if (!user) throw new Error('Utente non autenticato')
      const { data, error } = await uploadDocumento(user.id, file, payload)
      if (error) throw new Error(error)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.mie })
      if (variables.payload.viaggio_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.byViaggio(variables.payload.viaggio_id) })
      }
      showSuccess('Documento caricato')
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Caricamento fallito. Riprova.')
    },
  })

  return {
    uploadDocumento: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  }
}

export function useDeleteDocumento(viaggioId?: string) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const mutation = useMutation({
    mutationFn: async (doc: DocumentoWallet) => {
      const { error } = await deleteDocumento(doc)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.mie })
      if (viaggioId) queryClient.invalidateQueries({ queryKey: queryKeys.wallet.byViaggio(viaggioId) })
      showSuccess('Documento eliminato')
    },
    onError: (err) => {
      showError(err instanceof Error ? err.message : 'Eliminazione fallita. Riprova.')
    },
  })

  return {
    deleteDocumento: mutation.mutate,
    isLoading: mutation.isPending,
  }
}
