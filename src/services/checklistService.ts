import { supabase } from '@/lib/supabase'
import type { ChecklistItem } from '@/types'

// ============================================================
// ROAMLY — Checklist Service
// Responsabilità: chiamate alla tabella `checklist_items`.
// Ordinamento canonico: ordine ASC.
// ============================================================

// ------------------------------------------------------------
// getChecklistItems
// ------------------------------------------------------------

export async function getChecklistItems(viaggioId: string): Promise<{
  data: ChecklistItem[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('viaggio_id', viaggioId)
    .order('ordine', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: data as ChecklistItem[], error: null }
}

// ------------------------------------------------------------
// createChecklistItem — singolo item
// ------------------------------------------------------------

export async function createChecklistItem(
  userId: string,
  viaggioId: string,
  testo: string,
  ordine: number
): Promise<{
  data: ChecklistItem | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({ user_id: userId, viaggio_id: viaggioId, testo, ordine })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChecklistItem, error: null }
}

// ------------------------------------------------------------
// createChecklistItemsBatch — insert multiplo in una sola chiamata
// Usato per aggiungere i suggerimenti dal template.
// Una sola INSERT, una sola invalidazione React Query.
// ------------------------------------------------------------

export async function createChecklistItemsBatch(
  userId: string,
  viaggioId: string,
  items: { testo: string; ordine: number }[]
): Promise<{
  data: ChecklistItem[]
  error: string | null
}> {
  if (items.length === 0) return { data: [], error: null }

  const righe = items.map((item) => ({
    user_id:    userId,
    viaggio_id: viaggioId,
    testo:      item.testo,
    ordine:     item.ordine,
  }))

  const { data, error } = await supabase
    .from('checklist_items')
    .insert(righe)
    .select()

  if (error) return { data: [], error: error.message }
  return { data: data as ChecklistItem[], error: null }
}

// ------------------------------------------------------------
// updateChecklistItem — aggiornamento selettivo
// Usato per: toggle completato, modifica testo, cambio ordine
// ------------------------------------------------------------

export async function updateChecklistItem(
  itemId: string,
  payload: Partial<Pick<ChecklistItem, 'testo' | 'completato' | 'ordine'>>
): Promise<{
  data: ChecklistItem | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('checklist_items')
    .update(payload)
    .eq('id', itemId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChecklistItem, error: null }
}

// ------------------------------------------------------------
// deleteChecklistItem
// ------------------------------------------------------------

export async function deleteChecklistItem(itemId: string): Promise<{
  error: string | null
}> {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }
  return { error: null }
}

// ------------------------------------------------------------
// reorderChecklistItems — aggiornamento batch degli ordini
// Sprint 6: presente nel service, non esposto in UI.
// UI drag-and-drop rimandato a Sprint 8.
// N update in Promise.all — non atomico ma accettabile nel MVP.
// ------------------------------------------------------------

export async function reorderChecklistItems(
  items: { id: string; ordine: number }[]
): Promise<{ error: string | null }> {
  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from('checklist_items')
        .update({ ordine: item.ordine })
        .eq('id', item.id)
    )
  )

  const errore = results.find((r) => r.error)?.error
  return { error: errore?.message ?? null }
}
