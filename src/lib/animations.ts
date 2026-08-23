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
