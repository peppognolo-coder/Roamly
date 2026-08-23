import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type Toast, type ToastType } from '@/store/toastStore'

// ============================================================
// Toast + ToastContainer — sistema notifiche globale
// ============================================================

// ---- Icone per tipo ----

function IconSuccess() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function IconError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

const ICON: Record<ToastType, React.ReactNode> = {
  success: <IconSuccess />,
  error:   <IconError />,
  info:    <IconInfo />,
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
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
