import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — Crediti Service
// Il saldo (profili.crediti) si legge già con getProfilo() — qui
// solo lo storico transazioni e le funzioni RPC (unica via di
// scrittura, vedi trigger blocca_modifica_diretta_crediti in DB).
// ============================================================

export interface TransazioneCredito {
  id: string
  user_id: string
  importo: number
  motivo: string
  created_at: string
}

// ------------------------------------------------------------
// Storico movimenti dell'utente corrente
// ------------------------------------------------------------

export async function getStoricoCrediti(userId: string): Promise<{
  data: TransazioneCredito[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('transazioni_crediti')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as TransazioneCredito[], error: null }
}

// ------------------------------------------------------------
// completaAzione — chiamata "a consuntivo" dopo un'azione (foto
// profilo caricata, primo viaggio creato...). Idempotente lato
// server: se già riscossa, ritorna 0 senza errore.
// ------------------------------------------------------------

export async function completaAzione(azione: string): Promise<{
  crediti: number
  error: string | null
}> {
  const { data, error } = await supabase.rpc('completa_azione', { p_azione: azione })
  if (error) return { crediti: 0, error: error.message }
  return { crediti: (data as number) ?? 0, error: null }
}

// ------------------------------------------------------------
// Codice referral dell'utente corrente (creato al primo utilizzo)
// ------------------------------------------------------------

export async function ottieniCodiceReferral(): Promise<{
  codice: string | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('ottieni_codice_referral')
  if (error) return { codice: null, error: error.message }
  return { codice: data as string, error: null }
}

// ------------------------------------------------------------
// Riscatta un codice referral altrui — una sola volta per utente,
// va chiamata dopo la conferma email (serve una sessione attiva).
// ------------------------------------------------------------

export async function redimiCodiceReferral(codice: string): Promise<{
  crediti: number
  error: string | null
}> {
  const { data, error } = await supabase.rpc('redimi_codice_referral', { p_codice: codice })
  if (error) return { crediti: 0, error: error.message }
  return { crediti: (data as number) ?? 0, error: null }
}
