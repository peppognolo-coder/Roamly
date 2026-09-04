import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import { getProfilo, aggiornaProfilo, uploadAvatar, type AggiornamentoProfilo } from '@/services/profiloService'
import { useAuth } from '@/hooks/useAuth'
import { useCompletaAzione } from '@/hooks/useCrediti'

// ============================================================
// ROAMLY — useProfilo
// Hook React Query per il profilo dell'utente corrente.
// ============================================================

// ------------------------------------------------------------
// useProfilo — lettura
// ------------------------------------------------------------

export function useProfilo() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.profilo.detail(user?.id ?? ''),
    queryFn: () => getProfilo(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minuti — il profilo cambia raramente
    select: (result) => result.data,
  })
}

// ------------------------------------------------------------
// useAggiornaProfilo — mutation con invalidazione automatica
// ------------------------------------------------------------

export function useAggiornaProfilo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { showSuccess } = useToast()

  return useMutation({
    mutationFn: (payload: AggiornamentoProfilo) => {
      if (!user) throw new Error('Utente non autenticato')
      return aggiornaProfilo(user.id, payload)
    },
    onSuccess: () => {
      if (!user) return
      // Invalida la query del profilo → refetch automatico
      showSuccess('Profilo aggiornato')
      queryClient.invalidateQueries({
        queryKey: queryKeys.profilo.detail(user.id),
      })
    },
  })
}

// ------------------------------------------------------------
// Compressione lato client prima dell'upload — stesso principio
// di useFoto.ts: resize su canvas, l'avatar non deve mai superare
// 512px lato lungo (è mostrato sempre piccolo, non serve di più).
// ------------------------------------------------------------

async function comprimiAvatar(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 512
      let { width, height } = img
      if (width > height && width > MAX) {
        height = Math.round((height * MAX) / width)
        width = MAX
      } else if (height > MAX) {
        width = Math.round((width * MAX) / height)
        height = MAX
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas non disponibile'))
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compressione fallita'))
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Immagine non valida'))
    }
    img.src = url
  })
}

// ------------------------------------------------------------
// useUploadAvatar — comprimi → upload → salva avatar_url sul profilo
// ------------------------------------------------------------

export function useUploadAvatar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()
  const { completaAzione: registraCredito } = useCompletaAzione()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    if (!user) return
    setIsLoading(true)
    setError(null)

    try {
      const fileOttimizzato = await comprimiAvatar(file)
      const { url, error: uploadError } = await uploadAvatar(user.id, fileOttimizzato)

      if (uploadError || !url) {
        setError('Impossibile caricare la foto. Riprova.')
        return
      }

      const { error: saveError } = await aggiornaProfilo(user.id, { avatar_url: url })
      if (saveError) {
        setError('Foto caricata ma non salvata sul profilo. Riprova.')
        return
      }

      showSuccess('Foto profilo aggiornata')
      registraCredito('foto_profilo')
      queryClient.invalidateQueries({ queryKey: queryKeys.profilo.detail(user.id) })
    } catch {
      setError('Impossibile elaborare l\'immagine. Riprova con un\'altra foto.')
    } finally {
      setIsLoading(false)
    }
  }

  return { uploadAvatar: upload, isLoading, error }
}
