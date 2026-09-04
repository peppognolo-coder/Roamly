import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import {
  getStoricoCrediti,
  completaAzione,
  ottieniCodiceReferral,
  redimiCodiceReferral,
} from '@/services/creditiService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

// ============================================================
// ROAMLY — useCrediti
// Il saldo corrente vive già in useProfilo() (select crediti da
// lì) — qui solo storico, missioni e referral.
// ============================================================

// ------------------------------------------------------------
// useStoricoCrediti
// ------------------------------------------------------------

export function useStoricoCrediti() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.crediti.storico(user?.id ?? ''),
    queryFn: () => getStoricoCrediti(user!.id),
    select: (result) => result.data,
    enabled: !!user,
  })
}

// ------------------------------------------------------------
// useCompletaAzione — "fire and forget": da chiamare subito dopo
// un'azione che vale una missione (foto profilo, primo viaggio).
// Nessun errore visibile all'utente se fallisce: è un bonus, non
// deve mai far sembrare fallita l'azione principale (upload foto,
// creazione viaggio) che l'ha scatenata.
// ------------------------------------------------------------

export function useCompletaAzione() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (azione: string) => completaAzione(azione),
    onSuccess: (result) => {
      if (result.error || !user) return
      if (result.crediti > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profilo.detail(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.crediti.storico(user.id) })
      }
    },
    onError: () => {
      // Silenzioso di proposito — vedi commento sopra.
    },
  })

  return { completaAzione: (azione: string) => mutation.mutate(azione) }
}

// ------------------------------------------------------------
// useCodiceReferral — legge (e crea al primo utilizzo) il codice
// dell'utente corrente, da mostrare/condividere.
// ------------------------------------------------------------

export function useCodiceReferral() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.crediti.referral(user?.id ?? ''),
    queryFn: () => ottieniCodiceReferral(),
    select: (result) => result.codice,
    enabled: !!user,
    staleTime: Infinity, // il codice di una persona non cambia mai
  })
}

// ------------------------------------------------------------
// useRedimiReferral — da chiamare una sola volta, quando esiste un
// codice referral "in sospeso" da una registrazione recente.
// ------------------------------------------------------------

export function useRedimiReferral() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccess } = useToast()

  const mutation = useMutation({
    mutationFn: (codice: string) => redimiCodiceReferral(codice),
    onSuccess: (result) => {
      if (result.error || !user) return
      if (result.crediti > 0) {
        showSuccess(`Codice invito applicato: +${result.crediti} crediti`)
        queryClient.invalidateQueries({ queryKey: queryKeys.profilo.detail(user.id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.crediti.storico(user.id) })
      }
    },
  })

  return {
    redimi: (codice: string) => mutation.mutate(codice),
    isLoading: mutation.isPending,
  }
}
