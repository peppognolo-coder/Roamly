import type { ChecklistItem, Prenotazione, TappaViaggio, ViaggioConStato } from '@/types'
import { FileText, BatteryCharging, Pill, Shirt, Package, Waves, Mountain, Building2, Globe, Snowflake, Flower2, Sun, Leaf, Ticket, MapPin } from 'lucide-react'
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

// ------------------------------------------------------------
// Suggerimenti stagionali — dedotti dal viaggio stesso (data_inizio
// + paese), non scelti a mano dall'utente come i template sopra.
//
// Stagione: dedotta dal mese di data_inizio secondo le stagioni
// meteorologiche standard (DIC-FEB inverno, ecc.), poi capovolta se
// il paese ricade nell'emisfero sud (a dicembre in Argentina è estate).
//
// LIMITE NOTO: `paese` è un campo testo libero inserito dall'utente
// in fase di creazione viaggio, non una geocodifica — il confronto
// con PAESI_EMISFERO_SUD è un semplice match testuale case-insensitive
// su un elenco dei paesi più comuni dell'emisfero sud. Refusi, nomi
// alternativi ("USA" vs "Stati Uniti") o paesi non in elenco ricadono
// nel default emisfero nord — ragionevole per l'utenza tipica di
// Roamly, ma non infallibile. Nessuna chiamata di geocodifica qui:
// tutto calcolato client-side dai dati già presenti sul viaggio.
// ------------------------------------------------------------

export type Stagione = 'inverno' | 'primavera' | 'estate' | 'autunno'

const PAESI_EMISFERO_SUD = [
  'argentina', 'australia', 'brasile', 'cile', 'sudafrica', 'sud africa',
  'nuova zelanda', 'perù', 'peru', 'uruguay', 'bolivia', 'paraguay',
  'zimbabwe', 'namibia', 'botswana', 'mozambico', 'madagascar',
  'zambia', 'angola', 'fiji', 'ecuador',
]

function isEmisferoSud(paese: string | null): boolean {
  if (!paese) return false
  const normalizzato = paese.trim().toLowerCase()
  return PAESI_EMISFERO_SUD.some((p) => normalizzato.includes(p))
}

function stagioneDaMese(mese: number, emisferoSud: boolean): Stagione {
  // mese: 1-12. Stagioni meteorologiche standard emisfero nord.
  const stagioneNord: Stagione =
    mese === 12 || mese <= 2 ? 'inverno' :
    mese <= 5 ? 'primavera' :
    mese <= 8 ? 'estate' :
    'autunno'

  if (!emisferoSud) return stagioneNord

  // Emisfero sud: stagioni capovolte di 6 mesi.
  const OPPOSTA: Record<Stagione, Stagione> = {
    inverno: 'estate',
    estate: 'inverno',
    primavera: 'autunno',
    autunno: 'primavera',
  }
  return OPPOSTA[stagioneNord]
}

export const STAGIONE_LABEL: Record<Stagione, string> = {
  inverno:   'Inverno',
  primavera: 'Primavera',
  estate:    'Estate',
  autunno:   'Autunno',
}

export const STAGIONE_ICON: Record<Stagione, LucideIcon> = {
  inverno:   Snowflake,
  primavera: Flower2,
  estate:    Sun,
  autunno:   Leaf,
}

