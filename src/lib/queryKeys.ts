// ============================================================
// ROAMLY — Query Keys Centralizzate
// Fonte unica di verità per tutte le queryKey di React Query.
//
// Pattern: array gerarchico per permettere invalidazioni selettive.
//
// Esempio:
//   queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.all })
//   → invalida TUTTE le query sui viaggi
//
//   queryClient.invalidateQueries({ queryKey: queryKeys.viaggi.detail(id) })
//   → invalida solo il dettaglio di quel viaggio
//
// Chiavi con tag versione:
//   [V1.1] — pianificate per il prossimo ciclo di sviluppo
//   [V2]   — roadmap futura, non implementate nel MVP
// ============================================================

export const queryKeys = {

  // ----------------------------------------------------------
  // PROFILO
  // ----------------------------------------------------------
  profilo: {
    /** ['profilo', userId] */
    detail: (userId: string) => ['profilo', userId] as const,
  },

  // ----------------------------------------------------------
  // VIAGGI
  // ----------------------------------------------------------
  viaggi: {
    /** ['viaggi'] — root per invalidazioni bulk */
    all: ['viaggi'] as const,

    /** ['viaggi', 'list', userId] — lista completa */
    list: (userId: string) => ['viaggi', 'list', userId] as const,

    /** ['viaggi', 'detail', viaggioId] — singolo viaggio */
    detail: (viaggioId: string) => ['viaggi', 'detail', viaggioId] as const,

    /** ['viaggi', 'attivo', userId] — viaggio attivo derivato
     *  [V2] Non usata nel MVP: useViaggioAttivo deriva dalla cache di useViaggi() */
    attivo: (userId: string) => ['viaggi', 'attivo', userId] as const,

    /** ['viaggi', 'pianificati', userId] — solo pianificati (Pianifica screen)
     *  [V2] Non usata nel MVP: usePianifica filtra dalla cache di useViaggi() */
    pianificati: (userId: string) => ['viaggi', 'pianificati', userId] as const,

    /** ['viaggi', 'statistiche', viaggioId] — conteggi ricordi/preferiti/highlight */
    statistiche: (viaggioId: string) => ['viaggi', 'statistiche', viaggioId] as const,
  },

  // ----------------------------------------------------------
  // RICORDI (MOMENTI)
  // ----------------------------------------------------------
  ricordi: {
    /** ['ricordi'] — root per invalidazioni bulk */
    all: ['ricordi'] as const,

    /** ['ricordi', 'list', viaggioId] — ricordi di un viaggio */
    byViaggio: (viaggioId: string) => ['ricordi', 'list', viaggioId] as const,

    /** ['ricordi', 'detail', ricordoId] — singolo ricordo */
    detail: (ricordoId: string) => ['ricordi', 'detail', ricordoId] as const,

    /** ['ricordi', 'recenti', userId] — ultimi N ricordi (Home + B45) */
    recenti: (userId: string) => ['ricordi', 'recenti', userId] as const,

    /** ['ricordi', 'preferiti', userId] — ricordi con preferito=true
     *  [V2] Non usata nel MVP: il filtro preferiti del Diario lavora su cache locale */
    preferiti: (userId: string) => ['ricordi', 'preferiti', userId] as const,

    /** ['ricordi', 'highlight', userId] — ricordi con highlight=true
     *  [V1.1] Attivata quando highlight diventa feature utente (Sprint 8.1) */
    highlight: (userId: string) => ['ricordi', 'highlight', userId] as const,

    /** ['ricordi', 'giorno', userId] — ricordo del giorno (B45)
     *  [V2] Non usata nel MVP: getRicordoDelGiorno lavora sulla cache di recenti() */
    delGiorno: (userId: string) => ['ricordi', 'giorno', userId] as const,
  },

  // ----------------------------------------------------------
  // CHECKLIST
  // ----------------------------------------------------------
  checklist: {
    /** ['checklist'] — root */
    all: ['checklist'] as const,

    /** ['checklist', 'list', viaggioId] — items di un viaggio */
    byViaggio: (viaggioId: string) => ['checklist', 'list', viaggioId] as const,
  },

  prenotazioni: {
    /** ['prenotazioni'] — root */
    all: ['prenotazioni'] as const,

    /** ['prenotazioni', 'list', viaggioId] — prenotazioni di un viaggio */
    byViaggio: (viaggioId: string) => ['prenotazioni', 'list', viaggioId] as const,
  },

  tappe: {
    /** ['tappe'] — root */
    all: ['tappe'] as const,

    /** ['tappe', 'list', viaggioId] — tappe di un viaggio (Itinerario + Attività) */
    byViaggio: (viaggioId: string) => ['tappe', 'list', viaggioId] as const,
  },

  noteViaggio: {
    /** ['note-viaggio'] — root */
    all: ['note-viaggio'] as const,

    /** ['note-viaggio', 'list', viaggioId] — note di un viaggio */
    byViaggio: (viaggioId: string) => ['note-viaggio', 'list', viaggioId] as const,
  },

  inviti: {
    /** ['inviti', viaggioId] — invito attivo di un viaggio */
    attivo: (viaggioId: string) => ['inviti', 'attivo', viaggioId] as const,
  },

  membri: {
    /** ['membri', 'list', viaggioId] — membri di un viaggio */
    byViaggio: (viaggioId: string) => ['membri', 'list', viaggioId] as const,

    /** ['membri', 'ruolo', viaggioId, userId] — ruolo dell'utente corrente */
    mioRuolo: (viaggioId: string, userId: string) => ['membri', 'ruolo', viaggioId, userId] as const,
  },

  // ----------------------------------------------------------
  // STATISTICHE HOME
  // ----------------------------------------------------------
  statistiche: {
    /** ['statistiche', userId] */
    utente: (userId: string) => ['statistiche', userId] as const,
  },

  // ----------------------------------------------------------
  // FOTO
  // ----------------------------------------------------------
  foto: {
    /** ['foto', 'ricordo', ricordoId] — foto con signed URL di un singolo ricordo */
    byRicordo: (ricordoId: string) => ['foto', 'ricordo', ricordoId] as const,

    /** ['foto', 'cover', ricordoId] — signed URL thumbnail per la cover di un ricordo */
    cover: (ricordoId: string) => ['foto', 'cover', ricordoId] as const,

    /** ['foto', 'coverViaggio', viaggioId] — cover visuale del viaggio (prima foto cover dei ricordi) */
    coverViaggio: (viaggioId: string) => ['foto', 'coverViaggio', viaggioId] as const,

    /** ['foto', 'countByViaggio', viaggioId] — mappa ricordoId→count per statistiche giorno */
    countByViaggio: (viaggioId: string) => ['foto', 'countByViaggio', viaggioId] as const,

    /** ['foto', 'covers', viaggioId] — mappa ricordoId→thumbnailUrl per un viaggio intero
     *  Usata da ViaggioDetailPage per evitare query N+1 nelle RicordoCard */
    coversByViaggio: (viaggioId: string) => ['foto', 'covers', viaggioId] as const,
  },

  // ----------------------------------------------------------
  // BADGE
  // [V2] Schema e chiavi pronte, feature non implementata nel MVP
  // ----------------------------------------------------------
  badges: {
    /** ['badges'] — lista badge disponibili [V2] */
    all: ['badges'] as const,

    /** ['badges', 'utente', userId] — badge conquistati [V2] */
    byUtente: (userId: string) => ['badges', 'utente', userId] as const,
  },

} as const
