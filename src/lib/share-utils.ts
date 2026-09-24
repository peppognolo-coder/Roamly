// ============================================================
// ROAMLY — share-utils
// Utility condivise tra le share card (viaggio, ricordo, ...).
// ============================================================

// Converte una URL remota in dataURL — le signed URL di Supabase
// non sono CORS-safe per canvas, quindi html-to-image vedrebbe un
// canvas "tainted" e fallirebbe l'export. Pre-convertendo in dataURL
// via fetch, html-to-image lavora solo su dati già locali.
export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return new Promise((res) => {
      const reader = new FileReader()
      reader.onloadend = () => res(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// Formato export — condiviso tra ShareCardRicordo e ShareCardViaggio
// ------------------------------------------------------------

export type FormatoShare = 'story' | 'square' | 'polaroid'

export const DIMENSIONI_SHARE: Record<FormatoShare, { w: number; h: number }> = {
  story:    { w: 1080, h: 1920 },
  square:   { w: 1080, h: 1080 },
  polaroid: { w: 1080, h: 1350 }, // 4:5
}

export const FORMATO_LABEL: Record<FormatoShare, string> = {
  story:    'Story 9:16',
  square:   'Square 1:1',
  polaroid: 'Polaroid 4:5',
}

// ------------------------------------------------------------
// Tema sfondo — condiviso tra ShareCardRicordo e ShareCardViaggio.
// "mood" ha un gradiente diverso per ciascuna (mood del ricordo /
// colore di copertina del viaggio — vedi coloreCopertinaViaggio),
// quindi qui vive solo la parte davvero comune ai due: i 3 temi
// fissi e il tema "foto", che richiede una cover disponibile.
// ------------------------------------------------------------

export type Sfondo = 'mood' | 'notte' | 'oceano' | 'tramonto' | 'foto'

export const TEMI_SFONDO: { id: Sfondo; label: string; swatch?: string; richiedeFoto?: boolean }[] = [
  { id: 'mood',     label: 'Mood' },
  { id: 'notte',    label: 'Notte',    swatch: '#123F58' },
  { id: 'oceano',   label: 'Oceano',   swatch: '#0B6F99' },
  { id: 'tramonto', label: 'Tramonto', swatch: '#E5563A' },
  { id: 'foto',     label: 'Foto',     richiedeFoto: true },
]

// Gradienti fissi (tutto tranne "mood", che dipende dall'entità, e
// "foto", che usa la cover reale invece di un gradiente).
export const GRADIENTI_SFONDO: Record<'notte' | 'oceano' | 'tramonto', [string, string]> = {
  notte:    ['#123F58', '#0C2A3D'],
  oceano:   ['#5FB8D9', '#0B6F99'],
  tramonto: ['#FF6B4A', '#E5563A'],
}
