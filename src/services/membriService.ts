import { supabase } from '@/lib/supabase'
import type { ViaggioMembro, RuoloMembro } from '@/types'

// ============================================================
// ROAMLY — Membri Viaggio Service
// Base minimale per M2 (serve solo a sapere se l'utente corrente
// è proprietario, per mostrare o meno il bottone "Invita").
// Verrà esteso nel Blocco M4 con la gestione completa dei membri.
// ============================================================

export async function getMioRuolo(
  viaggioId: string,
  userId: string
): Promise<{ ruolo: RuoloMembro | null; error: string | null }> {
  const { data, error } = await supabase
    .from('viaggio_membri')
    .select('ruolo')
    .eq('viaggio_id', viaggioId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { ruolo: null, error: error.message }
  return { ruolo: (data as { ruolo: RuoloMembro } | null)?.ruolo ?? null, error: null }
}

export async function getMembriViaggio(viaggioId: string): Promise<{
  data: ViaggioMembro[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggio_membri')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('joined_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as ViaggioMembro[], error: null }
}
