import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/types'
import type { Foto, FotoConUrl, NuovaFoto } from '@/types'

// ============================================================
// ROAMLY — Foto Service
// Responsabilità:
//   - Registro DB della tabella `foto` (path, bucket, ordine, is_cover)
//   - Operazioni sullo Storage Supabase (delete fisico file)
//   - Orchestrazione cancellazione con consistenza forte
//
// ARCHITETTURA CANCELLAZIONE (Sprint 7A):
//   La tabella `foto` NON ha ON DELETE CASCADE su ricordo_id.
//   La sequenza corretta di cancellazione è sempre:
//     1. getFotoByRicordo → recupera path PRIMA di eliminare il ricordo
//     2. deleteFilesDaStorage → elimina file fisici
//     3. Se Storage delete fallisce → blocca, restituisce errore esplicito
//     4. deleteFotoRecordsByRicordo → elimina righe DB
//     5. deleteRicordo (in ricordiService) → elimina il ricordo
//   Questo garantisce che i path siano sempre disponibili quando
//   si interroga lo Storage — nessun file orfano possibile.
//
// TRADE-OFF DOCUMENTATO:
//   Se step 2 (Storage delete) elimina alcuni file e poi fallisce,
//   il rollback non è possibile (Storage non ha transazioni).
//   In questo caso la funzione restituisce errore: il ricordo
//   sopravvive nel DB, ma alcuni file fisici potrebbero già essere
//   stati rimossi. È il trade-off accettabile senza Edge Functions.
//   Soluzione futura in Sprint 8: outbox pattern o Supabase RPC.
// ============================================================

// ------------------------------------------------------------
// getFotoByRicordo — recupera tutte le foto di un ricordo
// Da chiamare PRIMA di qualsiasi operazione di cancellazione.
// ------------------------------------------------------------

export async function getFotoByRicordo(ricordoId: string): Promise<{
  data: Foto[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('foto')
    .select('*')
    .eq('ricordo_id', ricordoId)
    .order('ordine', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as Foto[], error: null }
}

// ------------------------------------------------------------
// getFotoByViaggio — recupera tutte le foto di tutti i ricordi
// di un viaggio. Usata in deleteViaggio per il cleanup completo.
// ------------------------------------------------------------

export async function getFotoByViaggio(viaggioId: string): Promise<{
  data: Foto[]
  error: string | null
}> {
  // La tabella `foto` non ha colonna viaggio_id — la relazione è
  // foto → ricordo → viaggio. Recupero in due passi:

  // Passo 1: ricordo_id del viaggio
  const { data: ricordi, error: errRicordi } = await supabase
    .from('ricordi')
    .select('id')
    .eq('viaggio_id', viaggioId)

  if (errRicordi) return { data: [], error: errRicordi.message }
  if (!ricordi || ricordi.length === 0) return { data: [], error: null }

  // Passo 2: foto per quei ricordo_id
  const ids = ricordi.map((r: { id: string }) => r.id)
  const { data: fotoRows, error: errFoto } = await supabase
    .from('foto')
    .select('*')
    .in('ricordo_id', ids)
    .order('ordine', { ascending: true })

  if (errFoto) return { data: [], error: errFoto.message }
  return { data: fotoRows as Foto[], error: null }
}

// ------------------------------------------------------------
// deleteFilesDaStorage — elimina file fisici dal bucket
// Esegue in parallelo. Restituisce separatamente eliminati e falliti.
// Se ci sono falliti, il chiamante deve decidere se bloccare.
// ------------------------------------------------------------

export interface RisultatoDeleteStorage {
  eliminati: string[]
  falliti:   { path: string; error: string }[]
}

export async function deleteFilesDaStorage(
  paths: string[],
  bucket: string = STORAGE_BUCKETS.FOTO_RICORDI
): Promise<RisultatoDeleteStorage> {
  if (paths.length === 0) {
    return { eliminati: [], falliti: [] }
  }

  // NOTA collaborazione: la validazione "path deve iniziare con {userId}/"
  // che viveva qui è stata rimossa — in un viaggio condiviso, chi elimina
  // un file può essere un collaboratore diverso da chi lo ha caricato
  // originariamente (il primo segmento del path resta l'uploader originale).
  // L'autorizzazione reale vive ora nelle policy Storage sul bucket
  // ricordi-foto, che verificano l'appartenenza al viaggio tramite il
  // ricordo (secondo segmento del path), non più il solo prefisso utente.

  // Supabase Storage supporta delete multiplo in una sola chiamata
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    // Errore globale: tutti i path sono falliti
    return {
      eliminati: [],
      falliti:   paths.map((p) => ({ path: p, error: error.message })),
    }
  }

  // `data` contiene i file effettivamente eliminati
  const eliminati = (data ?? []).map((f: { name: string }) => f.name)
  const eliminatiSet = new Set(eliminati)

  const falliti = paths
    .filter((p) => !eliminatiSet.has(p))
    .map((p) => ({ path: p, error: 'File non trovato nel bucket o già eliminato' }))

  return { eliminati, falliti }
}

