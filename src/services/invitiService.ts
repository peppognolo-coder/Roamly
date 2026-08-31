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
