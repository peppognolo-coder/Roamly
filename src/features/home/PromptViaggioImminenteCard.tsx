import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CalendarClock } from 'lucide-react'
import { calcolaGiorniAlPartenza } from '@/lib/viaggi-utils'
import type { ViaggioConStato } from '@/types'

// ============================================================
// PromptViaggioImminenteCard — Blocco Q4
// Prompt contestuale leggero: avvisa quando il viaggio pianificato
// più vicino parte entro la settimana. Nessuna query aggiuntiva —
// riusa il viaggio già caricato da useViaggioAttivo() in HomePage.
// Dismiss persistente per singolo viaggio/data (localStorage),
// così non riappare per lo stesso viaggio ma torna per uno nuovo.
// ============================================================

const FINESTRA_GIORNI = 7
const STORAGE_PREFIX = 'roamly-prompt-imminente-'

function isDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function setDismissed(key: string) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* noop */
  }
}

interface PromptViaggioImminenteCardProps {
  viaggio: ViaggioConStato | null
}

export function PromptViaggioImminenteCard({ viaggio }: PromptViaggioImminenteCardProps) {
  const navigate = useNavigate()

  const giorni = viaggio?.data_inizio ? calcolaGiorniAlPartenza(viaggio.data_inizio) : null

  const eleggibile =
    !!viaggio &&
    viaggio.stato_effettivo === 'pianificato' &&
    giorni !== null &&
    giorni >= 1 &&
    giorni <= FINESTRA_GIORNI

  const storageKey = viaggio ? `${STORAGE_PREFIX}${viaggio.id}-${viaggio.data_inizio}` : ''

  const [dismissed, setLocalDismissed] = useState(() =>
    storageKey ? isDismissed(storageKey) : false
  )

  const show = eleggibile && !dismissed

  function handleDismiss() {
    if (storageKey) setDismissed(storageKey)
    setLocalDismissed(true)
  }

  function handleVaiAPianifica() {
    if (viaggio) navigate(`/viaggi/${viaggio.id}?tab=pianifica`)
  }

  if (!viaggio) return null

  const destinazione = viaggio.destinazione ?? viaggio.nome
  const testoGiorni = giorni === 1 ? 'domani' : `tra ${giorni} giorni`

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="prompt-viaggio-imminente"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div
            className="
              bg-roamly-coral-light rounded-2xl p-4
              flex items-start gap-3
              border border-roamly-coral/20
            "
          >
            <div
              className="
                w-9 h-9 rounded-xl bg-roamly-coral/15
                flex items-center justify-center shrink-0
              "
            >
              <CalendarClock size={18} className="text-roamly-coral-dark" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-dm-sans text-sm text-roamly-g0 leading-snug">
                Il tuo viaggio a{' '}
                <span className="font-semibold">{destinazione}</span> parte{' '}
                {testoGiorni} — tutto pronto?
              </p>
              <button
                onClick={handleVaiAPianifica}
                className="
                  mt-2 font-dm-sans text-xs font-semibold text-roamly-coral-dark
                  hover:underline
                "
              >
                Vai a Pianifica →
              </button>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Chiudi avviso"
              className="
                shrink-0 w-6 h-6 rounded-full
                flex items-center justify-center
                text-roamly-g0/40 hover:text-roamly-g0/70
                hover:bg-roamly-coral/10
                transition-colors
              "
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
