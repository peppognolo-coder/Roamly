import { supabase } from '@/lib/supabase'
import { deleteViaggio } from '@/services/viaggiService'

// ============================================================
// ROAMLY — Auth Service
// Responsabilità: chiamate a Supabase Auth.
// Nessuna logica UI, nessun side-effect su store o router.
// Restituisce sempre { data, error } — la gestione spetta al chiamante.
// ============================================================

// ------------------------------------------------------------
// Mapping errori Supabase → messaggi italiani
// ------------------------------------------------------------

export function mapAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return 'Email o password non corretti.'
  }
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return 'Controlla la tua email per confermare l\'account prima di accedere.'
  }
  if (m.includes('user already registered') || m.includes('user_already_exists')) {
    return 'Esiste già un account con questa email.'
  }
  if (m.includes('weak_password') || m.includes('password should be')) {
    return 'La password non soddisfa i requisiti minimi di sicurezza.'
  }
  if (m.includes('email_address_not_authorized')) {
    return 'Questa email non è autorizzata alla registrazione.'
  }
  if (m.includes('over_request_rate_limit') || m.includes('too many requests')) {
    return 'Troppi tentativi. Attendi qualche minuto e riprova.'
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Errore di connessione. Controlla la rete e riprova.'
  }

  return 'Qualcosa è andato storto. Riprova.'
}

// ------------------------------------------------------------
// Registrazione email/password
// Il nome viene passato come metadata → trigger DB valorizza display_name
// ------------------------------------------------------------

export async function registerWithEmail(
  email: string,
  password: string,
  fullName: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  return { data, error }
}

// ------------------------------------------------------------
// Login email/password
// ------------------------------------------------------------

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

// ------------------------------------------------------------
// Google OAuth
// Il redirect viene gestito da Supabase internamente.
// Dopo il login OAuth, onAuthStateChange in useAuthListener aggiorna lo store.
// ------------------------------------------------------------

export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })

  return { data, error }
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------

export async function logout() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// ------------------------------------------------------------
// Recupera la sessione corrente (utilizzato da useAuthListener)
// ------------------------------------------------------------

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// ------------------------------------------------------------
// Eliminazione account
// Orchestrazione lato client:
//   1. Trova i viaggi di cui l'utente è proprietario
//   2. Per ciascuno, conta i membri: se è l'UNICO membro (viaggio
//      "solo suo"), lo elimina del tutto (riusa deleteViaggio, che
//      gestisce Storage fisico + righe foto + cascata). Se invece
//      ci sono altri collaboratori, il viaggio NON viene toccato —
//      resta a loro disposizione. La proprietà passa automaticamente
//      al collaboratore più anziano tramite un trigger lato database,
//      quando la sua riga in viaggio_membri viene rimossa (a cascata,
//      quando l'account viene eliminato al passo 3).
//   3. chiama la funzione SQL che pulisce i dati residui non legati
//      a un viaggio e cancella l'utente da auth.users
// Se un passaggio fallisce, si interrompe senza proseguire —
// nessuna cancellazione parziale silenziosa.
// ------------------------------------------------------------

export async function deleteAccount(
  userId: string
): Promise<{ error: string | null }> {
  const { data: viaggiProprietario, error: errViaggi } = await supabase
    .from('viaggio_membri')
    .select('viaggio_id')
    .eq('user_id', userId)
    .eq('ruolo', 'proprietario')

  if (errViaggi) {
    return { error: `Impossibile leggere i viaggi: ${errViaggi.message}` }
  }

  for (const { viaggio_id } of viaggiProprietario ?? []) {
    const { count, error: errCount } = await supabase
      .from('viaggio_membri')
      .select('id', { count: 'exact', head: true })
      .eq('viaggio_id', viaggio_id)

    if (errCount) {
      return { error: `Impossibile verificare i collaboratori: ${errCount.message}` }
    }

    // Più di un membro → viaggio condiviso, non lo tocchiamo.
    // La proprietà passerà automaticamente a un collaboratore.
    if ((count ?? 1) > 1) continue

    const { error } = await deleteViaggio(viaggio_id)
    if (error) {
      return { error: `Impossibile eliminare tutti i dati: ${error}` }
    }
  }

  const { error: errRpc } = await supabase.rpc('elimina_account')
  if (errRpc) {
    return { error: `Impossibile eliminare l'account: ${errRpc.message}` }
  }

  return { error: null }
}
