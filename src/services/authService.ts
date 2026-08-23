import { supabase } from '@/lib/supabase'

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
