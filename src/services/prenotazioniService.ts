import { supabase } from '@/lib/supabase'
import type { Prenotazione, NuovaPrenotazione, ModificaPrenotazione } from '@/types'

// ============================================================
// ROAMLY — Prenotazioni Service
// Responsabilità: chiamate alla tabella `wallet`.
// Ordinamento canonico: data ASC (nulls per ultimi), poi created_at.
// ============================================================

export async function getPrenotazioni(viaggioId: string): Promise<{
  data: Prenotazione[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('wallet')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('data', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as Prenotazione[], error: null }
}

export async function createPrenotazione(
  userId: string,
  payload: NuovaPrenotazione
): Promise<{ data: Prenotazione | null; error: string | null }> {
  const { data, error } = await supabase
    .from('wallet')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Prenotazione, error: null }
}

export async function updatePrenotazione(
  prenotazioneId: string,
  payload: ModificaPrenotazione
): Promise<{ data: Prenotazione | null; error: string | null }> {
  const { data, error } = await supabase
    .from('wallet')
    .update(payload)
    .eq('id', prenotazioneId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Prenotazione, error: null }
}

export async function deletePrenotazione(
  prenotazioneId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('wallet')
    .delete()
    .eq('id', prenotazioneId)

  return { error: error?.message ?? null }
}
