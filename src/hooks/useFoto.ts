import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys }               from '@/lib/queryKeys'
import { useAuth }                 from '@/hooks/useAuth'
import { useToast }                from '@/hooks/useToast'
import {
  getFotoConUrlByRicordo,
  getCoversByViaggio,
  getCoverViaggio,
  getFotoCountByViaggio,
  uploadFoto,
  deleteSingolaFoto,
  setCoverFoto,
  SIGNED_URL_TTL_SECONDS,
} from '@/services/fotoService'
import type { Foto, FotoConUrl } from '@/types'

// ============================================================
// ROAMLY — useFoto
// Hook React Query per foto con signed URL.
//
// SIGNED URL STRATEGY:
//   TTL Supabase:        3600s (1h)
//   staleTime RQ:        50min — refetch prima della scadenza
//   refetchOnWindowFocus: false — le URL non scadono in foreground
//   Il refetch automatico allo stale garantisce che l'utente
//   non veda mai una URL scaduta.
// ============================================================

const STALE_TIME_SIGNED_URL = (SIGNED_URL_TTL_SECONDS - 600) * 1000 // 50 minuti in ms

// ------------------------------------------------------------
// useFotoRicordo — foto con signed URL per RicordoDetailPage
// ------------------------------------------------------------

export function useFotoRicordo(ricordoId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.foto.byRicordo(ricordoId ?? ''),
    queryFn: async () => {
      const { data, error } = await getFotoConUrlByRicordo(ricordoId!)
      if (error) throw new Error(error)
      return data
    },
    enabled:             !!user && !!ricordoId,
    staleTime:           STALE_TIME_SIGNED_URL,
    refetchOnWindowFocus: false,
  })
}

// ------------------------------------------------------------
// useCoversByViaggio — mappa ricordoId→thumbnailUrl per un viaggio
// Strategia anti N+1: una sola query per tutti i ricordi del viaggio.
// Usata da ViaggioDetailPage in parallelo con useRicordi(viaggioId).
// ------------------------------------------------------------

export function useCoversByViaggio(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.foto.coversByViaggio(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getCoversByViaggio(viaggioId!)
      if (error) throw new Error(error)
      return data  // Map<ricordoId, thumbnailSignedUrl>
    },
    enabled:             !!user && !!viaggioId,
    staleTime:           STALE_TIME_SIGNED_URL,
    refetchOnWindowFocus: false,
  })
}

// ------------------------------------------------------------
// useUploadFoto — upload con compressione client-side e progress
// Compressione: canvas resize a max 1920px lato lungo, qualità 0.85.
// Formati accettati: image/jpeg, image/png, image/webp.
// Limite dimensione: 10MB sul file originale (pre-compressione).
// ------------------------------------------------------------

const FORMATI_ACCETTATI = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES    = 10 * 1024 * 1024   // 10 MB
const MAX_DIM_PX        = 1920
const QUALITA_JPEG      = 0.85

async function comprimi(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width <= MAX_DIM_PX && height <= MAX_DIM_PX) {
        // Nessuna riduzione necessaria — restituisce il file originale
        resolve(file)
        return
      }

      // Scala proporzionalmente mantenendo aspect ratio
      if (width > height) {
        height = Math.round(height * (MAX_DIM_PX / width))
        width  = MAX_DIM_PX
      } else {
        width  = Math.round(width * (MAX_DIM_PX / height))
        height = MAX_DIM_PX
      }

      const canvas  = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        QUALITA_JPEG
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossibile leggere l\'immagine'))
    }

    img.src = url
  })
}

