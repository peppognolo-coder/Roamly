import { supabase } from '@/lib/supabase'
import type { Viaggio, NuovoViaggio, ModificaViaggio } from '@/types'
import {
  getFotoByViaggio,
  deleteFilesDaStorage,
  deleteFotoRecordsByViaggio,
} from '@/services/fotoService'

// ============================================================
// ROAMLY — Viaggi Service
// Responsabilità: chiamate alla tabella `viaggi` su Supabase.
// Nessuna logica UI, nessun side-effect su store o router.
// Lo stato derivato (stato_effettivo) viene calcolato nei hook,
// non qui — il service lavora sempre con Viaggio raw.
// ============================================================

// ------------------------------------------------------------
// getViaggi — lista completa dell'utente
// Ordinata per data_inizio DESC (viaggi più recenti prima).
// I viaggi senza data sono in fondo.
// ------------------------------------------------------------

export async function getViaggi(): Promise<{
  data: Viaggio[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggi')
    .select('*')
    .order('data_inizio', { ascending: false, nullsFirst: false })

  if (error) return { data: [], error: error.message }
  return { data: data as Viaggio[], error: null }
}

// ------------------------------------------------------------
// getViaggio — singolo viaggio per ID
// ------------------------------------------------------------

export async function getViaggio(viaggioId: string): Promise<{
  data: Viaggio | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggi')
    .select('*')
    .eq('id', viaggioId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null } // non trovato
    return { data: null, error: error.message }
  }

  return { data: data as Viaggio, error: null }
}

// ------------------------------------------------------------
// createViaggio — crea un nuovo viaggio
// user_id viene passato esplicitamente per sicurezza
// (RLS lo garantisce lato DB, ma essere espliciti è buona pratica)
// ------------------------------------------------------------

export async function createViaggio(
  userId: string,
  payload: NuovoViaggio
): Promise<{
  data: Viaggio | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggi')
    .insert({ ...payload, user_id: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Viaggio, error: null }
}

// ------------------------------------------------------------
// updateViaggio — aggiornamento selettivo
// Non tocca user_id o created_at
// ------------------------------------------------------------

export async function updateViaggio(
  viaggioId: string,
  payload: ModificaViaggio
): Promise<{
  data: Viaggio | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('viaggi')
    .update(payload)
    .eq('id', viaggioId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Viaggio, error: null }
}

// ------------------------------------------------------------
// deleteViaggio — eliminazione viaggio con cleanup Storage completo
//
// Sequenza con consistenza forte:
//   1. Recupera TUTTE le foto di tutti i ricordi del viaggio
//   2. Elimina i file fisici da Storage
//   3. Se Storage delete fallisce → blocca, restituisce errore
//      Il viaggio rimane intatto — nessun file orfano
//   4. Elimina righe tabella foto (tutti i ricordi del viaggio)
//   5. Elimina il viaggio — ON DELETE CASCADE elimina ricordi
//      e checklist_items automaticamente
//
// NOTA: checklist_items e ricordi vengono eliminati dal CASCADE
// del DB. Le righe foto NON hanno CASCADE — eliminate al passo 4.
// ------------------------------------------------------------

export async function deleteViaggio(
  viaggioId: string
): Promise<{
  error: string | null
}> {
  // 1. Recupera tutte le foto di tutti i ricordi del viaggio
  const { data: foto, error: errFoto } = await getFotoByViaggio(viaggioId)
  if (errFoto) return { error: `Impossibile leggere le foto: ${errFoto}` }

  // 2. Elimina file fisici da Storage (solo se esistono foto)
  if (foto.length > 0) {
    // Raggruppa per bucket (nel MVP è sempre lo stesso, ma futuro-proof)
    const perBucket = foto.reduce<Record<string, string[]>>((acc, f) => {
      if (!acc[f.bucket]) acc[f.bucket] = []
      acc[f.bucket].push(f.path)
      return acc
    }, {})

    for (const [bucket, paths] of Object.entries(perBucket)) {
      const { falliti } = await deleteFilesDaStorage(paths, bucket)
      if (falliti.length > 0) {
        const dettaglio = falliti.map((f) => f.error).join('; ')
        return {
          error: `Impossibile eliminare ${falliti.length} file dallo Storage: ${dettaglio}`,
        }
      }
    }

    // 3. Elimina righe DB tabella foto
    const { error: errDeleteFoto } = await deleteFotoRecordsByViaggio(viaggioId)
    if (errDeleteFoto) {
      // File già rimossi ma righe non eliminate — stesso trade-off di deleteRicordo.
      // Procediamo: il CASCADE sul viaggio NON elimina le foto (no CASCADE).
      // Le righe foto rimangono orfane ma non causano problemi funzionali.
      console.error('[deleteViaggio] Righe foto non eliminate:', errDeleteFoto)
    }
  }

  // 4. Elimina il viaggio (CASCADE su ricordi e checklist_items)
  const { error } = await supabase
    .from('viaggi')
    .delete()
    .eq('id', viaggioId)

  if (error) return { error: error.message }
  return { error: null }
}

// ------------------------------------------------------------
// getStatisticheViaggio — conta ricordi, preferiti, highlight
// per la sezione statistiche in ViaggioDetailPage.
// Tre count separati per mantenere query semplici e leggibili.
// ------------------------------------------------------------

export async function getStatisticheViaggio(viaggioId: string): Promise<{
  data: { ricordi: number; preferiti: number; highlight: number }
  error: string | null
}> {
  const [totaleRes, preferitiRes, highlightRes] = await Promise.all([
    supabase
      .from('ricordi')
      .select('id', { count: 'exact', head: true })
      .eq('viaggio_id', viaggioId),
    supabase
      .from('ricordi')
      .select('id', { count: 'exact', head: true })
      .eq('viaggio_id', viaggioId)
      .eq('preferito', true),
    supabase
      .from('ricordi')
      .select('id', { count: 'exact', head: true })
      .eq('viaggio_id', viaggioId)
      .eq('highlight', true),
  ])

  if (totaleRes.error || preferitiRes.error || highlightRes.error) {
    return {
      data: { ricordi: 0, preferiti: 0, highlight: 0 },
      error: 'Impossibile caricare le statistiche.',
    }
  }

  return {
    data: {
      ricordi:   totaleRes.count   ?? 0,
      preferiti: preferitiRes.count ?? 0,
      highlight: highlightRes.count ?? 0,
    },
    error: null,
  }
}
