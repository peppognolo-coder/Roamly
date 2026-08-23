import { supabase } from '@/lib/supabase'
import type { Ricordo, NuovoRicordo, ModificaRicordo } from '@/types'
import {
  getFotoByRicordo,
  deleteFilesDaStorage,
  deleteFotoRecordsByRicordo,
} from '@/services/fotoService'

// ============================================================
// ROAMLY — Ricordi Service
// Responsabilità: chiamate alla tabella `ricordi` su Supabase.
// Ordinamento canonico: data DESC, created_at DESC.
// Nessuna logica UI, nessun side-effect.
//
// NOTA TECNICA — Ricordo del Giorno (B45, Sprint 5):
// La funzione `getRicordiDelViaggio` restituisce già tutti i campi
// necessari per la selezione del Ricordo del Giorno.
// La logica di selezione (highlight → preferito → random) verrà
// implementata lato client in Sprint 5 usando la cache React Query
// di `queryKeys.ricordi.recenti(userId)` — senza fetch aggiuntivi.
// Non serve una endpoint dedicata: il client filtra dalla cache.
// ============================================================

// ------------------------------------------------------------
// Ordinamento canonico — usato in tutte le query lista
// ------------------------------------------------------------
const ORDER_DATA_DESC = { ascending: false } as const

// ------------------------------------------------------------
// getRicordiDelViaggio — lista ricordi per viaggio
// Ordinamento: data DESC, created_at DESC
// ------------------------------------------------------------

