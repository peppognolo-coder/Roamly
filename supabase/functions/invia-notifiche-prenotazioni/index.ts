// ============================================================
// ROAMLY — Edge Function: invia-notifiche-prenotazioni
//
// Gira su Supabase (Deno), NON su Netlify — deploy separato,
// vedi le istruzioni consegnate insieme a questo file.
//
// Cosa fa, una volta al giorno (schedulata via pg_cron):
//   1. Trova le prenotazioni che scadono tra esattamente
//      N giorni, dove N è l'anticipo scelto da ciascuna persona
//   2. Per ogni membro del viaggio con notifiche attive e un
//      dispositivo registrato, manda una notifica push
//   3. Segna l'invio in notifiche_inviate per non ripeterlo
//   4. Se una subscription risulta scaduta (410/404), la rimuove
//
// Variabili d'ambiente richieste:
//   SUPABASE_URL, SUPABASE_SECRET_KEYS  → già disponibili
//     automaticamente in ogni Edge Function Supabase.
//     SUPABASE_SECRET_KEYS è un JSON { nomeChiave: valore } con
//     tutte le secret key del progetto — usiamo quella chiamata
//     "cron_notifiche", creata in Settings > API Keys.
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  → generate con
//     `npx web-push generate-vapid-keys` (vedi N2)
//   VAPID_SUBJECT                        → "mailto:tua@email.it"
//     (richiesto dallo standard Web Push, identifica il mittente)
//
// Autenticazione del chiamante:
//   pg_cron invia la secret key "cron_notifiche" nell'header
//   `apikey` (NON più `Authorization: Bearer`, perché le secret
//   key non sono JWT — vedi cron.alter_job aggiornato).
//   La stessa chiave viene anche usata per creare il client
//   Supabase interno che bypassa RLS.
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

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
const vapidSubject = Deno.env.get('VAPID_SUBJECT')!

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

interface RigaDaNotificare {
  prenotazione_id: string
  nome: string
  data: string
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

// Le secret key non sono JWT: niente più da decodificare, o l'header
// `apikey` corrisponde esattamente alla secret key attesa o la
// richiesta è rifiutata. Confronto in "tempo costante" per evitare
// che un attaccante possa dedurre la chiave misurando quanto ci
// mette a rispondere un confronto carattere-per-carattere ingenuo.
function chiamataAutorizzata(req: Request): boolean {
  const apiKey = req.headers.get('apikey')

  // --- DEBUG TEMPORANEO: da rimuovere una volta risolto il 401 ---
  console.log('DEBUG apikey ricevuta:', {
    presente: apiKey !== null,
    lunghezzaRicevuta: apiKey?.length ?? 0,
    lunghezzaAttesa: cronSecretKey.length,
    inizioRicevuto: apiKey?.slice(0, 12) ?? null,
    inizioAtteso: cronSecretKey.slice(0, 12),
    fineRicevuta: apiKey?.slice(-4) ?? null,
    fineAttesa: cronSecretKey.slice(-4),
  })
  // --- FINE DEBUG TEMPORANEO ---

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

  // Prenotazioni in scadenza esattamente tra N giorni, dove N è
  // l'anticipo scelto da ciascun membro — join su viaggio_membri
  // così avvisa tutti i collaboratori del viaggio, non solo chi
  // ha creato la prenotazione.
  const { data: righe, error } = await supabase.rpc('prenotazioni_da_notificare')

  if (error) {
    console.error('Errore nel recupero prenotazioni:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const risultati: { inviate: number; fallite: number; rimosse: number } = {
    inviate: 0, fallite: 0, rimosse: 0,
  }

  for (const riga of (righe ?? []) as RigaDaNotificare[]) {
    const subscription = {
      endpoint: riga.endpoint,
      keys: { p256dh: riga.p256dh, auth: riga.auth_key },
    }

    const payload = JSON.stringify({
      title: 'Promemoria Roamly',
      body: `${riga.nome} — ${new Date(riga.data + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`,
      url: '/',
    })

    try {
      await webpush.sendNotification(subscription, payload)
      risultati.inviate++

      await supabase.from('notifiche_inviate').insert({
        prenotazione_id: riga.prenotazione_id,
        user_id: riga.user_id,
      })
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode
      // 410 Gone / 404 Not Found → subscription non più valida
      // (dispositivo disinstallato, permesso revocato altrove...)
      if (statusCode === 410 || statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', riga.endpoint)
        risultati.rimosse++
      } else {
        console.error('Invio fallito:', err)
        risultati.fallite++
      }
    }
  }

  return new Response(JSON.stringify(risultati), {
    headers: { 'Content-Type': 'application/json' },
  })
})
