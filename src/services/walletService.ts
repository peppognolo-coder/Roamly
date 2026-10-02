import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/types'
import type { DocumentoWallet, DocumentoWalletConUrl, NuovoDocumentoWallet } from '@/types'

// ============================================================
// ROAMLY — Wallet Service
// Documenti personali (carte d'imbarco, documenti d'identità,
// assicurazioni, visti, conferme) — stessa architettura upload
// già collaudata in fotoService.ts (bucket privato + signed URL),
// ma senza l'annidamento per ricordo: il path è solo
// {userId}/{uuid}.ext, perché il documento è personale e il
// collegamento a un viaggio vive nella sola colonna viaggio_id.
// ============================================================

const SIGNED_URL_TTL_SECONDS = 3600   // 1 ora, come fotoService

// ------------------------------------------------------------
// getDocumentiWallet — lista i documenti dell'utente corrente
// Senza viaggioId: tutta la wishlist di documenti. Con viaggioId:
// solo quelli collegati a quel viaggio.
// ------------------------------------------------------------

export async function getDocumentiWallet(viaggioId?: string): Promise<{
  data: DocumentoWallet[]
  error: string | null
}> {
  let query = supabase
    .from('documenti_wallet')
    .select('*')
    .order('created_at', { ascending: false })

  if (viaggioId) query = query.eq('viaggio_id', viaggioId)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as DocumentoWallet[], error: null }
}

// ------------------------------------------------------------
// generaSignedUrlDocumento — signed URL (+ thumbnail se immagine)
// I PDF non supportano la Transformation API di Supabase Storage:
// per loro thumbnailSignedUrl resta null e l'UI mostra un'icona fissa.
// ------------------------------------------------------------

async function generaSignedUrlDocumento(doc: DocumentoWallet): Promise<{
  signedUrl: string | null
  thumbnailSignedUrl: string | null
  error: string | null
}> {
  const isImmagine = doc.mime_type.startsWith('image/')

  if (!isImmagine) {
    const { data, error } = await supabase.storage
      .from(doc.bucket)
      .createSignedUrl(doc.path, SIGNED_URL_TTL_SECONDS)
    if (error) return { signedUrl: null, thumbnailSignedUrl: null, error: error.message }
    return { signedUrl: data.signedUrl, thumbnailSignedUrl: null, error: null }
  }

  const [originalRes, thumbRes] = await Promise.all([
    supabase.storage.from(doc.bucket).createSignedUrl(doc.path, SIGNED_URL_TTL_SECONDS),
    supabase.storage.from(doc.bucket).createSignedUrl(doc.path, SIGNED_URL_TTL_SECONDS, {
      transform: { width: 200, height: 200, resize: 'cover' },
    }),
  ])

  if (originalRes.error) {
    return { signedUrl: null, thumbnailSignedUrl: null, error: originalRes.error.message }
  }

  return {
    signedUrl: originalRes.data.signedUrl,
    thumbnailSignedUrl: thumbRes.data?.signedUrl ?? null,
    error: null,
  }
}

// ------------------------------------------------------------
// getDocumentiConUrl — documenti con signed URL risolte
// Usata da WalletPage per la lista.
// ------------------------------------------------------------

export async function getDocumentiConUrl(viaggioId?: string): Promise<{
  data: DocumentoWalletConUrl[]
  error: string | null
}> {
  const { data: documenti, error } = await getDocumentiWallet(viaggioId)
  if (error) return { data: [], error }
  if (documenti.length === 0) return { data: [], error: null }

  const conUrl: DocumentoWalletConUrl[] = []
  const errori: string[] = []

  await Promise.all(
    documenti.map(async (doc) => {
      const { signedUrl, thumbnailSignedUrl, error: urlErr } = await generaSignedUrlDocumento(doc)
      if (urlErr || !signedUrl) {
        errori.push(urlErr ?? 'URL non generata')
        return
      }
      conUrl.push({ ...doc, signedUrl, thumbnailSignedUrl })
    })
  )

  if (conUrl.length === 0 && errori.length > 0) {
    return { data: [], error: errori[0] }
  }

  // Mantiene l'ordine originale (created_at DESC dal service)
  conUrl.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return { data: conUrl, error: null }
}

