import { supabase } from '@/lib/supabase'
import type { Profilo } from '@/types'

// ============================================================
// ROAMLY — Profilo Service
// Responsabilità: lettura e aggiornamento tabella `profili`.
// Il profilo viene CREATO dal trigger DB alla registrazione.
// Il frontend lo legge e lo aggiorna — non lo crea mai direttamente.
// ============================================================

// ------------------------------------------------------------
// Legge il profilo dell'utente corrente
// ------------------------------------------------------------

export async function getProfilo(userId: string): Promise<{
  data: Profilo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('profili')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    // PGRST116 = nessuna riga trovata — profilo non ancora creato dal trigger
    if (error.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error: error.message }
  }

  return { data: data as Profilo, error: null }
}

// ------------------------------------------------------------
// Aggiorna il profilo (solo campi modificabili dall'utente nel MVP)
// ------------------------------------------------------------

export type AggiornamentoProfilo = {
  display_name?: string
}

export async function aggiornaProfilo(
  userId: string,
  payload: AggiornamentoProfilo
): Promise<{
  data: Profilo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('profili')
    .update(payload)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Profilo, error: null }
}
