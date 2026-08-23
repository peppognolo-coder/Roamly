import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ============================================================
// PageHeader — header condiviso per le pagine
// variant 'default': eyebrow opzionale + titolo (Home, sezioni)
// variant 'withBack': freccia indietro + titolo (pagine di dettaglio)
// ============================================================

interface PageHeaderProps {
  title: string
  eyebrow?: string
  subtitle?: string
  variant?: 'default' | 'withBack'
  onBack?: () => void
  action?: React.ReactNode
  className?: string
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  variant = 'default',
  onBack,
  action,
  className = '',
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => (onBack ? onBack() : navigate(-1))

  return (
    <header className={`px-5 pt-14 pb-5 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        {variant === 'withBack' && (
          <button
            onClick={handleBack}
            aria-label="Indietro"
            className="
              shrink-0 w-9 h-9 -ml-1.5 rounded-full
              flex items-center justify-center
              text-roamly-text/60 hover:bg-roamly-g6 hover:text-roamly-g1
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            <BackIcon />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="font-dm-mono text-[10px] uppercase tracking-widest text-roamly-text/30 mb-0.5">
              {eyebrow}
            </p>
          )}
          <h1 className="font-lora text-h1 text-roamly-g0 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </motion.div>
    </header>
  )
}
