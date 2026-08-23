import { useState, useEffect } from 'react'

// ============================================================
// useOnlineStatus — rilevazione stato connettività
// Ascolta gli eventi window online/offline.
// React Query gestisce già i refetch automatici al ripristino
// della connessione (refetchOnReconnect: true di default).
// ============================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline }
}
