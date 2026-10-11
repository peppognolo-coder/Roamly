// ============================================================
// ROAMLY — Anteprima social per le pagine pubbliche /v/:token
//
// Come per gli inviti: WhatsApp, iMessage, Telegram, Facebook ecc.
// non eseguono JavaScript, leggono solo l'HTML grezzo. Per i bot
// di anteprima questa funzione restituisce una pagina minimale con
// titolo, descrizione e FOTO del viaggio (una foto già pubblica,
// ridimensionata 1200×630 dalle trasformazioni di Supabase Storage).
// Le persone vere passano all'app (context.next()).
//
// Nessuna chiave segreta: usa la funzione pubblica viaggio_pubblico()
// e la policy anon sulle foto pubbliche, con la anon key del client.
// ============================================================

const BOT_PATTERNS = [
  /facebookexternalhit/i, /Twitterbot/i, /WhatsApp/i, /TelegramBot/i,
  /LinkedInBot/i, /Slackbot/i, /Discordbot/i, /SkypeUriPreview/i,
  /iMessageBot/i, /Applebot/i, /Googlebot/i, /vkShare/i,
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface RicordoPub { foto?: string[] }
interface DatiPubblici {
  viaggio: { nome: string; destinazione: string | null; paese: string | null }
  ricordi: RicordoPub[]
}

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const userAgent = request.headers.get('user-agent') || ''
  if (!BOT_PATTERNS.some((p) => p.test(userAgent))) return context.next()

  const url = new URL(request.url)
  const token = url.pathname.split('/v/')[1]?.split('/')[0]
  if (!token) return context.next()

  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
  const anonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return context.next()

  const headers = { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/viaggio_pubblico`, {
      method: 'POST', headers, body: JSON.stringify({ p_token: token }),
    })
    if (!resp.ok) return context.next()
    const dati = (await resp.json()) as DatiPubblici | null
    if (!dati?.viaggio) return context.next()

    const { viaggio, ricordi } = dati
    const luogo = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')
    const n = ricordi.length
    const titolo = `${viaggio.nome} · un viaggio su Roamly`
    const descrizione = [luogo, n > 0 ? `${n} ${n === 1 ? 'ricordo' : 'ricordi'}` : null]
      .filter(Boolean).join(' · ') || 'Un viaggio raccontato su Roamly'

    // Prima foto pubblica disponibile → URL firmato 24h, ritagliato 1200×630
    let immagine = `${url.origin}/og-default.png`
    const path = ricordi.flatMap((r) => r.foto ?? [])[0]
    if (path) {
      const encoded = path.split('/').map(encodeURIComponent).join('/')
      const firma = await fetch(`${supabaseUrl}/storage/v1/object/sign/ricordi-foto/${encoded}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expiresIn: 86400, transform: { width: 1200, height: 630, resize: 'cover' } }),
      })
      if (firma.ok) {
        const { signedURL } = (await firma.json()) as { signedURL?: string }
        if (signedURL) immagine = `${supabaseUrl}/storage/v1${signedURL}`
      }
    }

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta property="og:title" content="${escapeHtml(titolo)}" />
  <meta property="og:description" content="${escapeHtml(descrizione)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.href)}" />
  <meta property="og:site_name" content="Roamly" />
  <meta property="og:image" content="${escapeHtml(immagine)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(titolo)}" />
  <meta name="twitter:description" content="${escapeHtml(descrizione)}" />
  <meta name="twitter:image" content="${escapeHtml(immagine)}" />
  <title>${escapeHtml(titolo)}</title>
</head>
<body>
  <p>${escapeHtml(titolo)}</p>
</body>
</html>`

    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  } catch {
    return context.next()
  }
}

export const config = { path: '/v/*' }
