import type { ChecklistItem } from '@/types'

// ============================================================
// ROAMLY — checklist-templates
// Template predefiniti per la checklist pre-partenza.
// Funzione pura calcolaStatisticheChecklist (non hook).
// ============================================================

// ------------------------------------------------------------
// Template predefiniti
// ------------------------------------------------------------

export type CategoriaChecklist =
  | 'documenti'
  | 'salute'
  | 'abbigliamento'
  | 'tech'
  | 'varie'

export interface TemplateChecklistItem {
  testo: string
  categoria: CategoriaChecklist
}

export const TEMPLATE_BASE: TemplateChecklistItem[] = [
  { testo: "Passaporto / Carta d'identità", categoria: 'documenti' },
  { testo: 'Assicurazione di viaggio',       categoria: 'documenti' },
  { testo: 'Prenotazioni stampate / salvate', categoria: 'documenti' },
  { testo: 'Caricabatterie telefono',         categoria: 'tech' },
  { testo: 'Adattatore per presa elettrica',  categoria: 'tech' },
  { testo: 'Cuffie',                          categoria: 'tech' },
  { testo: 'Farmaci personali',               categoria: 'salute' },
  { testo: 'Kit pronto soccorso base',        categoria: 'salute' },
  { testo: 'Cambio abiti',                    categoria: 'abbigliamento' },
  { testo: 'Giacca impermeabile',             categoria: 'abbigliamento' },
]

export const CATEGORIA_LABEL: Record<CategoriaChecklist, string> = {
  documenti:    '📄 Documenti',
  tech:         '🔋 Tech',
  salute:       '💊 Salute',
  abbigliamento:'👕 Abbigliamento',
  varie:        '📦 Varie',
}

// ------------------------------------------------------------
// calcolaStatisticheChecklist
// Funzione pura — riceve l'array già in memoria, nessuna query.
// Usata direttamente nei componenti senza hook wrapper.
// ------------------------------------------------------------

export interface StatisticheChecklist {
  totale: number
  completati: number
  percentuale: number   // 0–100, arrotondato all'intero
}

export function calcolaStatisticheChecklist(
  items: ChecklistItem[]
): StatisticheChecklist {
  const totale     = items.length
  const completati = items.filter((i) => i.completato).length
  const percentuale = totale === 0 ? 0 : Math.round((completati / totale) * 100)

  return { totale, completati, percentuale }
}
