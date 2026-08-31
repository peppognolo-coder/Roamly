import type { ChecklistItem } from '@/types'
import { FileText, BatteryCharging, Pill, Shirt, Package, Waves, Mountain, Building2, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

// ------------------------------------------------------------
// Template tematici — set curati per tipo di viaggio, applicabili
// in blocco quando la valigia è vuota (invece di scegliere voce
// per voce dal set generico sopra).
// ------------------------------------------------------------

export type ValigiaTemplateId = 'mare' | 'montagna' | 'citta' | 'estero'

export interface ValigiaTemplate {
  id: ValigiaTemplateId
  label: string
  items: TemplateChecklistItem[]
}

export const VALIGIA_TEMPLATES: ValigiaTemplate[] = [
  {
    id: 'mare',
    label: 'Mare',
    items: [
      { testo: 'Costume da bagno',        categoria: 'abbigliamento' },
      { testo: 'Telo mare',               categoria: 'abbigliamento' },
      { testo: 'Ciabatte infradito',      categoria: 'abbigliamento' },
      { testo: 'Cappello da sole',        categoria: 'abbigliamento' },
      { testo: 'Occhiali da sole',        categoria: 'varie' },
      { testo: 'Crema solare',            categoria: 'salute' },
      { testo: 'Doposole',                categoria: 'salute' },
      { testo: 'Borsa impermeabile',      categoria: 'varie' },
    ],
  },
  {
    id: 'montagna',
    label: 'Montagna',
    items: [
      { testo: 'Scarponi da trekking',    categoria: 'abbigliamento' },
      { testo: 'Giacca a vento/impermeabile', categoria: 'abbigliamento' },
      { testo: 'Pile o maglione caldo',   categoria: 'abbigliamento' },
      { testo: 'Guanti e cappello',       categoria: 'abbigliamento' },
      { testo: 'Borraccia',               categoria: 'varie' },
      { testo: 'Kit pronto soccorso',     categoria: 'salute' },
      { testo: 'Torcia frontale',         categoria: 'tech' },
      { testo: 'Crema solare alta protezione', categoria: 'salute' },
    ],
  },
  {
    id: 'citta',
    label: 'Città',
    items: [
      { testo: 'Scarpe comode da camminata', categoria: 'abbigliamento' },
      { testo: 'Outfit smart-casual',     categoria: 'abbigliamento' },
      { testo: 'Powerbank',               categoria: 'tech' },
      { testo: 'Adattatore per presa elettrica', categoria: 'tech' },
      { testo: 'Borsa a tracolla antifurto', categoria: 'varie' },
      { testo: 'Mappa o guida della città', categoria: 'varie' },
      { testo: 'Biglietti musei/eventi',  categoria: 'documenti' },
    ],
  },
  {
    id: 'estero',
    label: 'Estero extra-UE',
    items: [
      { testo: 'Passaporto (validità residua verificata)', categoria: 'documenti' },
      { testo: 'Visto d\'ingresso',       categoria: 'documenti' },
      { testo: 'Assicurazione di viaggio internazionale', categoria: 'documenti' },
      { testo: 'Copia cartacea dei documenti', categoria: 'documenti' },
      { testo: 'Adattatore universale',   categoria: 'tech' },
      { testo: 'Valuta locale in contanti', categoria: 'varie' },
      { testo: 'Certificati vaccinazioni', categoria: 'salute' },
      { testo: 'Numeri di emergenza/ambasciata', categoria: 'documenti' },
    ],
  },
]

export const VALIGIA_TEMPLATE_ICON: Record<ValigiaTemplateId, LucideIcon> = {
  mare:     Waves,
  montagna: Mountain,
  citta:    Building2,
  estero:   Globe,
}

export const CATEGORIA_LABEL: Record<CategoriaChecklist, string> = {
  documenti:      'Documenti',
  tech:           'Tech',
  salute:         'Salute',
  abbigliamento:  'Abbigliamento',
  varie:          'Varie',
}

export const CATEGORIA_ICON: Record<CategoriaChecklist, LucideIcon> = {
  documenti:      FileText,
  tech:           BatteryCharging,
  salute:         Pill,
  abbigliamento:  Shirt,
  varie:          Package,
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
