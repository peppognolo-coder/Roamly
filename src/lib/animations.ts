// ============================================================
// ROAMLY — Varianti Framer Motion condivise
// Fonte unica di verità per le animazioni di entrata pagina.
// Principio: discrete e purposeful — non decorative.
// ============================================================

export const fadeUp = {
  initial:    { opacity: 0, y: 10 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.25, ease: 'easeOut' },
} as const

export const fadeIn = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  transition: { duration: 0.2 },
} as const

export const slideUp = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.3, ease: 'easeOut' },
} as const

// Entrata a cascata per le righe di una lista: ogni elemento parte
// poco dopo il precedente (max 6 scaglioni, così liste lunghe non
// "aspettano" secondi). Usare come {...staggerItem(i)} su un motion.div.
export const staggerItem = (i: number) => ({
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut', delay: Math.min(i, 6) * 0.04 },
}) as const
