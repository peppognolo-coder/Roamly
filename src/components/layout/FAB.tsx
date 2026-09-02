import { useEffect, useState } from 'react'
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

// ------------------------------------------------------------
// FabBackdrop — sfondo scuro/sfocato dietro al menu a raggiera.
// Portato in document.body con createPortal, così scavalca
// il backdrop-blur-sm della BottomNav (che altrimenti
// intrappolerebbe un discendente fixed nei propri confini).
//
// Volutamente SENZA AnimatePresence/framer-motion: su alcuni
// dispositivi (confermato via test) la combinazione
// AnimatePresence + createPortal non renderizza affatto
// l'elemento — né visivamente né ai fini del tap — mentre il
// portal "nudo" funziona sempre. La dissolvenza in entrata è
// rifatta a mano con una transizione CSS pura (doppio render:
// prima a opacità 0, poi a 1 al frame successivo), senza alcuna
// dipendenza da framer-motion per questo elemento specifico.
//
// z-[35], SOTTO la BottomNav (z-40): la barra, essendo fixed
// con z-index esplicito, crea un proprio "stacking context" —
// tutto ciò che ci sta dentro (incluso il FAB e le due bolle a
// z-50) resta confrontato con elementi esterni usando lo z-index
// della barra stessa (40), non quello dei suoi discendenti. Uno
// sfondo con z-index maggiore di 40 finirebbe quindi per coprire
// l'intera barra, bottoni compresi, invece che restarne sotto.
// Tenendolo sotto la barra, l'intera BottomNav (incluso il "+")
// resta sempre nitida sopra lo sfondo scurito — solo il contenuto
// della pagina dietro viene sfocato.
// ------------------------------------------------------------
function FabBackdrop({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setVisibile(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisibile(true))
    return () => cancelAnimationFrame(frame)
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={onClose}
      className={`
        fixed inset-0 z-[35]
        bg-roamly-g0/70 backdrop-blur-sm
        transition-opacity duration-150
        ${visibile ? 'opacity-100' : 'opacity-0'}
      `}
    />,
    document.body
  )
}

export function FAB() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  function handleScegli(to: string) {
    setIsOpen(false)
    navigate(to)
  }

  return (
    <>
      <FabBackdrop isOpen={isOpen} onClose={() => setIsOpen(false)} />

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
