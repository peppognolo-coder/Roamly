import { supabase } from '@/lib/supabase'
import type { Badge, UserBadge } from '@/types'

// ============================================================
// ROAMLY — Badges Service
// ============================================================

export async function getCatalogoBadges(): Promise<{
  data: Badge[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as Badge[], error: null }
}

export async function getUserBadges(userId: string): Promise<{
  data: UserBadge[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)

  if (error) return { data: [], error: error.message }
  return { data: data as UserBadge[], error: null }
}

/** Traguardi appena sbloccati da questa chiamata (vuoto se nessuno) */
export async function verificaTraguardi(): Promise<{
  nuovi: Array<{ codice: string; nome: string; descrizione: string | null; icona: string | null }>
  error: string | null
}> {
  const { data, error } = await supabase.rpc('verifica_traguardi')
  if (error) return { nuovi: [], error: error.message }
  return { nuovi: data ?? [], error: null }
}
