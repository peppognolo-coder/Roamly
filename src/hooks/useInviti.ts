import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { queryKeys } from '@/lib/queryKeys'
import { getInvitoAttivo, createInvito, getAnteprimaInvito, accettaInvito } from '@/services/invitiService'

// ============================================================
// ROAMLY — useInvitoLink
// Genera (o riusa se già attivo) il link di invito per un viaggio
// e lo condivide — Web Share API se disponibile (stesso pattern di
// ShareCardViaggio), altrimenti copia negli appunti.
// ============================================================

export function useInvitoLink(viaggioId: string, nomeViaggio: string) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function condividi() {
    if (!user) return
    setIsLoading(true)

    try {
      // Riusa un invito già attivo, se esiste, invece di crearne
      // uno nuovo ogni volta che si preme "Invita".
      let { data: invito, error } = await getInvitoAttivo(viaggioId)

      if (!invito) {
        const risultato = await createInvito(user.id, viaggioId)
        invito = risultato.data
        error = risultato.error
      }

      if (error || !invito) {
        showError('Impossibile generare il link di invito. Riprova.')
        return
      }

      const url = `${window.location.origin}/invito/${invito.token}`
      const testo = `Ti va di organizzare insieme "${nomeViaggio}" su Roamly?`

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Invito a un viaggio su Roamly', text: testo, url })
        } catch {
          // L'utente ha annullato la condivisione — nessun errore da mostrare
        }
      } else {
        await navigator.clipboard.writeText(url)
        showSuccess('Link copiato negli appunti')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { condividi, isLoading }
}

// ------------------------------------------------------------
// useAnteprimaInvito — anteprima pubblica del viaggio, per la
// pagina /invito/:token — funziona anche senza essere autenticati.
// ------------------------------------------------------------

export function useAnteprimaInvito(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.inviti.anteprima(token ?? ''),
    queryFn: () => getAnteprimaInvito(token as string),
    enabled: !!token,
    retry: false,
  })
}

// ------------------------------------------------------------
// useAccettaInvito — entra come collaboratore, poi naviga al
// viaggio. Usata dalla pagina /invito/:token quando l'utente è
// già autenticato, e dal gestore dell'invito in sospeso dopo
// login/registrazione (vedi App.tsx).
// ------------------------------------------------------------

export function useAccettaInvito() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function accetta(token: string) {
    setIsLoading(true)
    const { viaggioId, error } = await accettaInvito(token)
    setIsLoading(false)

    if (error || !viaggioId) {
      showError('Invito non valido o scaduto.')
      return { success: false }
    }

    showSuccess('Ti sei unito al viaggio!')
    navigate(`/viaggi/${viaggioId}`)
    return { success: true }
  }

  return { accetta, isLoading }
}
