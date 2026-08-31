import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useToast } from '@/hooks/useToast'
import { getMioRuolo, getMembriViaggio, rimuoviMembro } from '@/services/membriService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useMembri
// ============================================================

export function useMioRuolo(viaggioId: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.membri.mioRuolo(viaggioId ?? '', user?.id ?? ''),
    queryFn: () => getMioRuolo(viaggioId as string, user!.id),
    select: (result) => result.ruolo,
    enabled: !!viaggioId && !!user,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMembriViaggio(viaggioId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.membri.byViaggio(viaggioId ?? ''),
    queryFn: () => getMembriViaggio(viaggioId as string),
    select: (result) => result.data,
    enabled: !!viaggioId,
  })
}

// ------------------------------------------------------------
// useRimuoviMembro — rimuove un collaboratore (proprietario) o
// se stessi (esci dal viaggio). `tornaAllaHome` true solo quando
// esci tu stesso — altrimenti resti sulla pagina membri.
// ------------------------------------------------------------

export function useRimuoviMembro(viaggioId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ userId }: { userId: string; tornaAllaHome?: boolean }) =>
      rimuoviMembro(viaggioId, userId),
    onSuccess: (result, variables) => {
      if (result.error) {
        setError('Impossibile completare l\'operazione. Riprova.')
        showError('Impossibile completare l\'operazione. Riprova.')
        return
      }
      setError(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.membri.byViaggio(viaggioId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.all })

      if (variables.tornaAllaHome) {
        showSuccess('Hai lasciato il viaggio')
        navigate('/', { replace: true })
      } else {
        showSuccess('Membro rimosso')
      }
    },
  })

  return {
    rimuovi: (userId: string, tornaAllaHome = false) =>
      mutation.mutate({ userId, tornaAllaHome }),
    isLoading: mutation.isPending,
    error,
  }
}
