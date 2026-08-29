import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Waves, BookOpen, Compass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { markOnboardingSeen } from '@/lib/onboarding-utils'

// ============================================================
// OnboardingFlow — 3 schermate di benvenuto al primo accesso
// Mostrato da AuthGuard subito dopo il primo login,
// una sola volta (flag in localStorage).
// ============================================================

interface Schermata {
  icon: LucideIcon
  titolo: string
  testo: string
}

const SCHERMATE: Schermata[] = [
  {
    icon: Waves,
    titolo: 'Ogni ricordo ha un\'emozione',
    testo: 'Racconta come ti sei sentito in ogni momento del viaggio, non solo cosa hai visto.',
  },
  {
    icon: BookOpen,
    titolo: 'Il viaggio diventa un racconto',
    testo: 'Al ritorno, i tuoi ricordi si trasformano automaticamente in una storia da rileggere.',
  },
  {
    icon: Compass,
    titolo: 'Sempre con te',
    testo: 'Aggiungi un ricordo ovunque tu sia, anche offline. Roamly sincronizza appena torni online.',
  },
]

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const isLast = step === SCHERMATE.length - 1
  const schermata = SCHERMATE[step]

  function handleFine() {
    markOnboardingSeen()
    onComplete()
  }

  function handleAvanti() {
    if (isLast) {
      handleFine()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div className="w-full max-w-mobile flex flex-col min-h-screen px-6">

        {/* ── Salta ── */}
        <div className="flex justify-end pt-6">
          <button
            onClick={handleFine}
            className="
              font-dm-sans text-sm text-roamly-text/40
              hover:text-roamly-text/60 transition-colors duration-150
              px-2 py-1
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-lg
            "
          >
            Salta
          </button>
        </div>

        {/* ── Contenuto schermata (crossfade) ── */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center gap-6"
            >
              <div className="
                w-24 h-24 rounded-3xl
                bg-roamly-g7 shadow-roamly
                flex items-center justify-center
              ">
                <schermata.icon size={40} className="text-roamly-g3" />
              </div>

              <div className="flex flex-col gap-3 max-w-[300px]">
                <h1 className="font-lora text-display text-roamly-g0">
                  {schermata.titolo}
                </h1>
                <p className="font-dm-sans text-sm text-roamly-text/55 leading-relaxed">
                  {schermata.testo}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Indicatori + CTA ── */}
        <div className="flex flex-col items-center gap-6 pb-12">
          <div className="flex items-center gap-2">
            {SCHERMATE.map((_, i) => (
              <span
                key={i}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${i === step ? 'w-6 bg-roamly-g3' : 'w-1.5 bg-roamly-g5'}
                `}
              />
            ))}
          </div>

          <Button onClick={handleAvanti} size="lg" fullWidth>
            {isLast ? 'Inizia il tuo diario' : 'Avanti'}
          </Button>
        </div>

      </div>
    </div>
  )
}
