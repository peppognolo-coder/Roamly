// ============================================================
// ROAMLY — Types V1
// ============================================================

// ------------------------------------------------------------
// PRIMITIVI
// ------------------------------------------------------------

export type Mood =
  | 'felice'
  | 'meravigliato'
  | 'sereno'
  | 'entusiasta'
  | 'ispirato'

export type StatoViaggio =
  | 'pianificato'
  | 'in_corso'
  | 'concluso'

export type TipoRicordo =
  | 'testo'
  | 'foto'
  | 'audio'

// ------------------------------------------------------------
// PROFILO
// ------------------------------------------------------------

export interface Profilo {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

// ------------------------------------------------------------
// VIAGGIO
// ------------------------------------------------------------

export interface Viaggio {
  id: string
  user_id: string
  nome: string
  destinazione: string | null
  paese: string | null
  data_inizio: string | null   // ISO date string 'YYYY-MM-DD'
  data_fine: string | null     // ISO date string 'YYYY-MM-DD'
  stato: StatoViaggio | null   // null = derivato dalle date; valorizzato = override manuale
  cover_emoji: string | null
  cover_url: string | null     // schema ready, no upload V1
  budget_totale: number | null
  created_at: string
}

// Viaggio con stato_effettivo già calcolato — usato ovunque nel frontend
export interface ViaggioConStato extends Viaggio {
  stato_effettivo: StatoViaggio
}

// Payload per creare un nuovo viaggio
export type NuovoViaggio = Pick<
  Viaggio,
  | 'nome'
  | 'destinazione'
  | 'paese'
  | 'data_inizio'
  | 'data_fine'
  | 'cover_emoji'
  | 'budget_totale'
>

// Payload per modificare un viaggio esistente
export type ModificaViaggio = Partial<NuovoViaggio> & {
  stato?: StatoViaggio | null
}

// ------------------------------------------------------------
// RICORDO (Momento)
// Terminologia: "ricordo" in UI, "momento" nel codice/DB
// ------------------------------------------------------------

export interface Ricordo {
  id: string
  user_id: string
  viaggio_id: string
  titolo: string
  testo: string | null
  luogo: string | null
  tipo: TipoRicordo
  audio_url: string | null     // roadmap futura
  lat: number | null
  lng: number | null
  mood: Mood
  preferito: boolean
  highlight: boolean
  data: string                 // ISO date string 'YYYY-MM-DD'
  created_at: string
}

// Payload per creare un nuovo ricordo
export type NuovoRicordo = Pick<
  Ricordo,
  | 'viaggio_id'
  | 'titolo'
  | 'testo'
  | 'luogo'
  | 'mood'
  | 'data'
  | 'preferito'
> & {
  tipo?: TipoRicordo
}

// Payload per modificare un ricordo esistente
export type ModificaRicordo = Partial<
  Pick<
    Ricordo,
    | 'titolo'
    | 'testo'
    | 'luogo'
    | 'mood'
    | 'data'
    | 'preferito'
    | 'highlight'
    | 'tipo'
  >
>

// ------------------------------------------------------------
// CHECKLIST
// ------------------------------------------------------------

export interface ChecklistItem {
  id: string
  viaggio_id: string
  user_id: string
  testo: string
  completato: boolean
  ordine: number
  created_at: string
}

export type NuovoChecklistItem = Pick<
  ChecklistItem,
  'viaggio_id' | 'testo' | 'ordine'
>

// ------------------------------------------------------------
// BADGE (schema ready, non usato nel MVP)
// ------------------------------------------------------------

export interface Badge {
  id: string
  codice: string
  nome: string
  descrizione: string | null
  icona: string | null
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge              // join opzionale
}

// ------------------------------------------------------------
// STATISTICHE HOME
// ------------------------------------------------------------

export interface StatisticheUtente {
  viaggi: number
  ricordi: number
  paesi: number
}

// ------------------------------------------------------------
// FOTO
// Registro normalizzato dei file nel bucket Storage.
// Fonte di verità esclusiva — nessun campo foto_url duplicato nei ricordi.
// ------------------------------------------------------------

export interface Foto {
  id:          string
  user_id:     string
  ricordo_id:  string
  bucket:      string          // sempre 'ricordi-foto' nel MVP
  path:        string          // '{userId}/{ricordoId}/{uuid}.ext'
  mime_type:   string
  size_bytes:  number | null
  ordine:      number
  is_cover:    boolean         // per selezione copertina — V1.1
  created_at:  string
}

// Payload per registrare una foto dopo l'upload completato
export type NuovaFoto = Pick<Foto, 'ricordo_id' | 'path' | 'mime_type' | 'size_bytes'>

// Foto arricchita con signed URL già risolte — usata nei componenti UI.
// `signedUrl`          → URL firmata per visualizzazione originale (TTL 1h)
// `thumbnailSignedUrl` → URL firmata con trasformazione 200×200 cover (TTL 1h)
//                        Usata nelle RicordoCard — evita download di immagini full-size
export interface FotoConUrl extends Foto {
  signedUrl:          string
  thumbnailSignedUrl: string
}

// Nomi bucket come costanti — evita stringhe magiche nel codice
export const STORAGE_BUCKETS = {
  FOTO_RICORDI:   'ricordi-foto',
  AVATAR_PROFILI: 'profili-avatar',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

// ------------------------------------------------------------
// MOOD METADATA
// Usato per renderizzare i chip di selezione mood in UI
// ------------------------------------------------------------

export interface MoodOption {
  value: Mood
  label: string
  emoji: string
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'felice',      label: 'Felice',      emoji: '😊' },
  { value: 'meravigliato',label: 'Meravigliato', emoji: '😍' },
  { value: 'sereno',      label: 'Sereno',       emoji: '😌' },
  { value: 'entusiasta',  label: 'Entusiasta',   emoji: '🎉' },
  { value: 'ispirato',    label: 'Ispirato',     emoji: '🤩' },
]

// ------------------------------------------------------------
// TAPPE VIAGGIO
// Alimenta sia la vista Itinerario (raggruppata per giorno) sia
// la vista Attività (pin sulla mappa) — stessa tabella, due viste.
// ------------------------------------------------------------

export type CategoriaTappa = 'visita' | 'ristorante' | 'trasporto' | 'svago' | 'altro'

export interface TappaViaggio {
  id: string
  user_id: string
  viaggio_id: string
  nome: string
  categoria: CategoriaTappa
  giorno: string | null       // ISO date 'YYYY-MM-DD'
  ora: string | null          // 'HH:MM:SS'
  lat: number | null
  lng: number | null
  indirizzo: string | null
  note: string | null
  ordine: number
  created_at: string
}

export type NuovaTappaViaggio = Pick<
  TappaViaggio,
  'viaggio_id' | 'nome'
> & Partial<Pick<
  TappaViaggio,
  'categoria' | 'giorno' | 'ora' | 'lat' | 'lng' | 'indirizzo' | 'note' | 'ordine'
>>

export type ModificaTappaViaggio = Partial<
  Pick<TappaViaggio, 'nome' | 'categoria' | 'giorno' | 'ora' | 'lat' | 'lng' | 'indirizzo' | 'note' | 'ordine'>
>

// ------------------------------------------------------------
// NOTE VIAGGIO
// ------------------------------------------------------------

export interface NotaViaggio {
  id: string
  user_id: string
  viaggio_id: string
  contenuto: string
  created_at: string
  updated_at: string
}

export type NuovaNotaViaggio = Pick<NotaViaggio, 'viaggio_id' | 'contenuto'>

// ------------------------------------------------------------
// PRENOTAZIONI
// Riusa la tabella `wallet` già esistente nello schema.
// ------------------------------------------------------------

export type TipoPrenotazione =
  | 'trasporto' | 'alloggio' | 'museo' | 'evento' | 'food' | 'visto' | 'altro'

export type StatoPrenotazione = 'confermato' | 'in_attesa' | 'annullato'

export interface Prenotazione {
  id: string
  user_id: string
  viaggio_id: string
  tipo: TipoPrenotazione
  nome: string
  dettaglio: Record<string, string> | null
  data: string | null      // ISO date 'YYYY-MM-DD'
  prezzo: number | null
  stato: StatoPrenotazione
  created_at: string
}

export type NuovaPrenotazione = Pick<
  Prenotazione, 'viaggio_id' | 'tipo' | 'nome'
> & Partial<Pick<Prenotazione, 'dettaglio' | 'data' | 'prezzo' | 'stato'>>

export type ModificaPrenotazione = Partial<
  Pick<Prenotazione, 'nome' | 'tipo' | 'dettaglio' | 'data' | 'prezzo' | 'stato'>
>

export interface TipoPrenotazioneOption {
  value: TipoPrenotazione
  label: string
}

export const TIPO_PRENOTAZIONE_OPTIONS: TipoPrenotazioneOption[] = [
  { value: 'trasporto', label: 'Mezzi di trasporto' },
  { value: 'alloggio',  label: 'Alloggi' },
  { value: 'museo',     label: 'Musei' },
  { value: 'evento',    label: 'Eventi' },
  { value: 'food',      label: 'Food' },
  { value: 'visto',     label: 'Visti' },
  { value: 'altro',     label: 'Altro' },
]
