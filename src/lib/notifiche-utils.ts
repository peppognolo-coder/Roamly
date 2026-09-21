import type { TipoNotifica } from '@/types'

// ============================================================
// ROAMLY — notifiche-utils
// Logica pura per il feed notifiche: label di tempo relativo e
// aspetto (glifo + tono colore) per tipo. Nessuna chiamata a
// Supabase — riceve sempre `ora` per essere testabile.
// ============================================================

// ------------------------------------------------------------
// formatTempoRelativo
// "2 ore fa" / "ieri" / "3 giorni fa" — stesso registro del resto
// dell'app (vedi getLabelTempo in ricordi-utils.ts, che copre un
// caso diverso: anniversari su base data, non timestamp).
// ------------------------------------------------------------

export function formatTempoRelativo(iso: string, ora: Date = new Date()): string {
  const quando = new Date(iso)
  const diffMs = ora.getTime() - quando.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))

  if (diffMin < 1) return 'adesso'
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuto fa' : 'minuti fa'}`

  const diffOre = Math.floor(diffMin / 60)
  if (diffOre < 24) return `${diffOre} ${diffOre === 1 ? 'ora fa' : 'ore fa'}`

  const diffGiorni = Math.floor(diffOre / 24)
  if (diffGiorni === 1) return 'ieri'
  if (diffGiorni < 7) return `${diffGiorni} giorni fa`

  const diffSettimane = Math.floor(diffGiorni / 7)
  if (diffSettimane === 1) return 'una settimana fa'
  return `${diffSettimane} settimane fa`
}

// ------------------------------------------------------------
// aspettoNotifica
// Glifo (iniziale) + tono colore per tipo — stesso linguaggio
// visivo del mockup (icona quadrata DM Mono, sfondo coral o blu).
// ------------------------------------------------------------

export function aspettoNotifica(tipo: TipoNotifica): { glifo: string; tono: 'coral' | 'blu' } {
  switch (tipo) {
    case 'prenotazione':
      return { glifo: '!', tono: 'coral' }
    case 'nuovo_membro':
    case 'tappa_aggiunta':
      // Glifo di default se la riga non porta un'iniziale propria
      // (vedi colonna `glifo` su Notifica) — vecchie righe pre-migrazione.
      return { glifo: '+', tono: 'blu' }
    case 'anniversario':
      return { glifo: '♥', tono: 'blu' }
    case 'traguardo':
      return { glifo: '★', tono: 'blu' }
    default:
      return { glifo: '•', tono: 'blu' }
  }
}
