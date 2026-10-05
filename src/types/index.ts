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
  | 'grato'
  | 'nostalgico'
  | 'sorpreso'
  | 'stanco'
  | 'divertito'

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
  bio: string | null
  notifiche_prenotazioni: boolean
  notifiche_anticipo_giorni: number   // 1 · 3 · 7 giorni prima
  notifiche_attivita_gruppo: boolean  // nuovo membro, tappa aggiunta da altri
  notifiche_anniversari: boolean      // "un anno fa" sui ricordi
  crediti: number
  created_at: string
}

// ------------------------------------------------------------
// TRAGUARDI (badge)
// ------------------------------------------------------------

export interface Badge {
  id: string
  codice: string
  nome: string
  descrizione: string | null
  icona: string | null   // nome icona lucide-react, es. 'Plane'
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
}

/** Badge del catalogo unito allo stato "posseduto o no" per l'utente corrente */
export interface BadgeConStato extends Badge {
  posseduto: boolean
  earned_at: string | null
}

// ------------------------------------------------------------
// VIAGGIO
// ------------------------------------------------------------

export interface Viaggio {
  id: string
  user_id: string | null   // nullable: SET NULL se il creatore elimina l'account
                            // (i permessi reali passano da viaggio_membri, non da qui)
  nome: string
  destinazione: string | null
  paese: string | null
  paese_codice: string | null   // ISO 3166-1 alpha-2 maiuscolo (es. "GR") — da geocoding, null per viaggi creati prima di questa colonna
  destinazione_lat: number | null   // da geocoding, usate per dare priorità ai risultati vicini quando si cerca una tappa
  destinazione_lng: number | null
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
  | 'paese_codice'
  | 'destinazione_lat'
  | 'destinazione_lng'
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
  // Emozione scritta a mano, libera — in aggiunta al mood guidato
  // (chip emoji), non in sostituzione. Es. "un po' agrodolce, felice
  // ma già con la nostalgia del rientro". Opzionale.
  emozione_testo: string | null
  preferito: boolean
  highlight: boolean
  data: string                 // ISO date string 'YYYY-MM-DD'
  created_at: string
  // Ordine manuale nella pagina del viaggio (drag & drop) — non
  // influenza Diario/Home/Ricordo del Giorno, che restano ordinati
  // per data. Assegnato automaticamente alla creazione, mai nel form.
  ordine: number
  // "Colonna sonora" del ricordo — brano Spotify collegato (opzionale).
  // I 4 campi vanno sempre insieme: o tutti valorizzati o tutti null.
  spotify_track_id: string | null
  spotify_track_nome: string | null
  spotify_track_artista: string | null
  spotify_track_immagine_url: string | null
}

// Brano Spotify selezionato nel form — forma "comoda" per l'UI,
// mappata sui 4 campi flat di Ricordo al submit (vedi RicordoForm).
export interface SpotifyTrackSelezionato {
  id: string
  nome: string
  artista: string
  immagineUrl: string | null
}

// Payload per creare un nuovo ricordo
export type NuovoRicordo = Pick<
  Ricordo,
  | 'viaggio_id'
  | 'titolo'
  | 'testo'
  | 'luogo'
  | 'lat'
  | 'lng'
  | 'mood'
  | 'emozione_testo'
  | 'data'
  | 'preferito'
  | 'spotify_track_id'
  | 'spotify_track_nome'
  | 'spotify_track_artista'
  | 'spotify_track_immagine_url'
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
    | 'lat'
    | 'lng'
    | 'mood'
    | 'emozione_testo'
    | 'data'
    | 'preferito'
    | 'highlight'
    | 'tipo'
    | 'spotify_track_id'
    | 'spotify_track_nome'
    | 'spotify_track_artista'
    | 'spotify_track_immagine_url'
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
  /** Sezione della valigia (documenti/salute/abbigliamento/tech/varie) —
   *  null per item aggiunti a mano prima di questa colonna: finiscono
   *  nella sezione "Varie" in UI. */
  categoria: string | null
  /** Da quale blocco di suggerimenti è stato aggiunto in batch
   *  ('stagione' | 'prenotazioni' | 'tappe') — null se aggiunto a mano
   *  o da uno dei 4 template statici (mare/montagna/città/estero). */
  fonte: string | null
  created_at: string
}

export type NuovoChecklistItem = Pick<
  ChecklistItem,
  'viaggio_id' | 'testo' | 'ordine'
