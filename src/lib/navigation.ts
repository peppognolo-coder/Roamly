// ============================================================
// Navigazione — rotta "genitore" di una pagina.
//
// Serve al tasto indietro quando non c'è cronologia interna da cui
// tornare (link di invito, notifica push, pagina aperta direttamente):
// invece di navigate(-1) — che in quel caso esce dall'app o non fa
// nulla — si va alla schermata logicamente sopra a quella corrente.
// ============================================================

export function percorsoGenitore(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/'
  let m: RegExpMatchArray | null

  // Dettaglio / creazione dentro una sezione → la lista della sezione
  m = p.match(/^\/viaggi\/([^/]+)\/(prenotazioni|budget)\/[^/]+$/)
  if (m) return `/viaggi/${m[1]}/${m[2]}`

  m = p.match(/^\/viaggi\/([^/]+)\/tappe\/[^/]+$/)
  if (m) return `/viaggi/${m[1]}/itinerario`

  // Sezioni di pianificazione → hub del viaggio, tab Pianifica
  m = p.match(/^\/viaggi\/([^/]+)\/(itinerario|prenotazioni|budget|valigia|attivita|calendario|note)$/)
  if (m) return `/viaggi/${m[1]}?tab=pianifica`

  m = p.match(/^\/viaggi\/([^/]+)\/membri$/)
  if (m) return `/viaggi/${m[1]}?tab=persone`

  // Giorno, racconto, wrapped, recap → hub del viaggio
  m = p.match(/^\/viaggi\/([^/]+)\/(giorno\/[^/]+|racconto|wrapped|recap)$/)
  if (m) return `/viaggi/${m[1]}`

  if (p === '/viaggi/nuovo') return '/viaggi'
  if (/^\/viaggi\/[^/]+$/.test(p)) return '/viaggi'
  if (p === '/viaggi') return '/'

  if (/^\/diario\/[^/]+$/.test(p)) return '/diario'
  if (/^\/ricordi\/[^/]+$/.test(p)) return '/diario'
  if (p === '/nuovo-ricordo') return '/'

  if (/^\/profilo\/(wallet|salvati)\/[^/]+$/.test(p)) return p.replace(/\/[^/]+$/, '')
  if (p.startsWith('/profilo/')) return '/profilo'

  return '/'
}
