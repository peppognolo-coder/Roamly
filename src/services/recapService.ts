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
  const [ricordiRes, fotoRes, budgetRes, ricordoTopRes] = await Promise.all([
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
    // "Ricordo più apprezzato": non usiamo il conteggio reazioni —
    // con gruppi piccoli (coppia, famiglia, pochi amici) non è un
    // segnale affidabile, spesso 0 o 1 su tutto. Usiamo invece la
    // scelta esplicita della persona: il flag "highlight" (marcato
    // a mano come speciale), con "preferito" come ripiego.
    supabase
      .from('ricordi')
      .select('id, titolo, highlight, preferito, data')
      .eq('viaggio_id', viaggioId)
      .or('highlight.eq.true,preferito.eq.true')
      .order('highlight', { ascending: false })
      .order('data', { ascending: false })
      .limit(1),
  ])

  if (ricordiRes.error || fotoRes.error || budgetRes.error || ricordoTopRes.error) {
    return {
      data: { numRicordi: 0, numFoto: 0, speseTotali: 0, ricordoTop: null },
      error: 'Impossibile caricare il recap del viaggio.',
    }
  }

  const speseTotali = (budgetRes.data ?? []).reduce((sum, v) => sum + (v.importo ?? 0), 0)
  const primo = ricordoTopRes.data?.[0]
  const ricordoTop = primo ? { id: primo.id, titolo: primo.titolo } : null

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