export async function getRicordiDelViaggio(viaggioId: string): Promise<{
  data: Ricordo[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('data', ORDER_DATA_DESC)
    .order('created_at', ORDER_DATA_DESC)

  if (error) return { data: [], error: error.message }
  return { data: data as Ricordo[], error: null }
}

// ------------------------------------------------------------
// getRicordo — singolo ricordo per ID
// ------------------------------------------------------------

export async function getRicordo(ricordoId: string): Promise<{
  data: Ricordo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .select('*')
    .eq('id', ricordoId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { data: null, error: null }
    return { data: null, error: error.message }
  }

  return { data: data as Ricordo, error: null }
}

// ------------------------------------------------------------
// getRicordiRecenti — ultimi N ricordi dell'utente (Home + B45)
// Ordinamento: data DESC, created_at DESC
// ------------------------------------------------------------

export async function getRicordiRecenti(userId: string, limit = 10): Promise<{
  data: Ricordo[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .select('*')
    .eq('user_id', userId)
    .order('data', ORDER_DATA_DESC)
    .order('created_at', ORDER_DATA_DESC)
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return { data: data as Ricordo[], error: null }
}

// ------------------------------------------------------------
// createRicordo — crea un nuovo ricordo
// ------------------------------------------------------------

export async function createRicordo(
  userId: string,
  payload: NuovoRicordo
): Promise<{
  data: Ricordo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .insert({
      ...payload,
      user_id: userId,
      tipo: payload.tipo ?? 'testo',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Ricordo, error: null }
}

// ------------------------------------------------------------
// updateRicordo — aggiornamento selettivo
// ------------------------------------------------------------

export async function updateRicordo(
  ricordoId: string,
  payload: ModificaRicordo
): Promise<{
  data: Ricordo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .update(payload)
    .eq('id', ricordoId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Ricordo, error: null }
}

// ------------------------------------------------------------
// deleteRicordo — eliminazione ricordo con cleanup Storage
//
// Sequenza con consistenza forte:
//   1. Recupera path foto PRIMA di eliminare (tabella foto)
//   2. Elimina file fisici da Storage
//   3. Se Storage delete fallisce → blocca, restituisce errore
//      Il ricordo rimane intatto — nessun file orfano
//   4. Elimina righe tabella foto
//   5. Elimina il ricordo
//
// TRADE-OFF: se Storage delete riesce parzialmente e poi fallisce,
// alcuni file fisici potrebbero essere già stati rimossi ma il
// ricordo sopravvive. Documentato in fotoService.ts.
// ------------------------------------------------------------

export async function deleteRicordo(
  ricordoId: string,
  userId: string    // richiesto per validazione ownership path Storage
): Promise<{
  error: string | null
}> {
  // 1. Recupera le foto del ricordo
  const { data: foto, error: errFoto } = await getFotoByRicordo(ricordoId)
  if (errFoto) return { error: `Impossibile leggere le foto: ${errFoto}` }

  // 2. Elimina file fisici da Storage (solo se esistono foto)
  if (foto.length > 0) {
    const paths = foto.map((f) => f.path)
    const { falliti } = await deleteFilesDaStorage(paths, foto[0].bucket, userId)

    if (falliti.length > 0) {
      // Blocca: non procedere con la cancellazione del ricordo
      // per evitare path orfani senza file corrispondente
      const dettaglio = falliti.map((f) => f.error).join('; ')
      return { error: `Impossibile eliminare ${falliti.length} file dallo Storage: ${dettaglio}` }
    }

    // 3. Elimina righe DB tabella foto
    const { error: errDeleteFoto } = await deleteFotoRecordsByRicordo(ricordoId)
    if (errDeleteFoto) {
      // File già rimossi da Storage ma righe DB non eliminate.
      // Stato inconsistente ma recuperabile: le righe foto puntano
      // a file non più esistenti. Log dell'errore, procediamo
      // comunque con la cancellazione del ricordo.
      console.error('[deleteRicordo] Righe foto non eliminate:', errDeleteFoto)
    }
  }

  // 4. Elimina il ricordo
  const { error } = await supabase
    .from('ricordi')
    .delete()
    .eq('id', ricordoId)

  if (error) return { error: error.message }
  return { error: null }
}

// ------------------------------------------------------------
// togglePreferito — aggiornamento isolato del campo preferito
// Separato da updateRicordo per semantica distinta e
// per supportare aggiornamento ottimistico nel hook.
// ------------------------------------------------------------

export async function togglePreferito(
  ricordoId: string,
  valore: boolean
): Promise<{
  data: Ricordo | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('ricordi')
    .update({ preferito: valore })
    .eq('id', ricordoId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Ricordo, error: null }
}

// ------------------------------------------------------------
// getStatisticheUtente — Quick Stats per la Home
// Tre query parallele in Promise.all — pattern coerente con
// getStatisticheViaggio (Sprint 2).
//
// Regole:
//   viaggi  = totale viaggi dell'utente (tutti, inclusi senza ricordi)
//   ricordi = totale ricordi dell'utente
//   paesi   = paesi distinti associati a viaggi con almeno un ricordo
//             (non conta viaggi pianificati mai documentati)
// ------------------------------------------------------------

export interface StatisticheUtente {
  viaggi: number
  ricordi: number
  paesi: number
}

export async function getStatisticheUtente(userId: string): Promise<{
  data: StatisticheUtente
  error: string | null
}> {
  const [totViaggiRes, totRicordiRes, paesiRes] = await Promise.all([
    // viaggi = totale viaggi dell'utente (tutti, inclusi senza ricordi)
    supabase
      .from('viaggi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),

    // ricordi = totale ricordi dell'utente
    supabase
      .from('ricordi')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),

    // paesi = paesi distinti dei viaggi che hanno almeno un ricordo.
    // Il join !inner garantisce che vengano restituiti solo i ricordi
    // associati a un viaggio con paese valorizzato.
    // La deduplicazione avviene client-side con Set<string>.
    supabase
      .from('ricordi')
      .select('viaggi!inner(paese)')
      .eq('user_id', userId)
      .not('viaggi.paese', 'is', null),
  ])

  if (totViaggiRes.error || totRicordiRes.error || paesiRes.error) {
    return {
      data: { viaggi: 0, ricordi: 0, paesi: 0 },
      error: 'Impossibile caricare le statistiche.',
    }
  }

  // Deduplicazione paesi client-side
  const righe = (paesiRes.data ?? []) as unknown as Array<{ viaggi: { paese: string | null } }>
  const paesiDistinti = new Set(
    righe
      .map((r) => r.viaggi?.paese)
      .filter((p): p is string => !!p)
  )

  return {
    data: {
      viaggi:  totViaggiRes.count  ?? 0,
      ricordi: totRicordiRes.count ?? 0,
      paesi:   paesiDistinti.size,
    },
    error: null,
  }
}