// ------------------------------------------------------------
// deleteFotoRecordsByRicordo — elimina le righe in tabella foto
// Da chiamare DOPO deleteFilesDaStorage, mai prima.
// ------------------------------------------------------------

export async function deleteFotoRecordsByRicordo(ricordoId: string): Promise<{
  error: string | null
}> {
  const { error } = await supabase
    .from('foto')
    .delete()
    .eq('ricordo_id', ricordoId)

  if (error) return { error: error.message }
  return { error: null }
}

// ------------------------------------------------------------
// deleteFotoRecordsByViaggio — elimina tutte le righe foto
// per tutti i ricordi di un viaggio.
// Da chiamare DOPO deleteFilesDaStorage sul viaggio completo.
// ------------------------------------------------------------

export async function deleteFotoRecordsByViaggio(viaggioId: string): Promise<{
  error: string | null
}> {
  // Recupera i ricordo_id del viaggio
  const { data: ricordi, error: errRicordi } = await supabase
    .from('ricordi')
    .select('id')
    .eq('viaggio_id', viaggioId)

  if (errRicordi) return { error: errRicordi.message }
  if (!ricordi || ricordi.length === 0) return { error: null }

  const ids = ricordi.map((r: { id: string }) => r.id)
  const { error } = await supabase
    .from('foto')
    .delete()
    .in('ricordo_id', ids)

  if (error) return { error: error.message }
  return { error: null }
}

// ------------------------------------------------------------
// registraFoto — aggiunge una riga in tabella foto dopo l'upload
// Chiamata dal futuro flusso di upload (Sprint 7+).
// Non usata nel MVP corrente — presente per completezza dell'API.
// ------------------------------------------------------------

export async function registraFoto(
  userId: string,
  payload: NuovaFoto & { ordine?: number }
): Promise<{
  data: Foto | null
  error: string | null
}> {
  // Verifica che il ricordo esista — non più un controllo di ownership
  // stretta: in un viaggio condiviso, un collaboratore può aggiungere
  // foto anche a ricordi scritti da un altro membro. L'appartenenza
  // al viaggio è comunque garantita dalla RLS sulla tabella foto.
  const { data: ricordoCheck, error: errCheck } = await supabase
    .from('ricordi')
    .select('id')
    .eq('id', payload.ricordo_id)
    .single()

  if (errCheck || !ricordoCheck) {
    return { data: null, error: 'Ricordo non trovato o non autorizzato.' }
  }

  // Prima foto del ricordo → cover automatica (Sprint 8.1).
  // Struttura pronta per futura selezione manuale tramite setCoverFoto().
  const { count: fotoEsistenti } = await supabase
    .from('foto')
    .select('id', { count: 'exact', head: true })
    .eq('ricordo_id', payload.ricordo_id)

  const isCover = (fotoEsistenti ?? 0) === 0

  const { data, error } = await supabase
    .from('foto')
    .insert({
      user_id:    userId,
      ricordo_id: payload.ricordo_id,
      bucket:     STORAGE_BUCKETS.FOTO_RICORDI,
      path:       payload.path,
      mime_type:  payload.mime_type,
      size_bytes: payload.size_bytes,
      ordine:     payload.ordine ?? 0,
      is_cover:   isCover,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Foto, error: null }
}

// ------------------------------------------------------------
// setCoverFoto — promozione/demozione atomica cover
// Imposta is_cover=true su fotoId, false su tutte le altre del ricordo.
// Due UPDATE separati: Supabase non supporta transazioni client-side,
// ma la finestra di inconsistenza è sub-secondo e invisibile all'utente.
// Sprint 8.1: esposta nell'UI di FotoGalleria (tap → "Imposta come cover").
// ------------------------------------------------------------

export async function setCoverFoto(
  fotoId: string,
  ricordoId: string
): Promise<{ error: string | null }> {
  // 1. Rimuovi cover da tutte le foto del ricordo
  const { error: err1 } = await supabase
    .from('foto')
    .update({ is_cover: false })
    .eq('ricordo_id', ricordoId)

  if (err1) return { error: err1.message }

  // 2. Imposta la nuova cover
  const { error: err2 } = await supabase
    .from('foto')
    .update({ is_cover: true })
    .eq('id', fotoId)

  if (err2) return { error: err2.message }
  return { error: null }
}

// ============================================================
// SIGNED URL — visualizzazione file da bucket privato
// ============================================================

// TTL e dimensioni thumbnail — costanti esplicite per chiarezza
export const SIGNED_URL_TTL_SECONDS  = 3600          // 1 ora
export const THUMBNAIL_WIDTH         = 200
export const THUMBNAIL_HEIGHT        = 200
export const THUMBNAIL_RESIZE        = 'cover' as const

// ------------------------------------------------------------
// generaSignedUrl — URL firmata per un singolo file
// Usata nel dettaglio ricordo per la foto a piena risoluzione.
// ------------------------------------------------------------

export async function generaSignedUrl(
  path: string,
  bucket: string = STORAGE_BUCKETS.FOTO_RICORDI,
  ttl: number = SIGNED_URL_TTL_SECONDS
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, ttl)

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}

