# Sign in with Apple — attivazione

Il codice c'è già (pulsante "Continua con Apple" nel login) ma è **spento**.
Serve solo se pubblichi Roamly sull'App Store: Apple (linea guida 4.8) lo
richiede quando l'app offre anche il login con Google.

## Cosa serve (una tantum)
1. Account **Apple Developer** (99 $/anno).
2. In Apple Developer → Identifiers: crea un **App ID** con "Sign in with Apple"
   e un **Services ID** (es. `app.roamly.web`), con dominio dell'app e
   Return URL = `https://<tuo-progetto>.supabase.co/auth/v1/callback`.
3. In Keys: crea una chiave "Sign in with Apple" e scarica il file `.p8`.
4. In Supabase → Authentication → Providers → **Apple**: attiva e inserisci
   Services ID, Team ID, Key ID e la chiave (il segreto Apple scade ogni
   6 mesi: va rigenerato).
5. In Netlify → Environment variables: `VITE_APPLE_LOGIN=true`, poi rifai il deploy.

## Eliminazione account con Apple
Apple chiede che, eliminando l'account, si revochi anche il token Apple.
Va fatto lato server (funzione Supabase con le chiavi Apple): da aggiungere
quando si attiva il login con Apple.
