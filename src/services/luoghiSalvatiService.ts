import { supabase } from '@/lib/supabase'
import type { LuogoSalvato, NuovoLuogoSalvato } from '@/types'

// ============================================================
// ROAMLY — Luoghi Salvati Service
// Wishlist personale — usata da Scopri (salva un luogo) e da
// Mappa (modalità "Salvati").
// ============================================================

export async function getLuoghiSalvati(viaggioId?: string): Promise<{
  data: LuogoSalvato[]
  error: string | null
}> {
  let query = supabase
    .from('luoghi_salvati')
    .select('*')
    .order('created_at', { ascending: false })

  if (viaggioId) query = query.eq('viaggio_id', viaggioId)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as LuogoSalvato[], error: null }
}

export async function salvaLuogo(
  userId: string,
  payload: NuovoLuogoSalvato
): Promise<{ data: LuogoSalvato | null; error: string | null }> {
  const { data, error } = await supabase
    .from('luoghi_salvati')
    .insert({ ...payload, user_id: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as LuogoSalvato, error: null }
}

export async function rimuoviLuogoSalvato(id: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('luoghi_salvati')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { error: null }
}