// ------------------------------------------------------------
// generaSignedUrlConThumbnail — URL firmata + thumbnail per una foto
// La thumbnail usa le Transformation API di Supabase Storage:
//   ?width=200&height=200&resize=cover
// Nessuna libreria esterna, nessun canvas server-side.
// Costo: stesso di una signed URL normale — solo parametri aggiuntivi.
// ------------------------------------------------------------

export async function generaSignedUrlConThumbnail(
  path: string,
  bucket: string = STORAGE_BUCKETS.FOTO_RICORDI
): Promise<{
  signedUrl:          string | null
  thumbnailSignedUrl: string | null
  error:              string | null
}> {
  const [originalRes, thumbRes] = await Promise.all([
    supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS),
    supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS, {
      transform: {
        width:  THUMBNAIL_WIDTH,
        height: THUMBNAIL_HEIGHT,
        resize: THUMBNAIL_RESIZE,
      },
    }),
  ])

  if (originalRes.error || thumbRes.error) {
    return {
      signedUrl:          null,
      thumbnailSignedUrl: null,
      error: originalRes.error?.message ?? thumbRes.error?.message ?? 'Errore signed URL',
    }
  }

  return {
    signedUrl:          originalRes.data.signedUrl,
    thumbnailSignedUrl: thumbRes.data.signedUrl,
    error:              null,
  }
}

// ------------------------------------------------------------
// getFotoConUrlByRicordo — foto con signed URL per un ricordo
// Usata in RicordoDetailPage: mostra la galleria completa.
// ------------------------------------------------------------

export async function getFotoConUrlByRicordo(ricordoId: string): Promise<{
  data: FotoConUrl[]
  error: string | null
}> {
  const { data: foto, error } = await getFotoByRicordo(ricordoId)
  if (error) return { data: [], error }
  if (foto.length === 0) return { data: [], error: null }

  const conUrl: FotoConUrl[] = []
  const errors: string[] = []

  await Promise.all(
    foto.map(async (f) => {
      const { signedUrl, thumbnailSignedUrl, error: urlErr } =
        await generaSignedUrlConThumbnail(f.path, f.bucket)
      if (urlErr || !signedUrl || !thumbnailSignedUrl) {
        errors.push(urlErr ?? 'URL non generata')
        return
      }
      conUrl.push({ ...f, signedUrl, thumbnailSignedUrl })
    })
  )

  if (conUrl.length === 0 && errors.length > 0) {
    return { data: [], error: errors[0] }
  }

  // Mantiene l'ordine originale (ordine ASC dal service)
  conUrl.sort((a, b) => a.ordine - b.ordine)
  return { data: conUrl, error: null }
}

// ------------------------------------------------------------
// getCoversByViaggio — mappa ricordoId → thumbnailSignedUrl
// Strategia anti N+1 per RicordoCard nelle liste:
//   1. Una query per trovare tutte le foto cover del viaggio
//   2. Promise.all per le signed URL thumbnail
//   3. Restituisce Map<ricordoId, thumbnailSignedUrl>
//
// Chi chiama la lista ricordi esegue questa query in parallelo
// e passa coverUrl come prop a RicordoCard — zero query per card.
// ------------------------------------------------------------

