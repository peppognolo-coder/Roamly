import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// ============================================================
// InstallBanner — banner installazione PWA
// Intercetta beforeinstallprompt (Chrome/Android — non disponibile su iOS).
// Appare 30 secondi dopo il primo utilizzo.
// Dismissal persistente: non riappare per 7 giorni.
// Non appare quando l'utente è offline.
// ============================================================

const STORAGE_KEY   = 'roamly-install-dismissed'
const DELAY_MS      = 30_000
const COOLDOWN_DAYS = 7

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(STORAGE_KEY)
    if (!ts) return false
    const days = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24)
    return days < COOLDOWN_DAYS
  } catch {
    return false
  }
}

export function InstallBanner() {
  const { isOffline } = useOnlineStatus()
  const [prompt, setPrompt]   = useState<Event | null>(null)
  const [visible, setVisible] = useState(false)

  // Intercetta beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Mostra dopo 30 secondi se non dismissed di recente
  useEffect(() => {
    if (!prompt || wasDismissedRecently()) return
    const timer = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [prompt])

  function handleInstall() {
    if (!prompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prompt as any).prompt()
    setVisible(false)
  }

  function handleDismiss() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* noop */ }
    setVisible(false)
  }

  // Non mostrare se offline o non visibile
  const show = visible && !isOffline

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="install-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: 12  }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="
            fixed bottom-[88px] left-0 right-0 z-30
            flex justify-center
            pointer-events-none
          "
        >
          <div className="
            mx-4 max-w-[390px] w-full
            bg-white rounded-2xl
            border border-roamly-g5
            shadow-lg shadow-roamly-g0/10
            p-4
            flex items-center gap-3
            pointer-events-auto
          ">
            {/* Logo piccolo */}
            <div className="
              w-10 h-10 rounded-xl bg-roamly-g0
              flex items-center justify-center shrink-0
            ">
              <img src="/favicon.svg" alt="" className="w-6 h-6" />
            </div>

            {/* Testo */}
            <div className="flex-1 min-w-0">
              <p className="font-dm-sans font-semibold text-sm text-roamly-g0">
                Installa Roamly
              </p>
              <p className="font-dm-sans text-xs text-roamly-text/50 mt-0.5">
                Accedi al tuo diario anche offline
              </p>
            </div>

            {/* Azioni */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="
                  font-dm-sans text-xs text-roamly-text/40
                  hover:text-roamly-text/60
                  transition-colors px-1
                "
                aria-label="Non ora"
              >
                Non ora
              </button>
              <button
                onClick={handleInstall}
                className="
                  px-3 py-1.5 rounded-xl
                  bg-roamly-g0 hover:bg-roamly-g1
                  font-dm-sans text-xs font-medium text-white
                  transition-colors active:scale-95
                "
              >
                Installa
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
