import { supabase } from '@/lib/supabase'
import type { Notifica } from '@/types'

// ============================================================
// ROAMLY — Notifiche Service (feed)
// Sola lettura + segna-come-letta lato client: le righe si creano
// solo dal trigger DB (nuovo membro) o dalla Edge Function con la
// service_role key (promemoria prenotazioni) — vedi
// supabase-migration-notifiche-feed.sql.
// ============================================================

export async function getNotifiche(): Promise<{ data: Notifica[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notifiche')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Notifica[], error: null }
}

export async function segnaNotificaLetta(id: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifiche')
    .update({ letta: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { error: null }
}

export async function segnaTutteLette(userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notifiche')
    .update({ letta: true })
    .eq('user_id', userId)
    .eq('letta', false)

  if (error) return { error: error.message }
  return { error: null }
}