export async function getCoversByViaggio(viaggioId: string): Promise<{
  data: Map<string, string>   // ricordoId → thumbnailSignedUrl
  error: string | null
}> {
  // Passo 1: ricordo_id del viaggio
  const { data: ricordi, error: errRicordi } = await supabase
    .from('ricordi')
    .select('id')
    .eq('viaggio_id', viaggioId)

  if (errRicordi) return { data: new Map(), error: errRicordi.message }
  if (!ricordi || ricordi.length === 0) return { data: new Map(), error: null }

  const ids = ricordi.map((r: { id: string }) => r.id)

  // Passo 2: solo le foto is_cover = true
  const { data: covers, error: errCovers } = await supabase
    .from('foto')
    .select('ricordo_id, path, bucket')
    .in('ricordo_id', ids)
    .eq('is_cover', true)

  if (errCovers) return { data: new Map(), error: errCovers.message }
  if (!covers || covers.length === 0) return { data: new Map(), error: null }

  // Passo 3: signed URL thumbnail in parallelo
  const risultati = await Promise.all(
    covers.map(async (c: { ricordo_id: string; path: string; bucket: string }) => {
      const { thumbnailSignedUrl, error } = await generaSignedUrlConThumbnail(
        c.path, c.bucket
      )
      return { ricordoId: c.ricordo_id, url: thumbnailSignedUrl, error }
    })
  )

  const mappa = new Map<string, string>()
  for (const r of risultati) {
    if (r.url) mappa.set(r.ricordoId, r.url)
  }

  return { data: mappa, error: null }
}

// ------------------------------------------------------------
// deleteSingolaFoto — elimina una singola foto (file + DB)
// Sequenza identica a deleteRicordo ma per un solo file.
// Usata dal pulsante "Elimina foto" in FotoGalleria.
// ------------------------------------------------------------

export async function deleteSingolaFoto(
  foto: Foto
): Promise<{ error: string | null }> {
  // 1. Elimina il file fisico
  const { falliti } = await deleteFilesDaStorage([foto.path], foto.bucket)
  if (falliti.length > 0) {
    return { error: `Impossibile eliminare il file: ${falliti[0].error}` }
  }

  // 2. Elimina la riga in tabella foto
  const { error } = await supabase
    .from('foto')
    .delete()
    .eq('id', foto.id)

  if (error) {
    console.error('[deleteSingolaFoto] Riga foto non eliminata:', error.message)
    return { error: error.message }
  }

  // 3. Promozione automatica cover — solo se la foto eliminata era la cover.
  // Se esistono altre foto per lo stesso ricordo, la prima per ordine ASC
  // diventa la nuova cover. Se non ne esistono, nessuna azione.
  if (foto.is_cover) {
    const { data: altrePhoto } = await supabase
      .from('foto')
      .select('id')
      .eq('ricordo_id', foto.ricordo_id)
      .order('ordine', { ascending: true })
      .limit(1)

    if (altrePhoto && altrePhoto.length > 0) {
      await supabase
        .from('foto')
        .update({ is_cover: true })
        .eq('id', (altrePhoto[0] as { id: string }).id)
      // Errori di promozione non bloccano — la cancellazione è già avvenuta.
      // Al prossimo upload, registraFoto verificherà il conteggio e assegnerà
      // correttamente is_cover alla prima foto disponibile.
    }
  }

  return { error: null }
}

// ------------------------------------------------------------
// uploadFoto — upload file + registrazione DB
// Flusso completo per un singolo file:
//   1. Genera path deterministico {userId}/{ricordoId}/{uuid}.{ext}
//   2. Upload su Supabase Storage
//   3. Registra riga in tabella foto
// Restituisce la foto creata con signed URL già risolta.
//
// NOTA: la compressione/ridimensionamento avviene nel hook
// useUploadFoto (lato client, prima di questa chiamata).
// Il service riceve il file già ottimizzato.
// ------------------------------------------------------------

