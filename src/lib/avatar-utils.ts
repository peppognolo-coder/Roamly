// ============================================================
// ROAMLY — avatar-utils
// Colore deterministico per l'iniziale di fallback quando manca
// una foto profilo. Stessa persona → stesso colore ovunque
// nell'app (AutoreBadge, AvatarStack, ecc.)
// ============================================================

const PALETTE_INIZIALE = [
  '#0F7EA8', '#FF6B4A', '#3DA35D', '#C084FC',
  '#F5A623', '#EC4899', '#64748B', '#14B8A6',
]

export function coloreIniziale(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE_INIZIALE[Math.abs(hash) % PALETTE_INIZIALE.length]
}
