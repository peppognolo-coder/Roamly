import { useState, useEffect } from 'react'

// ============================================================
// useOnlineStatus — rilevazione stato connettività
// Ascolta gli eventi window online/offline. Traccia anche da
// quando si è offline (offlineDal) — usato dalla schermata
// /offline per un messaggio onesto ("Offline dalle 14:12"),
// non un dato inventato.
// React Query gestisce già i refetch automatici al ripristino
// della connessione (refetchOnReconnect: true di default).
// ============================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [offlineDal, setOfflineDal] = useState<Date | null>(
    typeof navigator !== 'undefined' && !navigator.onLine ? new Date() : null
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setOfflineDal(null)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setOfflineDal(new Date())
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline, offlineDal }
}