export const SUGGERIMENTI_STAGIONALI: Record<Stagione, TemplateChecklistItem[]> = {
  inverno: [
    { testo: 'Piumino o giacca pesante',   categoria: 'abbigliamento' },
    { testo: 'Sciarpa, guanti e berretto', categoria: 'abbigliamento' },
    { testo: 'Maglioni pesanti',           categoria: 'abbigliamento' },
    { testo: 'Calzini termici',            categoria: 'abbigliamento' },
    { testo: 'Scarpe impermeabili',        categoria: 'abbigliamento' },
    { testo: 'Scaldacollo',                categoria: 'abbigliamento' },
    { testo: 'Balsamo labbra',             categoria: 'salute' },
    { testo: 'Crema idratante viso',       categoria: 'salute' },
  ],
  primavera: [
    { testo: 'Giacca leggera impermeabile', categoria: 'abbigliamento' },
    { testo: 'Ombrello pieghevole',         categoria: 'varie' },
    { testo: 'Strati leggeri (a cipolla)',  categoria: 'abbigliamento' },
    { testo: 'Scarpe comode impermeabili',  categoria: 'abbigliamento' },
    { testo: 'Antistaminico (allergie)',    categoria: 'salute' },
  ],
  estate: [
    { testo: 'Costume da bagno',            categoria: 'abbigliamento' },
    { testo: 'Crema solare',                categoria: 'salute' },
    { testo: 'Doposole',                    categoria: 'salute' },
    { testo: 'Occhiali da sole',            categoria: 'varie' },
    { testo: 'Cappello',                    categoria: 'abbigliamento' },
    { testo: 'Abiti leggeri e traspiranti', categoria: 'abbigliamento' },
    { testo: 'Repellente per insetti',      categoria: 'salute' },
    { testo: 'Borraccia',                   categoria: 'varie' },
  ],
  autunno: [
    { testo: 'Giacca a vento',              categoria: 'abbigliamento' },
    { testo: 'Ombrello',                    categoria: 'varie' },
    { testo: 'Strati intermedi',            categoria: 'abbigliamento' },
    { testo: 'Maglioni leggeri',            categoria: 'abbigliamento' },
    { testo: 'Scarpe impermeabili',         categoria: 'abbigliamento' },
  ],
}

// ------------------------------------------------------------
// getSuggerimentiStagionali
// null se il viaggio non ha ancora una data di inizio impostata
// (nessuna stagione deducibile).
// ------------------------------------------------------------

export function getSuggerimentiStagionali(
  dataInizio: string | null,
  paese: string | null
): { stagione: Stagione; items: TemplateChecklistItem[] } | null {
  if (!dataInizio) return null

  const mese = Number(dataInizio.slice(5, 7))
  if (!mese || mese < 1 || mese > 12) return null

  const stagione = stagioneDaMese(mese, isEmisferoSud(paese))
  return { stagione, items: SUGGERIMENTI_STAGIONALI[stagione] }
}

// ------------------------------------------------------------
// Suggerimenti da prenotazioni e itinerario — a differenza di
// quelli stagionali (dedotti da data/paese), questi nascono da
// cosa l'utente ha GIÀ pianificato per il viaggio: promemoria
// mirati (biglietti, documenti) invece di consigli generici.
// ------------------------------------------------------------

export function getSuggerimentiDaPrenotazioni(
  prenotazioni: Prenotazione[]
): TemplateChecklistItem[] {
  const items: TemplateChecklistItem[] = []

  // Trasporto: il consiglio dipende dal sottotipo già scelto in fase
  // di prenotazione (dettaglio.sottotipo — aereo/treno/bus/auto/altro),
  // non più generico per l'intera categoria "trasporto".
  const sottotipiTrasporto = new Set(
    prenotazioni
      .filter((p) => p.tipo === 'trasporto')
      .map((p) => p.dettaglio?.sottotipo ?? 'altro')
  )

  if (sottotipiTrasporto.has('aereo')) {
    items.push({ testo: "Documenti di viaggio e carta d'imbarco", categoria: 'documenti' })
    items.push({ testo: 'Liquidi in valigia a norma (max 100ml)', categoria: 'documenti' })
    items.push({ testo: 'Bagaglio a mano conforme alle misure', categoria: 'varie' })
  }
  if (sottotipiTrasporto.has('treno')) {
    items.push({ testo: 'Biglietto treno (stampato o su app)', categoria: 'documenti' })
  }
  if (sottotipiTrasporto.has('bus')) {
    items.push({ testo: 'Biglietto bus (stampato o su app)', categoria: 'documenti' })
  }
  if (sottotipiTrasporto.has('auto')) {
    items.push({ testo: 'Patente di guida', categoria: 'documenti' })
    items.push({ testo: 'Documenti del veicolo e assicurazione', categoria: 'documenti' })
  }
  if (sottotipiTrasporto.has('altro')) {
    items.push({ testo: 'Documenti di viaggio', categoria: 'documenti' })
  }

  const tipiPresenti = new Set(prenotazioni.map((p) => p.tipo))

  if (tipiPresenti.has('alloggio')) {
    items.push({ testo: 'Conferma alloggio (scaricata o stampata)', categoria: 'documenti' })
  }
  if (tipiPresenti.has('visto')) {
    items.push({ testo: "Visto e documenti d'ingresso", categoria: 'documenti' })
  }

  // Biglietto specifico per ogni museo/evento prenotato — con il
  // nome della prenotazione, non generico, così è davvero utile.
  for (const p of prenotazioni) {
    if (p.tipo === 'museo' || p.tipo === 'evento') {
      items.push({ testo: `Biglietto: ${p.nome}`, categoria: 'documenti' })
    }
  }

  return items
}

