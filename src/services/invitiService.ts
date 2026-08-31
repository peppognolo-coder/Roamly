import { supabase } from '@/lib/supabase'
import type { InvitoViaggio } from '@/types'

// ============================================================
// ROAMLY — Inviti Service
// Un link è riutilizzabile da più persone (non a uso singolo) e
// scade dopo 7 giorni (default della colonna scade_il).
// ============================================================

// ------------------------------------------------------------
// Recupera un invito ancora valido per il viaggio, se esiste —
// evita di generare un nuovo link ogni volta che si preme "Invita"
// finché quello attivo non scade.
// ------------------------------------------------------------

export async function getInvitoAttivo(viaggioId: string): Promise<{
  data: InvitoViaggio | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('inviti_viaggio')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .gt('scade_il', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as InvitoViaggio | null, error: null }
}

// ------------------------------------------------------------
// Crea un nuovo invito (token generato lato DB)
// ------------------------------------------------------------

export async function createInvito(
  userId: string,
  viaggioId: string
): Promise<{ data: InvitoViaggio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('inviti_viaggio')
    .insert({ viaggio_id: viaggioId, creato_da: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as InvitoViaggio, error: null }
}

// ------------------------------------------------------------
// Anteprima pubblica — chiamabile anche senza essere membro
// (o senza essere nemmeno autenticati). Espone solo i campi
// necessari per mostrare "sei stato invitato a ___".
// ------------------------------------------------------------

export interface AnteprimaInvito {
  viaggio_id: string
  nome: string
  destinazione: string | null
  paese: string | null
  cover_emoji: string | null
  data_inizio: string | null
  data_fine: string | null
  scaduto: boolean
}

export async function getAnteprimaInvito(token: string): Promise<{
  data: AnteprimaInvito | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('anteprima_invito', { p_token: token })

  if (error) return { data: null, error: error.message }
  const riga = Array.isArray(data) ? data[0] : data
  if (!riga) return { data: null, error: null }

  return { data: riga as AnteprimaInvito, error: null }
}

// ------------------------------------------------------------
// Invito "in sospeso" — quando chi apre il link non ha ancora un
// account, il token viene messo da parte finché non completa
// login/registrazione, poi il gestore in App.tsx lo riprende
// automaticamente e fa entrare la persona nel viaggio.
// ------------------------------------------------------------

const PENDING_INVITE_KEY = 'roamly_invito_in_sospeso'

export function setInvitoInSospeso(token: string): void {
  try { localStorage.setItem(PENDING_INVITE_KEY, token) } catch { /* noop */ }
}

export function getInvitoInSospeso(): string | null {
  try { return localStorage.getItem(PENDING_INVITE_KEY) } catch { return null }
}

export function clearInvitoInSospeso(): void {
  try { localStorage.removeItem(PENDING_INVITE_KEY) } catch { /* noop */ }
}

// ------------------------------------------------------------
// accetta_invito — RPC lato DB, valida il token e crea la riga
// membro. Restituisce il viaggio_id per il redirect.
// ------------------------------------------------------------

export async function accettaInvito(token: string): Promise<{
  viaggioId: string | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('accetta_invito', { p_token: token })

  if (error) return { viaggioId: null, error: error.message }
  return { viaggioId: data as string, error: null }
}