// ------------------------------------------------------------
// getDocumentoConUrlById — singolo documento con signed URL
// Usata da DocumentoWalletDetailPage — fetch dedicato per id,
// robusto anche ad un accesso diretto/refresh della pagina (non
// dipende dalla lista già in cache).
// ------------------------------------------------------------

export async function getDocumentoConUrlById(id: string): Promise<{
  data: DocumentoWalletConUrl | null
  error: string | null
}> {
  const { data: doc, error } = await supabase
    .from('documenti_wallet')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  if (!doc) return { data: null, error: 'Documento non trovato' }

  const { signedUrl, thumbnailSignedUrl, error: urlErr } =
    await generaSignedUrlDocumento(doc as DocumentoWallet)

  if (urlErr || !signedUrl) return { data: null, error: urlErr ?? 'URL non generata' }

  return { data: { ...(doc as DocumentoWallet), signedUrl, thumbnailSignedUrl }, error: null }
}

// ------------------------------------------------------------
// uploadDocumento — upload file + registrazione DB
// Flusso completo: genera path, upload su Storage, inserisce la
// riga, risolve la signed URL per uso immediato.
// ------------------------------------------------------------

export async function uploadDocumento(
  userId: string,
  file: File,
  payload: Omit<NuovoDocumentoWallet, 'path' | 'mime_type' | 'size_bytes'>
): Promise<{ data: DocumentoWalletConUrl | null; error: string | null }> {
  // 1. Genera path univoco — niente annidamento, il documento è personale
  const estensione = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
  const uuid = crypto.randomUUID()
  const path = `${userId}/${uuid}.${estensione}`

  // 2. Upload Storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.DOCUMENTI_WALLET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return { data: null, error: uploadError.message }

  // 3. Registra in DB
  const { data: record, error: dbError } = await supabase
    .from('documenti_wallet')
    .insert({
      user_id:    userId,
      viaggio_id: payload.viaggio_id,
      categoria:  payload.categoria,
      nome:       payload.nome,
      dettaglio:  payload.dettaglio,
      bucket:     STORAGE_BUCKETS.DOCUMENTI_WALLET,
      path,
      mime_type:  file.type,
      size_bytes: file.size,
    })
    .select()
    .single()

  if (dbError || !record) {
    // Cleanup: rimuovi il file appena caricato se il DB fallisce —
    // stesso principio di difesa in profondità di uploadFoto.
    await supabase.storage.from(STORAGE_BUCKETS.DOCUMENTI_WALLET).remove([path])
    return { data: null, error: dbError?.message ?? 'Registrazione documento fallita' }
  }

  // 4. Signed URL per uso immediato
  const { signedUrl, thumbnailSignedUrl, error: urlError } =
    await generaSignedUrlDocumento(record as DocumentoWallet)

  if (urlError || !signedUrl) {
    // Upload e DB ok — solo la URL ha fallito, non è critico.
    return { data: { ...(record as DocumentoWallet), signedUrl: '', thumbnailSignedUrl: null }, error: null }
  }

  return {
    data: { ...(record as DocumentoWallet), signedUrl, thumbnailSignedUrl },
    error: null,
  }
}

// ------------------------------------------------------------
// deleteDocumento — elimina file fisico + riga DB
// Sequenza identica a deleteSingolaFoto: file prima, riga dopo.
// ------------------------------------------------------------

export async function deleteDocumento(doc: DocumentoWallet): Promise<{ error: string | null }> {
  const { error: storageError } = await supabase.storage
    .from(doc.bucket)
    .remove([doc.path])

  if (storageError) {
    return { error: `Impossibile eliminare il file: ${storageError.message}` }
  }

  const { error } = await supabase
    .from('documenti_wallet')
    .delete()
    .eq('id', doc.id)

  if (error) return { error: error.message }
  return { error: null }
}
