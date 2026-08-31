import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/types'
import type { Profilo } from '@/types'

// ============================================================
// ROAMLY — Profilo Service
// Responsabilità: lettura e aggiornamento tabella `profili`
// + upload foto profilo su Storage (bucket profili-avatar).
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
// Aggiorna il profilo (campi modificabili dall'utente)
// ------------------------------------------------------------

export type AggiornamentoProfilo = {
  display_name?: string
  bio?: string | null
  avatar_url?: string | null
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

// ------------------------------------------------------------
// Upload foto profilo
// Path fisso {userId}/avatar.{ext} con upsert:true — ogni nuovo
// upload sovrascrive il precedente, niente file orfani da pulire.
// Bucket pubblico: la URL restituita è già quella finale utilizzabile
// (non serve risolvere una signed URL come per le foto dei ricordi).
// ------------------------------------------------------------

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const estensione = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/avatar.${estensione}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.AVATAR_PROFILI)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.AVATAR_PROFILI)
    .getPublicUrl(path)

  // Cache-bust: stesso path ad ogni upload, senza query param il
  // browser mostrerebbe l'immagine vecchia dalla cache.
  const urlConCacheBust = `${data.publicUrl}?t=${Date.now()}`

  return { url: urlConCacheBust, error: null }
}
