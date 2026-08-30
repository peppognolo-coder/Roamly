import { supabase } from '@/lib/supabase'
import type { TappaViaggio, NuovaTappaViaggio, ModificaTappaViaggio } from '@/types'

// ============================================================
// ROAMLY — Tappe Viaggio Service
// Responsabilità: chiamate alla tabella `tappe_viaggio`.
// Alimenta sia la vista Itinerario (per giorno) sia Attività (mappa).
// Ordinamento canonico: giorno ASC, ordine ASC.
// ============================================================

export async function getTappe(viaggioId: string): Promise<{
  data: TappaViaggio[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('tappe_viaggio')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('giorno', { ascending: true, nullsFirst: true })
    .order('ordine', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as TappaViaggio[], error: null }
}

export async function createTappa(
  userId: string,
  payload: NuovaTappaViaggio
): Promise<{ data: TappaViaggio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tappe_viaggio')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TappaViaggio, error: null }
}

export async function updateTappa(
  tappaId: string,
  payload: ModificaTappaViaggio
): Promise<{ data: TappaViaggio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tappe_viaggio')
    .update(payload)
    .eq('id', tappaId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as TappaViaggio, error: null }
}

export async function deleteTappa(
  tappaId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('tappe_viaggio')
    .delete()
    .eq('id', tappaId)

  return { error: error?.message ?? null }
}
