import { supabase } from '@/lib/supabase'
import type { ViaggioCondivisione, ViaggioPubblico } from '@/types'

// ============================================================
// ROAMLY — Condivisione pubblica del viaggio
// Link /v/:token apribile senza account. Tutta la lettura
// pubblica passa dalla funzione SQL viaggio_pubblico(token).
// ============================================================

const BUCKET = 'ricordi-foto'

function nuovoToken(): string {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('') // 20 caratteri
}

export function urlPubblico(token: string): string {
  return `${window.location.origin}/v/${token}`
}

export async function getCondivisione(viaggioId: string): Promise<{
  data: ViaggioCondivisione | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggi_condivisione')
    .select('viaggio_id, token, attivo, created_at')
    .eq('viaggio_id', viaggioId)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  return { data: data as ViaggioCondivisione | null, error: null }
}

/** Attiva il link (lo crea la prima volta, poi lo riattiva col token di prima). */
export async function attivaCondivisione(viaggioId: string, userId: string): Promise<{ error: string | null }> {
  const { data: esistente, error: errLettura } = await supabase
    .from('viaggi_condivisione')
    .select('token')
    .eq('viaggio_id', viaggioId)
    .maybeSingle()
  if (errLettura) return { error: errLettura.message }

  if (esistente) {
    const { error } = await supabase.from('viaggi_condivisione').update({ attivo: true }).eq('viaggio_id', viaggioId)
    return { error: error?.message ?? null }
  }
  const { error } = await supabase
    .from('viaggi_condivisione')
    .insert({ viaggio_id: viaggioId, creato_da: userId, token: nuovoToken(), attivo: true })
  return { error: error?.message ?? null }
}

export async function disattivaCondivisione(viaggioId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('viaggi_condivisione').update({ attivo: false }).eq('viaggio_id', viaggioId)
  return { error: error?.message ?? null }
}

/** Genera un nuovo indirizzo: il vecchio smette subito di funzionare. */
export async function rigeneraLink(viaggioId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('viaggi_condivisione')
    .update({ token: nuovoToken(), attivo: true })
    .eq('viaggio_id', viaggioId)
  return { error: error?.message ?? null }
}

export async function impostaRicordoNascosto(ricordoId: string, nascosto: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('imposta_ricordo_nascosto', { p_ricordo: ricordoId, p_nascosto: nascosto })
  return { error: error?.message ?? null }
}

// ------------------------------------------------------------
// Pagina pubblica (chiamate fatte anche da utenti non loggati)
// ------------------------------------------------------------

export async function getViaggioPubblico(token: string): Promise<{
  data: ViaggioPubblico | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('viaggio_pubblico', { p_token: token })
  if (error) return { data: null, error: error.message }
  return { data: (data as ViaggioPubblico | null) ?? null, error: null }
}

/** URL firmati (1 ora) per i path delle foto pubbliche, nello stesso ordine. */
export async function getFotoPubbliche(paths: string[]): Promise<Map<string, string>> {
  const mappa = new Map<string, string>()
  if (paths.length === 0) return mappa
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
  data?.forEach((r) => { if (r.path && r.signedUrl) mappa.set(r.path, r.signedUrl) })
  return mappa
}
