import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — Recap Service
// Aggrega dati già esistenti (ricordi, foto, budget_voci,
// reazioni_ricordo) in un'unica chiamata pensata per la pagina
// di recap di un viaggio concluso. Nessuna tabella nuova.
// ============================================================

export interface RecapViaggio {
  numRicordi: number
  numFoto: number
  speseTotali: number
  ricordoTop: { id: string; titolo: string } | null
}

export async function getRecapViaggio(viaggioId: string): Promise<{
  data: RecapViaggio
  error: string | null
}> {
  const [ricordiRes, fotoRes, budgetRes, reazioniRes] = await Promise.all([
    supabase
      .from('ricordi')
      .select('id', { count: 'exact', head: true })
      .eq('viaggio_id', viaggioId),
    supabase
      .from('foto')
      .select('id, ricordi!inner(viaggio_id)', { count: 'exact', head: true })
      .eq('ricordi.viaggio_id', viaggioId),
    supabase
      .from('budget_voci')
      .select('importo')
      .eq('viaggio_id', viaggioId),
    supabase
      .from('reazioni_ricordo')
      .select('ricordo_id, ricordi!inner(id, titolo, viaggio_id)')
      .eq('ricordi.viaggio_id', viaggioId),
  ])

  if (ricordiRes.error || fotoRes.error || budgetRes.error || reazioniRes.error) {
    return {
      data: { numRicordi: 0, numFoto: 0, speseTotali: 0, ricordoTop: null },
      error: 'Impossibile caricare il recap del viaggio.',
    }
  }

  const speseTotali = (budgetRes.data ?? []).reduce((sum, v) => sum + (v.importo ?? 0), 0)

  // Conteggio reazioni per ricordo, in JS — dataset per singolo
  // viaggio è piccolo, non serve una query di aggregazione dedicata.
  const conteggi = new Map<string, { titolo: string; count: number }>()
  for (const r of reazioniRes.data ?? []) {
    // ricordi arriva come oggetto singolo grazie a !inner, ma il
    // client lo tipizza come array — normalizziamo qui.
    const ricordo = Array.isArray(r.ricordi) ? r.ricordi[0] : r.ricordi
    if (!ricordo) continue
    const attuale = conteggi.get(ricordo.id) ?? { titolo: ricordo.titolo, count: 0 }
    attuale.count += 1
    conteggi.set(ricordo.id, attuale)
  }

  let ricordoTop: RecapViaggio['ricordoTop'] = null
  let maxCount = 0
  for (const [id, { titolo, count }] of conteggi) {
    if (count > maxCount) {
      maxCount = count
      ricordoTop = { id, titolo }
    }
  }

  return {
    data: {
      numRicordi: ricordiRes.count ?? 0,
      numFoto: fotoRes.count ?? 0,
      speseTotali,
      ricordoTop,
    },
    error: null,
  }
}