export function getSuggerimentiDaTappe(
  tappe: TappaViaggio[]
): TemplateChecklistItem[] {
  const items: TemplateChecklistItem[] = []
  const categoriePresenti = new Set(tappe.map((t) => t.categoria))

  if (categoriePresenti.has('cultura')) {
    items.push({ testo: 'Abbigliamento coperto per luoghi di culto (spalle/ginocchia)', categoria: 'abbigliamento' })
  }
  if (categoriePresenti.has('natura')) {
    items.push({ testo: 'Scarpe comode o da trekking', categoria: 'abbigliamento' })
  }

  return items
}

// ------------------------------------------------------------
// Blocchi di suggerimenti — struttura unificata per la UI.
// Ogni blocco spiega ESPLICITAMENTE perché quei punti sono
// suggeriti (stagione+luogo / prenotazioni / itinerario), invece
// di mostrare una lista anonima. Solo i blocchi con almeno un
// item vengono restituiti.
// ------------------------------------------------------------

export interface BloccoSuggerimenti {
  id: 'stagione' | 'prenotazioni' | 'tappe'
  titolo: string
  sottotitolo: string
  icon: LucideIcon
  items: TemplateChecklistItem[]
}

export function costruisciBlocchiSuggerimenti(
  viaggio: Pick<ViaggioConStato, 'data_inizio' | 'paese' | 'destinazione'>,
  prenotazioni: Prenotazione[],
  tappe: TappaViaggio[]
): BloccoSuggerimenti[] {
  const blocchi: BloccoSuggerimenti[] = []

  const stagionale = getSuggerimentiStagionali(viaggio.data_inizio, viaggio.paese)
  if (stagionale && stagionale.items.length > 0) {
    const luogo = viaggio.destinazione ? ` a ${viaggio.destinazione}` : ''
    blocchi.push({
      id: 'stagione',
      titolo: `${STAGIONE_LABEL[stagionale.stagione]}${luogo}`,
      sottotitolo: 'In base al periodo e al luogo del viaggio',
      icon: STAGIONE_ICON[stagionale.stagione],
      items: stagionale.items,
    })
  }

  const daPrenotazioni = getSuggerimentiDaPrenotazioni(prenotazioni)
  if (daPrenotazioni.length > 0) {
    blocchi.push({
      id: 'prenotazioni',
      titolo: 'Dalle tue prenotazioni',
      sottotitolo: 'Biglietti e documenti da non dimenticare',
      icon: Ticket,
      items: daPrenotazioni,
    })
  }

  const daTappe = getSuggerimentiDaTappe(tappe)
  if (daTappe.length > 0) {
    blocchi.push({
      id: 'tappe',
      titolo: 'Dal tuo itinerario',
      sottotitolo: 'In base alle attività già in programma',
      icon: MapPin,
      items: daTappe,
    })
  }

  return blocchi
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
