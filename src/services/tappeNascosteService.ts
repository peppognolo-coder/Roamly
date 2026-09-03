import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — Tappe Nascoste Service
// "Nascondi per me" — preferenza personale, diversa da eliminare.
// ============================================================

export async function getTappeNascosteUtente(): Promise<{
  data: string[]  // array di tappa_id
  error: string | null
}> {
  const { data, error } = await supabase
    .from('tappe_nascoste')
    .select('tappa_id')

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => r.tappa_id as string), error: null }
}

export async function nascondiTappa(tappaId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tappe_nascoste')
    .insert({ tappa_id: tappaId, user_id: userId })

  // Vincolo UNIQUE — se è già nascosta, non è un errore da propagare
  if (error && error.code !== '23505') return { error: error.message }
  return { error: null }
}

export async function mostraTappa(tappaId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tappe_nascoste')
    .delete()
    .eq('tappa_id', tappaId)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { error: null }
}
