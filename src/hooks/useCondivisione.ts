import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import {
  getCondivisione, attivaCondivisione, disattivaCondivisione, rigeneraLink,
  impostaRicordoNascosto, getViaggioPubblico, getFotoPubbliche,
} from '@/services/condivisioneService'

// ============================================================
// ROAMLY — useCondivisione
// ============================================================

export function useCondivisione(viaggioId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.condivisione.byViaggio(viaggioId ?? ''),
    queryFn: () => getCondivisione(viaggioId as string),
    select: (r) => r.data,
    enabled: !!viaggioId && enabled,
  })
}

export function useCondivisioneAzioni(viaggioId: string) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { showError } = useToast()

  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.condivisione.byViaggio(viaggioId) })
  const onResult = (r: { error: string | null }) => {
    if (r.error) showError('Operazione non riuscita. Riprova.')
    else refresh()
  }

  const attiva = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('Utente non autenticato')
      return attivaCondivisione(viaggioId, user.id)
    },
    onSuccess: onResult,
  })
  const disattiva = useMutation({ mutationFn: () => disattivaCondivisione(viaggioId), onSuccess: onResult })
  const rigenera = useMutation({ mutationFn: () => rigeneraLink(viaggioId), onSuccess: onResult })

  const nascondi = useMutation({
    mutationFn: ({ ricordoId, nascosto }: { ricordoId: string; nascosto: boolean }) =>
      impostaRicordoNascosto(ricordoId, nascosto),
    onSuccess: (r) => {
      if (r.error) showError('Non puoi modificare questo ricordo.')
      else qc.invalidateQueries({ queryKey: queryKeys.ricordi.byViaggio(viaggioId) })
    },
  })

  return { attiva, disattiva, rigenera, nascondi }
}

export function useViaggioPubblico(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.condivisione.pubblico(token ?? ''),
    queryFn: async () => {
      const r = await getViaggioPubblico(token as string)
      if (r.error) throw new Error(r.error)
      if (!r.data) return null
      const paths = r.data.ricordi.flatMap((x) => x.foto)
      const foto = await getFotoPubbliche(paths)
      return { ...r.data, urlFoto: foto }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 20, // gli URL firmati durano 1 ora
    refetchOnWindowFocus: false,
    retry: false,
  })
}
