import { useEffect, useState, useCallback } from 'react'
import { urlBase64ToUint8Array } from '@/lib/push-utils'
import { salvaSubscription, rimuoviSubscription } from '@/services/pushService'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — useNotifichePush
//
// Gestisce il permesso del browser e la registrazione del
// dispositivo (subscription push) — N2 del blocco Notifiche.
// Nessun invio reale: qui ci si limita a "iscrivere" il
// dispositivo, pronto per quando N3 (motore di invio) esisterà.
//
// VITE_VAPID_PUBLIC_KEY va generata una volta sola per il progetto
// (non per persona) — vedi supabase-migration-push-subscriptions.sql
// per il contesto. Se manca, l'hook lo segnala invece di rompersi:
// le notifiche sono opzionali, non devono bloccare il resto dell'app.
// ============================================================

export type StatoPermesso = 'non-supportato' | 'default' | 'granted' | 'denied'

export function useNotifichePush() {
  const { user } = useAuth()
  const [stato, setStato] = useState<StatoPermesso>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chiaveVapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  const supportato = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  useEffect(() => {
    if (!supportato) { setStato('non-supportato'); return }
    setStato(Notification.permission as StatoPermesso)
  }, [supportato])

  const attiva = useCallback(async () => {
    if (!supportato) { setError('Le notifiche push non sono supportate su questo browser.'); return }
    if (!chiaveVapid) { setError('Chiave notifiche non ancora configurata — riprova più tardi.'); return }
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const permesso = await Notification.requestPermission()
      setStato(permesso as StatoPermesso)
      if (permesso !== 'granted') {
        setIsLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(chiaveVapid) as BufferSource,
      })

      const { error: saveError } = await salvaSubscription(user.id, subscription)
      if (saveError) throw new Error(saveError)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Attivazione non riuscita')
    } finally {
      setIsLoading(false)
    }
  }, [supportato, chiaveVapid, user])

  const disattiva = useCallback(async () => {
    if (!supportato) return
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await rimuoviSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disattivazione non riuscita')
    } finally {
      setIsLoading(false)
    }
  }, [supportato])

  return {
    stato,           // 'non-supportato' | 'default' | 'granted' | 'denied'
    isLoading,
    error,
    supportato,
    chiaveConfigurata: !!chiaveVapid,
    attiva,
    disattiva,
  }
}
