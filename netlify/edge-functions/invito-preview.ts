// ============================================================
// ROAMLY — Anteprima social per i link di invito
//
// WhatsApp/Telegram/iMessage ecc. non eseguono JavaScript quando
// generano l'anteprima di un link — leggono solo l'HTML grezzo.
// Roamly è una SPA: senza questa funzione, ogni link di invito
// mostrerebbe sempre lo stesso titolo/descrizione generici.
//
// Questa Edge Function intercetta le richieste a /invito/:token
// PRIMA che arrivino all'app:
//   - se il richiedente è un bot di anteprima → genera un HTML
//     minimale con i metadati giusti (nome viaggio, destinazione)
//   - se è una persona reale → lascia passare all'app normale
//     (context.next())
//
// Nessuna chiave segreta nuova: riusa la stessa funzione pubblica
// anteprima_invito() e la anon key già usate dal client.
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

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = BOT_PATTERNS.some((p) => p.test(userAgent))

  // Persona reale → lascia passare, l'app gestisce tutto normalmente
  if (!isBot) {
    return context.next()
  }

  const url = new URL(request.url)
  const token = url.pathname.split('/invito/')[1]
  if (!token) return context.next()

  const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')
  const anonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY')

  if (!supabaseUrl || !anonKey) return context.next()

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/anteprima_invito`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_token: token }),
    })

    if (!resp.ok) return context.next()

    const data = await resp.json()
    const anteprima = Array.isArray(data) ? data[0] : data

    if (!anteprima || anteprima.scaduto) return context.next()

    const titolo = `Ti hanno invitato a "${anteprima.nome}" su Roamly`
    const luogo = [anteprima.destinazione, anteprima.paese].filter(Boolean).join(', ')
    const descrizione = luogo || 'Organizza il viaggio insieme su Roamly'

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta property="og:title" content="${escapeHtml(titolo)}" />
  <meta property="og:description" content="${escapeHtml(descrizione)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(url.href)}" />
  <meta property="og:site_name" content="Roamly" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(titolo)}" />
  <meta name="twitter:description" content="${escapeHtml(descrizione)}" />
  <title>${escapeHtml(titolo)}</title>
</head>
<body>
  <p>${escapeHtml(titolo)}</p>
</body>
</html>`

    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch {
    // In caso di qualunque errore, meglio far vedere l'app normale
    // che un'anteprima rotta.
    return context.next()
  }
}

export const config = { path: '/invito/*' }
