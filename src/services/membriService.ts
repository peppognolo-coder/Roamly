import { supabase } from '@/lib/supabase'
import type { ViaggioMembro, RuoloMembro } from '@/types'

// ============================================================
// ROAMLY — Membri Viaggio Service
// ============================================================

export interface MembroConProfilo extends ViaggioMembro {
  display_name: string | null
  avatar_url: string | null
}

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

// ------------------------------------------------------------
// Lista membri, arricchita con nome/foto dal profilo.
// Due query separate invece di un embed PostgREST: viaggio_membri
// e profili non hanno una relazione diretta (entrambe puntano a
// auth.users, non l'una all'altra), quindi niente join automatico.
// ------------------------------------------------------------

export async function getMembriViaggio(viaggioId: string): Promise<{
  data: MembroConProfilo[]
  error: string | null
}> {
  const { data: membri, error } = await supabase
    .from('viaggio_membri')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('joined_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  if (!membri || membri.length === 0) return { data: [], error: null }

  const userIds = membri.map((m) => m.user_id)
  const { data: profili, error: errProfili } = await supabase
    .from('profili')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  if (errProfili) return { data: [], error: errProfili.message }

  const profiliMap = new Map(
    (profili ?? []).map((p) => [p.id, p as { id: string; display_name: string | null; avatar_url: string | null }])
  )

  const arricchiti: MembroConProfilo[] = membri.map((m) => ({
    ...(m as ViaggioMembro),
    display_name: profiliMap.get(m.user_id)?.display_name ?? null,
    avatar_url:    profiliMap.get(m.user_id)?.avatar_url ?? null,
  }))

  return { data: arricchiti, error: null }
}

// ------------------------------------------------------------
// Rimuove un membro (o se stessi, per uscire dal viaggio) — la
// policy RLS decide chi può farlo: se stessi sempre, altri solo
// se chi chiama è il proprietario.
// ------------------------------------------------------------

export async function rimuoviMembro(
  viaggioId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('viaggio_membri')
    .delete()
    .eq('viaggio_id', viaggioId)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}
