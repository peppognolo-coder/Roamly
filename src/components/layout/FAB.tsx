import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, NotebookPen, Plane } from 'lucide-react'

// ============================================================
// FAB — bottone centrale della BottomNav.
// Tap → si apre a raggiera con due opzioni (Ricordo / Viaggio).
// Tap su un'opzione, sul FAB stesso, o sullo sfondo → si chiude.
// ============================================================

const OPZIONI = [
  {
    id: 'ricordo',
    label: 'Ricordo',
    icon: NotebookPen,
    to: '/nuovo-ricordo',
    // in alto a sinistra
    offset: { x: -86, y: -130 },
  },
  {
    id: 'viaggio',
    label: 'Viaggio',
    icon: Plane,
    to: '/viaggi/nuovo',
    // in alto a destra
    offset: { x: 86, y: -130 },
  },
] as const

export function FAB() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  function handleScegli(to: string) {
    setIsOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Sfondo — tap per chiudere. Renderizzato via portal in document.body.
          TEST DIAGNOSTICO 2: elemento grezzo, senza framer-motion/AnimatePresence,
          per isolare se il problema è nel portal o nell'animazione. */}
      {isOpen && createPortal(
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'red',
            zIndex: 9999,
          }}
        />,
        document.body
      )}

      {/* Opzioni a raggiera */}
      <AnimatePresence>
        {isOpen && OPZIONI.map((opz, i) => {
          const Icon = opz.icon
          return (
            <motion.button
              key={opz.id}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: 1, scale: 1, x: opz.offset.x, y: opz.offset.y }}
              exit={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04, ease: 'easeOut' }}
              onClick={() => handleScegli(opz.to)}
              style={{ left: 'calc(50% - 28px)' }}
              className="
                absolute -top-6 z-50
                flex flex-col items-center gap-1.5
              "
            >
              <span className="
                w-14 h-14 rounded-full
                bg-white shadow-roamly-lg
                flex items-center justify-center
                text-roamly-g2
              ">
                <Icon size={24} />
              </span>
              <span className="
                px-2.5 py-1 rounded-full
                bg-roamly-g0 text-white
                font-dm-sans text-xs font-medium
                whitespace-nowrap
              ">
                {opz.label}
              </span>
            </motion.button>
          )
        })}
      </AnimatePresence>

      {/* Bottone principale */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Chiudi menu' : 'Crea nuovo'}
        aria-expanded={isOpen}
        className="
          absolute -top-6 z-50
          w-14 h-14 rounded-full
          bg-roamly-coral hover:bg-roamly-coral-dark
          shadow-roamly-lg
          flex items-center justify-center
          transition-all duration-200
          active:scale-[0.98]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        "
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <Plus size={24} className="text-white" strokeWidth={2.5} />
        </motion.span>
      </button>
    </>
  )
}
