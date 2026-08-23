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

export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
  return (
    <motion.div
      {...fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  )
}
