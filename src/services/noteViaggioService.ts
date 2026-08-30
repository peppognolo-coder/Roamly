import { supabase } from '@/lib/supabase'
import type { NotaViaggio, NuovaNotaViaggio } from '@/types'

// ============================================================
// ROAMLY — Note Viaggio Service
// Responsabilità: chiamate alla tabella `note_viaggio`.
// Ordinamento canonico: created_at DESC (più recenti in cima).
// ============================================================

export async function getNote(viaggioId: string): Promise<{
  data: NotaViaggio[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('note_viaggio')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data as NotaViaggio[], error: null }
}

export async function createNota(
  userId: string,
  payload: NuovaNotaViaggio
): Promise<{ data: NotaViaggio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('note_viaggio')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as NotaViaggio, error: null }
}

export async function updateNota(
  notaId: string,
  contenuto: string
): Promise<{ data: NotaViaggio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('note_viaggio')
    .update({ contenuto, updated_at: new Date().toISOString() })
    .eq('id', notaId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as NotaViaggio, error: null }
}

export async function deleteNota(
  notaId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('note_viaggio')
    .delete()
    .eq('id', notaId)

  return { error: error?.message ?? null }
}