export function useUploadFoto(ricordoId: string, ordineBase: number, viaggioId?: string) {
  const { user }        = useAuth()
  const queryClient     = useQueryClient()
  const [progress, setProgress] = useState(0)
  const [error, setError]       = useState<string | null>(null)

  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Utente non autenticato')

      // Validazione formato
      // HEIC (image/heic, image/heif) è il formato default degli iPhone
      // con impostazioni "Alta efficienza". iOS Safari può convertire
      // automaticamente in JPEG dalla galleria, ma non sempre.
      // Il messaggio distingue HEIC dagli altri formati non supportati
      // per ridurre la confusione degli utenti iPhone.
      if (!FORMATI_ACCETTATI.includes(file.type)) {
        const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
        throw new Error(
          isHeic
            ? "Questa foto sembra essere in formato HEIC. Converti l'immagine in JPEG oppure scegli una foto compatibile (JPEG, PNG, WebP)."
            : 'Formato non supportato. Usa JPEG, PNG o WebP.'
        )
      }

      setProgress(10)

      // Compressione/ridimensionamento client-side (max 1920px, qualità 0.85)
      // Il controllo dimensione avviene SUL FILE COMPRESSO —
      // evita di rifiutare foto della fotocamera che superano 10 MB in RAW
      // ma diventano <3 MB dopo la compressione.
      const fileOttimizzato = await comprimi(file)
      setProgress(30)

      // Validazione dimensione sul file compresso
      if (fileOttimizzato.size > MAX_SIZE_BYTES) {
        throw new Error('Il file supera il limite di 10 MB anche dopo la compressione.')
      }

      // Upload + registrazione DB
      const { data, error: uploadErr } = await uploadFoto(
        user.id,
        ricordoId,
        fileOttimizzato,
        ordineBase
      )
      setProgress(90)

      if (uploadErr || !data) throw new Error(uploadErr ?? 'Upload fallito')
      return data
    },
    onSuccess: () => {
      setProgress(100)
      setError(null)
      showSuccess('Foto caricata')
      // Invalida foto del ricordo
      queryClient.invalidateQueries({ queryKey: queryKeys.foto.byRicordo(ricordoId) })
      // Invalida la mappa cover del viaggio — neutro ora (is_cover sempre false nel MVP),
      // già corretto per Sprint 7.1 quando la prima foto diventerà cover automatica.
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coversByViaggio(viaggioId) })
      }
    },
    onError: (err: Error) => {
      setProgress(0)
      setError(err.message)
    },
    onSettled: () => {
      setTimeout(() => setProgress(0), 1500)
    },
  })

  const upload     = useCallback((file: File) => mutation.mutate(file),     [mutation])
  const uploadAsync = useCallback((file: File) => mutation.mutateAsync(file), [mutation])

  return {
    upload,
    uploadAsync,
    isLoading: mutation.isPending,
    progress,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useUploadFotoMultiplo — upload sequenziale di N file
// Ogni file viene compresso, validato e caricato in sequenza
// (non in parallelo) per evitare timeout e Rate Limit Supabase.
// Progress: 0-100 aggregato sull'intera lista.
// Al termine invalida byRicordo e coversByViaggio.
// ------------------------------------------------------------

export function useUploadFotoMultiplo(
  ricordoId: string,
  ordineBase: number,
  viaggioId?: string
) {
  const { user }    = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [isLoading, setIsLoading]       = useState(false)
  const [progress, setProgress]         = useState(0)       // 0-100 aggregato
  const [errori, setErrori]             = useState<string[]>([])
  const [completati, setCompletati]     = useState(0)

  const uploadMultipli = useCallback(async (files: File[]) => {
    if (!user || files.length === 0) return

    setIsLoading(true)
    setErrori([])
    setCompletati(0)
    setProgress(0)

    const erroriLocali: string[] = []
    let caricati = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Validazione formato
        if (!FORMATI_ACCETTATI.includes(file.type)) {
          const isHeic = file.type === 'image/heic' || file.type === 'image/heif'
          erroriLocali.push(
            isHeic
              ? `${file.name}: formato HEIC non supportato.`
              : `${file.name}: formato non supportato.`
          )
          continue
        }

        // Compressione
        const fileOttimizzato = await comprimi(file)

        // Controllo dimensione sul compresso
        if (fileOttimizzato.size > MAX_SIZE_BYTES) {
          erroriLocali.push(`${file.name}: supera il limite di 10 MB anche dopo la compressione.`)
          continue
        }

        // Upload
        const { data, error } = await uploadFoto(
          user.id,
          ricordoId,
          fileOttimizzato,
          ordineBase + i
        )

        if (error || !data) {
          erroriLocali.push(`${file.name}: caricamento fallito.`)
        } else {
          caricati++
        }
      } catch {
        erroriLocali.push(`${file.name}: errore imprevisto.`)
      }

      // Progress aggregato
      setProgress(Math.round(((i + 1) / files.length) * 100))
      setCompletati(caricati)
    }

    setErrori(erroriLocali)
    setIsLoading(false)

    if (caricati > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.foto.byRicordo(ricordoId) })
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coversByViaggio(viaggioId) })
      }
      const msg = caricati === files.length
        ? caricati === 1 ? 'Foto caricata' : `${caricati} foto caricate`
        : `${caricati} di \${files.length} foto caricate`
      showSuccess(msg)
    }

    if (erroriLocali.length > 0 && caricati === 0) {
      showError('Nessuna foto caricata. Controlla i file e riprova.')
    }

    setTimeout(() => setProgress(0), 1500)
  }, [user, ricordoId, ordineBase, viaggioId, queryClient, showSuccess, showError])

  // Variante per il flusso create → upload:
  // il ricordoId non è noto al mount — viene passato al momento della chiamata.
  const uploadMultipliConId = useCallback(async (files: File[], ricordoIdTarget: string) => {
    if (!user || files.length === 0) return

    setIsLoading(true)
    setErrori([])
    setCompletati(0)
    setProgress(0)

    const erroriLocali: string[] = []
    let caricati = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        if (!FORMATI_ACCETTATI.includes(file.type)) {
          erroriLocali.push(`${file.name}: formato non supportato.`)
          continue
        }
        const fileOttimizzato = await comprimi(file)
        if (fileOttimizzato.size > MAX_SIZE_BYTES) {
          erroriLocali.push(`${file.name}: supera il limite di 10 MB anche dopo la compressione.`)
          continue
        }
        const { data, error } = await uploadFoto(user.id, ricordoIdTarget, fileOttimizzato, ordineBase + i)
        if (error || !data) {
          erroriLocali.push(`${file.name}: caricamento fallito.`)
        } else {
          caricati++
        }
      } catch {
        erroriLocali.push(`${file.name}: errore imprevisto.`)
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
      setCompletati(caricati)
    }

    setErrori(erroriLocali)
    setIsLoading(false)

    if (caricati > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.foto.byRicordo(ricordoIdTarget) })
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coversByViaggio(viaggioId) })
      }
      const msg = caricati === files.length
        ? (caricati === 1 ? 'Foto caricata' : `${caricati} foto caricate`)
        : `${caricati} di ${files.length} foto caricate`
      showSuccess(msg)
    }
    setTimeout(() => setProgress(0), 1500)
  }, [user, ordineBase, viaggioId, queryClient, showSuccess])

  return {
    uploadMultipli,
    uploadMultipliConId,
    isLoading,
    progress,
    completati,
    errori,
  }
}

