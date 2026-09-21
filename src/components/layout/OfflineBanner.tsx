import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// ============================================================
// OfflineBanner — banner di stato connettività
// Appare quando l'utente è offline, scompare automaticamente
// al ripristino della connessione. Non dismissabile manualmente
// — è informazione contestuale, non notifica. Tap → /offline,
// il dettaglio della schermata "Senza rete" del mockup.
// Posizionato sopra la BottomNav (bottom-[80px]).
// ============================================================

export function OfflineBanner() {
  const { isOffline } = useOnlineStatus()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="
            fixed bottom-[80px] left-0 right-0 z-30
            flex justify-center
            pointer-events-none
          "
        >
          <button
            onClick={() => navigate('/offline')}
            className="
              mx-4 max-w-[390px] w-full
              flex items-center gap-2.5
              px-4 py-2.5
              bg-roamly-text/90 backdrop-blur-sm rounded-xl
              shadow-lg
              pointer-events-auto
              text-left
            "
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="font-dm-sans text-xs font-medium text-white/90 flex-1">
              Sei offline — alcune funzioni potrebbero non essere disponibili
            </p>
            <span className="font-dm-sans text-[10.5px] font-medium text-white/50 shrink-0">
              Dettagli
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
