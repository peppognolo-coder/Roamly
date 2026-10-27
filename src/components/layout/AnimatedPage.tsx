import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

// ============================================================
// AnimatedPage — wrapper fadeUp per l'entrata delle pagine
// Usato come sostituto del <div> contenitore principale in ogni
// page che non ha già animazioni proprie più elaborate.
// Home e Diario hanno animazioni interne — non usano questo wrapper.
// ============================================================

interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
}

// Dove il browser ha le View Transitions (router.tsx le attiva a ogni cambio
// pagina) la dissolvenza la fa già il browser: rifare il fadeUp qui darebbe
// due animazioni sovrapposte. Senza l'API (Safari < 18) resta il fadeUp.
// Come bonus, senza il wrapper con transform i discendenti `fixed` non
// vengono più "intrappolati" nella pagina.
const haViewTransitions =
  typeof document !== 'undefined' && 'startViewTransition' in document

export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  if (haViewTransitions) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      {...fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}
