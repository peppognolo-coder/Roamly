import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, Info } from 'lucide-react'
import { useToastStore, type Toast, type ToastType } from '@/store/toastStore'

// ============================================================
// Toast + ToastContainer — sistema notifiche globale
// ============================================================

const ICON: Record<ToastType, React.ReactNode> = {
  success: <Check size={16} strokeWidth={2.5} />,
  error:   <X size={16} strokeWidth={2.5} />,
  info:    <Info size={16} strokeWidth={2.5} />,
}

const STYLE: Record<ToastType, string> = {
  success: 'border-roamly-g4 text-roamly-g1  bg-white',
  error:   'border-red-300   text-red-600    bg-white',
  info:    'border-roamly-g5 text-roamly-text bg-white',
}

const ICON_STYLE: Record<ToastType, string> = {
  success: 'text-roamly-g2',
  error:   'text-red-500',
  info:    'text-roamly-text/50',
}

// ---- Toast singolo ----

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -8, scale: 0.97  }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        flex items-center gap-3
        px-4 py-3 rounded-2xl
        border shadow-roamly-lg
        font-dm-sans text-sm font-medium
        ${STYLE[toast.type]}
      `}
    >
      <span className={`shrink-0 ${ICON_STYLE[toast.type]}`}>
        {ICON[toast.type]}
      </span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 text-current opacity-40 hover:opacity-70 transition-opacity"
        aria-label="Chiudi"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </motion.div>
  )
}

// ---- Container globale (montato in App.tsx) ----

export function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        flex flex-col gap-2
        w-full max-w-[390px] px-4
        pointer-events-none
      "
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