> & Partial<Pick<ChecklistItem, 'categoria' | 'fonte'>>

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
  FOTO_RICORDI:     'ricordi-foto',
  AVATAR_PROFILI:   'profili-avatar',
  DOCUMENTI_WALLET: 'documenti-wallet',
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
  { value: 'grato',       label: 'Grato',        emoji: '🙏' },
  { value: 'nostalgico',  label: 'Nostalgico',   emoji: '🥹' },
  { value: 'sorpreso',    label: 'Sorpreso',     emoji: '😮' },
  { value: 'stanco',      label: 'Stanco',       emoji: '😴' },
  { value: 'divertito',   label: 'Divertito',    emoji: '😄' },
]

// ------------------------------------------------------------
// TAPPE VIAGGIO
// Alimenta sia la vista Itinerario (raggruppata per giorno) sia
// la vista Attività (pin sulla mappa) — stessa tabella, due viste.
// ------------------------------------------------------------

export type CategoriaTappa = 'cultura' | 'natura' | 'food' | 'svago' | 'relax' | 'trasporto' | 'altro'

export interface TappaViaggio {
  id: string
  user_id: string
  viaggio_id: string
  nome: string
  categoria: CategoriaTappa
  giorno: string | null       // ISO date 'YYYY-MM-DD' — inizio
  giorno_fine: string | null  // ISO date 'YYYY-MM-DD' — fine (uguale a giorno se non specificato)
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
  'categoria' | 'giorno' | 'giorno_fine' | 'ora' | 'lat' | 'lng' | 'indirizzo' | 'note' | 'ordine'
>>

export type ModificaTappaViaggio = Partial<
  Pick<TappaViaggio, 'nome' | 'categoria' | 'giorno' | 'giorno_fine' | 'ora' | 'lat' | 'lng' | 'indirizzo' | 'note' | 'ordine'>
>

// ------------------------------------------------------------
// Luoghi salvati — wishlist personale (Scopri, Mappa · "Salvati")
// ------------------------------------------------------------

export interface LuogoSalvato {
  id: string
  user_id: string
  viaggio_id: string | null
  nome: string
  categoria: string | null
  lat: number
  lng: number
  indirizzo: string | null
  nota: string | null
  created_at: string
}

export type NuovoLuogoSalvato = Pick<LuogoSalvato, 'nome' | 'lat' | 'lng'> & Partial<
  Pick<LuogoSalvato, 'viaggio_id' | 'categoria' | 'indirizzo' | 'nota'>
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

// ------------------------------------------------------------
// BUDGET / SPLIT SPESE
// Riusa la tabella `budget_voci` già esistente nello schema.
// Ogni voce è legata a un viaggio e a chi l'ha inserita — la
// somma per persona alimenta il riepilogo "chi ha speso quanto".
// ------------------------------------------------------------

export type CategoriaBudget =
  | 'trasporto' | 'alloggio' | 'food' | 'attivita' | 'shopping' | 'altro'

// Come questa spesa entra nel calcolo dei pareggi tra membri
// (calcolaSaldi, src/lib/budget-utils.ts):
//   'quota'       — spesa normale: si divide equamente, chi non ha
//                   pagato è in debito verso chi ha pagato (comportamento
//                   storico, resta il default)
//   'offerta'     — chi ha pagato offre, non vuole essere rimborsato:
//                   conta nel totale del viaggio ma non genera debiti
//   'cointestato' — pagata da un conto già comune a tutti i membri:
//                   stesso trattamento di 'offerta' nei saldi (neutra),
//                   distinta solo per come viene etichettata in UI
export type ModalitaPagamentoVoce = 'quota' | 'offerta' | 'cointestato'

export interface BudgetVoce {
  id: string
  viaggio_id: string
  user_id: string
  categoria: CategoriaBudget
  importo: number
  nota: string | null
  modalita_pagamento: ModalitaPagamentoVoce
  created_at: string
}

// 'user_id' è opzionale: chi ha pagato — di default chi registra la
// spesa, ma può essere un altro membro (picker "Ha pagato" nel form
// quando il viaggio è condiviso). Vedi RLS in
// supabase-migration-spese-gruppo.sql: chi la registra deve comunque
// essere un membro del viaggio, ma non deve coincidere con chi paga.
// 'modalita_pagamento' è opzionale: assente = 'quota' (default DB).
export type NuovaBudgetVoce = Pick<BudgetVoce, 'viaggio_id' | 'categoria' | 'importo'> &
  Partial<Pick<BudgetVoce, 'nota' | 'user_id' | 'modalita_pagamento'>>

export type ModificaBudgetVoce = Partial<
  Pick<BudgetVoce, 'categoria' | 'importo' | 'nota' | 'user_id' | 'modalita_pagamento'>
>

// ------------------------------------------------------------
// Pareggi tra membri (settle-up) — un trasferimento registrato,
// non una spesa: netta i saldi calcolati da budget_voci senza
// toccarle. Vedi src/lib/budget-utils.ts.
// ------------------------------------------------------------

export interface BudgetPagamento {
  id: string
  viaggio_id: string
  da_user_id: string
  a_user_id: string
  importo: number
  registrato_da: string
  created_at: string
}

export type NuovoBudgetPagamento = Pick<
  BudgetPagamento, 'viaggio_id' | 'da_user_id' | 'a_user_id' | 'importo'
>

export interface CategoriaBudgetOption {
  value: CategoriaBudget
  label: string
}

export const CATEGORIA_BUDGET_OPTIONS: CategoriaBudgetOption[] = [
  { value: 'trasporto', label: 'Trasporti' },
  { value: 'alloggio',  label: 'Alloggio' },
  { value: 'food',      label: 'Cibo e ristoranti' },
  { value: 'attivita',  label: 'Attività' },
  { value: 'shopping',  label: 'Shopping' },
  { value: 'altro',     label: 'Altro' },
]

export interface ModalitaPagamentoOption {
  value: ModalitaPagamentoVoce
  label: string
  /** Etichetta breve mostrata come badge nella lista spese */
  badge: string
  descrizione: string
}

export const MODALITA_PAGAMENTO_OPTIONS: ModalitaPagamentoOption[] = [
  {
    value: 'quota',
    label: 'Pago e ho la mia quota',
    badge: 'Quota',
    descrizione: 'Si divide equamente tra tutti — chi non ha pagato è in debito verso chi ha pagato.',
  },
  {
    value: 'offerta',
    label: 'Offro io',
    badge: 'Offerta',
    descrizione: 'Nessuno ti deve nulla per questa spesa — conta nel totale del viaggio, non nei pareggi.',
  },
  {
    value: 'cointestato',
    label: 'Conto cointestato',
    badge: 'Conto comune',
    descrizione: 'Pagata da un conto già comune a tutti — nessun debito da pareggiare.',
  },
]

// ------------------------------------------------------------
// COLLABORAZIONE MULTI-UTENTE
// ------------------------------------------------------------

export type RuoloMembro = 'proprietario' | 'collaboratore'

export interface ViaggioMembro {
  id: string
  viaggio_id: string
  user_id: string
  ruolo: RuoloMembro
  joined_at: string
}

export interface InvitoViaggio {
  id: string
  viaggio_id: string
  creato_da: string
  token: string
  scade_il: string
  created_at: string
}

// ------------------------------------------------------------
// NOTIFICHE (feed)
// Diversa da `notifiche_inviate` (log tecnico anti-doppione) e da
// `push_subscriptions` (dispositivi registrati) — questa è la lista
// che l'utente vede in app, in /profilo/feed.
// ------------------------------------------------------------

export type TipoNotifica = 'prenotazione' | 'nuovo_membro' | 'tappa_aggiunta' | 'anniversario' | 'traguardo' | 'nuovo_ricordo' | 'nuova_spesa'

export interface Notifica {
  id: string
  user_id: string
  tipo: TipoNotifica
  titolo: string
  testo: string
  link: string | null
  letta: boolean
  created_at: string
  /** Iniziale di chi ha fatto l'azione (nuovo_membro, tappa_aggiunta) —
   *  null per i tipi non legati a una persona specifica, il client
   *  usa allora il glifo di default del tipo (vedi aspettoNotifica). */
  glifo: string | null
}

// ------------------------------------------------------------
// WALLET — documenti personali (carte d'imbarco, documenti
// d'identità, assicurazioni, visti, conferme di prenotazione...)
//
// Sezione globale (/profilo/wallet), non annidata sotto un
// viaggio: un documento può restare personale (passaporto) oppure
// collegarsi a un viaggio specifico (viaggio_id valorizzato), nel
// qual caso compare anche lì. Resta SEMPRE privato al proprietario
// — anche su un viaggio condiviso, i compagni di viaggio non
// vedono i documenti altrui (RLS: solo user_id = auth.uid()).
// ------------------------------------------------------------

export type CategoriaDocumento =
  | 'carta_imbarco'
  | 'documento_identita'
  | 'assicurazione'
  | 'visto'
  | 'prenotazione'
  | 'altro'

export interface DocumentoWallet {
  id:         string
  user_id:    string
  viaggio_id: string | null   // null = documento personale, non legato a un viaggio
  categoria:  CategoriaDocumento
  nome:       string          // es. "Carta d'imbarco FR1234" — scelto dall'utente
  // Campi strutturati specifici per categoria (tratta/posto/gate per una
  // carta d'imbarco, scadenza per un visto...) — scritti a mano dall'utente
  // al caricamento, MAI estratti o dedotti dal file. Stesso pattern JSONB
  // già usato da Prenotazione.dettaglio — niente colonne dedicate per
  // ogni campo, niente migrazione per aggiungerne di nuovi in futuro.
  // Chiavi per categoria: vedi CAMPI_DETTAGLIO_WALLET più sotto.
  dettaglio:  Record<string, string> | null
  bucket:     string          // sempre 'documenti-wallet'
  path:       string          // '{userId}/{uuid}.ext'
  mime_type:  string
  size_bytes: number | null
  created_at: string
}

// Payload per registrare un documento dopo l'upload completato
export type NuovoDocumentoWallet = Pick<
  DocumentoWallet,
  'viaggio_id' | 'categoria' | 'nome' | 'dettaglio' | 'path' | 'mime_type' | 'size_bytes'
>

// Documento arricchito con signed URL — usata nei componenti UI.
// thumbnailSignedUrl è presente solo per le immagini (Transformation
// API Supabase); per i PDF resta null e l'UI mostra un'icona fissa.
export interface DocumentoWalletConUrl extends DocumentoWallet {
  signedUrl:          string
  thumbnailSignedUrl: string | null
}

export interface CategoriaDocumentoOption {
  value:      CategoriaDocumento
  label:      string
  emoji:      string
  // Gradiente [chiaro, scuro] per la "card" in stile Apple Wallet —
  // stessa logica dei temi sfondo delle share card (vedi share-utils.ts),
  // qui applicata per categoria invece che per mood/viaggio.
  gradiente:  [string, string]
}

export const CATEGORIA_DOCUMENTO_OPTIONS: CategoriaDocumentoOption[] = [
  { value: 'carta_imbarco',      label: "Carta d'imbarco",      emoji: '✈️', gradiente: ['#FF6B4A', '#E5563A'] },
  { value: 'documento_identita', label: "Documento d'identità", emoji: '🪪', gradiente: ['#123F58', '#0C2A3D'] },
  { value: 'assicurazione',      label: 'Assicurazione',        emoji: '🛡️', gradiente: ['#D9636F', '#A53139'] },
  { value: 'visto',              label: 'Visto',                 emoji: '📋', gradiente: ['#5FB8D9', '#0B6F99'] },
  { value: 'prenotazione',       label: 'Prenotazione',          emoji: '🏨', gradiente: ['#E8C170', '#C9962E'] },
  { value: 'altro',              label: 'Altro',                 emoji: '📎', gradiente: ['#9AA5AD', '#6B747B'] },
]

// ------------------------------------------------------------
// CAMPI DETTAGLIO WALLET — per categoria, opzionali
// Usati sia dal form di caricamento (NuovoDocumentoWalletPage) sia
// dalla schermata di dettaglio (DocumentoWalletDetailPage) per
// costruire il "pass" in stile Apple Wallet. Scritti a mano
// dall'utente — mai estratti dal file caricato (vedi nota su
// DocumentoWallet.dettaglio). 'altro' non ha campi: resta il solo
// file, senza un pass costruito sopra.
// ------------------------------------------------------------

export interface CampoDettaglioWallet {
  key:   string
  label: string
  type?: 'text' | 'date'   // assente = 'text'
}

export const CAMPI_DETTAGLIO_WALLET: Record<CategoriaDocumento, CampoDettaglioWallet[]> = {
  carta_imbarco: [
    { key: 'numero_volo',      label: 'Volo' },
    { key: 'data_volo',        label: 'Data', type: 'date' },
    { key: 'da',               label: 'Da' },
    { key: 'a',                label: 'A' },
    { key: 'passeggero',       label: 'Passeggero' },
    { key: 'posto',            label: 'Posto' },
    { key: 'gate',             label: 'Gate' },
    { key: 'orario_partenza',  label: 'Orario partenza' },
  ],
  documento_identita: [
    { key: 'tipo_documento', label: 'Tipo documento' },
    { key: 'numero',         label: 'Numero' },
    { key: 'scadenza',       label: 'Scadenza', type: 'date' },
  ],
  assicurazione: [
    { key: 'numero_polizza',      label: 'Numero polizza' },
    { key: 'scadenza',             label: 'Scadenza', type: 'date' },
    { key: 'telefono_assistenza',  label: 'Telefono assistenza' },
  ],
  visto: [
    { key: 'numero_pratica', label: 'Numero pratica' },
    { key: 'scadenza',       label: 'Scadenza', type: 'date' },
  ],
  prenotazione: [
    { key: 'numero_conferma', label: 'Numero conferma' },
    { key: 'checkin',         label: 'Check-in', type: 'date' },
    { key: 'checkout',        label: 'Check-out', type: 'date' },
    { key: 'indirizzo',       label: 'Indirizzo' },
  ],
  altro: [],
}