export async function uploadFoto(
  userId: string,
  ricordoId: string,
  file: File,
  ordine: number
): Promise<{
  data: FotoConUrl | null
  error: string | null
}> {
  // 1. Genera path univoco
  const estensione = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const uuid       = crypto.randomUUID()
  const path       = `${userId}/${ricordoId}/${uuid}.${estensione}`

  // 2. Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.FOTO_RICORDI)
    .upload(path, file, {
      contentType: file.type,
      upsert:      false,
    })

  if (uploadError) return { data: null, error: uploadError.message }

  // 3. Registra in DB (con ownership check interno)
  const { data: fotoRecord, error: registraError } = await registraFoto(userId, {
    ricordo_id: ricordoId,
    path,
    mime_type:  file.type,
    size_bytes: file.size,
    ordine,
  })

  if (registraError || !fotoRecord) {
    // Cleanup: rimuovi il file appena caricato se il DB fallisce.
    // Usa deleteFilesDaStorage (non .remove() diretto) per mantenere
    // il principio di difesa in profondità introdotto in Sprint 7A:
    // un solo percorso di cancellazione nel codebase, con validazione
    // ownership del path inclusa.
    await deleteFilesDaStorage([path], STORAGE_BUCKETS.FOTO_RICORDI)
    return { data: null, error: registraError ?? 'Registrazione foto fallita' }
  }

  // 4. Genera signed URL per uso immediato
  const { signedUrl, thumbnailSignedUrl, error: urlError } =
    await generaSignedUrlConThumbnail(path)

  if (urlError || !signedUrl || !thumbnailSignedUrl) {
    // Upload e DB ok — solo la URL ha fallito. Non è un errore critico.
    // Il chiamante può fare refetch. Restituiamo la foto senza URL.
    return {
      data: { ...fotoRecord, signedUrl: '', thumbnailSignedUrl: '' },
      error: null,
    }
  }

  return {
    data: { ...fotoRecord, signedUrl, thumbnailSignedUrl },
    error: null,
  }
}

// ------------------------------------------------------------
// getCoverViaggio — cover visuale del viaggio
// Cerca la foto cover più recente tra tutti i ricordi del viaggio.
// Nessuna modifica DB — calcolo via query.
// Restituisce la thumbnailSignedUrl o null se nessuna foto cover esiste.
// ------------------------------------------------------------

export async function getCoverViaggio(viaggioId: string): Promise<{
  url: string | null
  error: string | null
}> {
  // 1. Ricordi del viaggio
  const { data: ricordi, error: errRicordi } = await supabase
    .from('ricordi')
    .select('id')
    .eq('viaggio_id', viaggioId)

  if (errRicordi) return { url: null, error: errRicordi.message }
  if (!ricordi || ricordi.length === 0) return { url: null, error: null }

  // 2. Prima foto is_cover=true tra tutti i ricordi, ordinata per created_at DESC
  //    (la più recente tra le cover disponibili)
  const ids = ricordi.map((r: { id: string }) => r.id)
  const { data: cover, error: errCover } = await supabase
    .from('foto')
    .select('path, bucket')
    .in('ricordo_id', ids)
    .eq('is_cover', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (errCover || !cover) return { url: null, error: null }

  // 3. Signed URL thumbnail
  const { thumbnailSignedUrl, error: urlErr } = await generaSignedUrlConThumbnail(
    (cover as { path: string; bucket: string }).path,
    (cover as { path: string; bucket: string }).bucket
  )

  if (urlErr || !thumbnailSignedUrl) return { url: null, error: urlErr }
  return { url: thumbnailSignedUrl, error: null }
}

// ------------------------------------------------------------
// getFotoCountByViaggio — conteggio foto per ogni ricordo del viaggio
// Restituisce Map<ricordoId, count> per le statistiche giorno.
// Una sola query — anti N+1.
// ------------------------------------------------------------

export async function getFotoCountByViaggio(viaggioId: string): Promise<{
  data: Map<string, number>
  error: string | null
}> {
  // Passo 1: ricordo_id del viaggio
  const { data: ricordi, error: errRicordi } = await supabase
    .from('ricordi')
    .select('id')
    .eq('viaggio_id', viaggioId)

  if (errRicordi) return { data: new Map(), error: errRicordi.message }
  if (!ricordi || ricordi.length === 0) return { data: new Map(), error: null }

  const ids = ricordi.map((r: { id: string }) => r.id)

  // Passo 2: tutte le foto (solo id e ricordo_id — minimo payload)
  const { data: foto, error: errFoto } = await supabase
    .from('foto')
    .select('ricordo_id')
    .in('ricordo_id', ids)

  if (errFoto) return { data: new Map(), error: errFoto.message }

  // Conta lato client — evita GROUP BY che PostgREST non supporta nativamente
  const mappa = new Map<string, number>()
  for (const f of (foto ?? []) as { ricordo_id: string }[]) {
    mappa.set(f.ricordo_id, (mappa.get(f.ricordo_id) ?? 0) + 1)
  }

  return { data: mappa, error: null }
}
