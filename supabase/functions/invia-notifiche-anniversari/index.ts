// ============================================================
// ROAMLY — Edge Function: invia-notifiche-anniversari
//
// Gira su Supabase (Deno), schedulata ogni giorno con pg_cron
// (vedi supabase-migration-anniversari.sql).
//
// Per ogni persona con "Un anno fa" attivo che ha un ricordo
// scritto oggi in un anno passato:
//   1. scrive una riga nel feed in-app (notifiche, tipo "anniversario"),
//      che resta consultabile anche senza push;
//   2. manda la push a tutti i dispositivi registrati (se ce ne sono);
//   3. segna l'invio in anniversari_inviati, per non ripeterlo.
//
// Stesse variabili e stessa autenticazione di
// invia-notifiche-prenotazioni (secret key "cron_notifiche" nell'header
// `apikey`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!

const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>
const cronSecretKey = secretKeys['cron_notifiche']

if (!cronSecretKey) {
  throw new Error(
    'Secret key "cron_notifiche" non trovata in SUPABASE_SECRET_KEYS. ' +
    'Verifica di averla creata in Settings > API Keys con questo nome esatto.'
  )
}

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

interface Anniversario {
  ricordo_id: string
  user_id: string
  titolo: string
  luogo: string | null
  anni_fa: number
}

const NUMERI = ['', 'Un anno fa', 'Due anni fa', 'Tre anni fa']
function titoloNotifica(anni: number): string {
  return NUMERI[anni] ?? `${anni} anni fa`
}

// Confronto in tempo costante, come nella funzione delle prenotazioni.
function chiamataAutorizzata(req: Request): boolean {
  const apiKey = req.headers.get('apikey')
  if (!apiKey) return false
  const a = new TextEncoder().encode(apiKey)
  const b = new TextEncoder().encode(cronSecretKey)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

Deno.serve(async (req) => {
  if (!chiamataAutorizzata(req)) {
    return new Response('Non autorizzato', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, cronSecretKey)
  const anno = new Date().getUTCFullYear()

  const { data: righe, error } = await supabase.rpc('anniversari_da_notificare')
  if (error) {
    console.error('Errore nel recupero anniversari:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const risultati = { notificati: 0, push_inviate: 0, push_fallite: 0, subscription_rimosse: 0 }

  for (const riga of (righe ?? []) as Anniversario[]) {
    const title = titoloNotifica(riga.anni_fa)
    const body = riga.luogo ? `${riga.titolo} — ${riga.luogo}` : riga.titolo
    const link = `/ricordi/${riga.ricordo_id}`

    // 1. Feed in-app. Se fallisce non segno l'invio, così alla prossima
    // esecuzione della funzione si riprova.
    const { error: errFeed } = await supabase.from('notifiche').insert({
      user_id: riga.user_id,
      tipo: 'anniversario',
      titolo: title,
      testo: body,
      link,
    })
    if (errFeed) {
      console.error('Feed non scritto:', errFeed.message)
      continue
    }

    // 2. Segno subito l'invio: una push in più o in meno è meno grave
    // di un avviso ripetuto ogni volta che la funzione gira.
    await supabase.from('anniversari_inviati').insert({
      ricordo_id: riga.ricordo_id,
      user_id: riga.user_id,
      anno,
    })
    risultati.notificati++

    // 3. Push su ogni dispositivo registrato.
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', riga.user_id)

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify({ title, body, url: link }),
        )
        risultati.push_inviate++
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          risultati.subscription_rimosse++
        } else {
          console.error('Push fallita:', err)
          risultati.push_fallite++
        }
      }
    }
  }

  return new Response(JSON.stringify(risultati), {
    headers: { 'Content-Type': 'application/json' },
  })
})
