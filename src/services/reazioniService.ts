import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — Reazioni Service
// Un cuore per persona per ricordo — aggiungi/rimuovi, niente di più.
// ============================================================

export interface Reazione {
  id: string
  ricordo_id: string
  user_id: string
  created_at: string
}

export async function getReazioni(ricordoId: string): Promise<{
  data: Reazione[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('reazioni_ricordo')
    .select('*')
    .eq('ricordo_id', ricordoId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Reazione[], error: null }
}

export async function aggiungiReazione(
  ricordoId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reazioni_ricordo')
    .insert({ ricordo_id: ricordoId, user_id: userId })

  // Vincolo UNIQUE già presente lato DB — se la reazione c'è già
  // (es. doppio tap veloce), l'errore è atteso e non va propagato.
  if (error && error.code !== '23505') return { error: error.message }
  return { error: null }
}

export async function rimuoviReazione(
  ricordoId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('reazioni_ricordo')
    .delete()
    .eq('ricordo_id', ricordoId)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { error: null }
}
