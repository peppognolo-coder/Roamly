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