// ------------------------------------------------------------
// useDeleteFotoSingola — elimina una singola foto
// Invalida le query corrette dopo l'eliminazione.
// ------------------------------------------------------------

export function useDeleteFotoSingola(ricordoId: string, viaggioId?: string) {
  const { user }    = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (foto: Foto) => {
      if (!user) throw new Error('Utente non autenticato')
      return deleteSingolaFoto(foto)
    },
    onSuccess: (result) => {
      if (result.error) {
        setError('Impossibile eliminare la foto. Riprova.')
        return
      }
      setError(null)
      showSuccess('Foto eliminata')
      queryClient.invalidateQueries({ queryKey: queryKeys.foto.byRicordo(ricordoId) })
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coversByViaggio(viaggioId) })
      }
    },
    onError: () => {
      setError('Impossibile eliminare la foto. Riprova.')
    },
  })

  return {
    deleteFoto: mutation.mutate,
    isLoading:  mutation.isPending,
    error,
    clearError: () => setError(null),
  }
}

// ------------------------------------------------------------
// useCoverViaggio — cover visuale del viaggio (foto più recente is_cover=true)
// Usata in ViaggioDetailPage e ViaggioCard come fallback ricco rispetto all'emoji.
// ------------------------------------------------------------

export function useCoverViaggio(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.foto.coverViaggio(viaggioId ?? ''),
    queryFn: async () => {
      const { url, error } = await getCoverViaggio(viaggioId!)
      if (error) throw new Error(error)
      return url   // string | null
    },
    enabled:              !!user && !!viaggioId,
    staleTime:            STALE_TIME_SIGNED_URL,
    refetchOnWindowFocus: false,
  })
}

// ------------------------------------------------------------
// useSetCoverFoto — imposta una foto come cover del ricordo
// Aggiornamento ottimistico sulla cache byRicordo:
//   - azzera is_cover su tutte le foto del ricordo
//   - imposta is_cover=true sulla foto selezionata
// Invalida coversByViaggio e coverViaggio per aggiornare le liste.
// ------------------------------------------------------------

export function useSetCoverFoto(ricordoId: string, viaggioId?: string) {
  const { user }    = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (fotoId: string) => {
      if (!user) throw new Error('Utente non autenticato')
      return setCoverFoto(fotoId, ricordoId)
    },

    // Aggiornamento ottimistico sulla cache byRicordo
    onMutate: async (fotoId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.foto.byRicordo(ricordoId) })
      const snapshot = queryClient.getQueryData(queryKeys.foto.byRicordo(ricordoId))

      queryClient.setQueryData(
        queryKeys.foto.byRicordo(ricordoId),
        (old: FotoConUrl[] | undefined) =>
          old?.map((f) => ({ ...f, is_cover: f.id === fotoId }))
      )
      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(queryKeys.foto.byRicordo(ricordoId), context.snapshot)
      }
    },

    onSettled: () => {
      // Ricarica foto del ricordo per allinearsi al DB
      queryClient.invalidateQueries({ queryKey: queryKeys.foto.byRicordo(ricordoId) })
      // Aggiorna cover nelle RicordoCard della ViaggioDetailPage
      if (viaggioId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coversByViaggio(viaggioId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.foto.coverViaggio(viaggioId) })
      }
      showSuccess('Cover aggiornata')
    },
  })
}

// ------------------------------------------------------------
// useFotoCountByViaggio — conteggio foto per ricordo
// Usato nelle statistiche giorno del Diario Viaggio.
// ------------------------------------------------------------

export function useFotoCountByViaggio(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.foto.countByViaggio(viaggioId ?? ''),
    queryFn: async () => {
      const { data, error } = await getFotoCountByViaggio(viaggioId!)
      if (error) throw new Error(error)
      return data   // Map<ricordoId, number>
    },
    enabled:   !!user && !!viaggioId,
    staleTime: 1000 * 60 * 2,
  })
}
