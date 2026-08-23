// ============================================================
// RicordoDelGiornoCard — placeholder visivo per B45
// Sprint 4: struttura grafica definitiva, dati statici.
// Sprint 5: sostituito con logica reale da useRicordiRecenti.
//
// Viene mostrato solo se l'utente ha ≥ 3 ricordi totali,
// per non affollare la schermata con promise di feature future
// quando l'archivio è ancora piccolo.
// ============================================================

export function RicordoDelGiornoCard() {
  return (
    <div className="
      flex items-center gap-4 px-4 py-3.5
      bg-white rounded-2xl
      border border-roamly-g6
      shadow-sm shadow-roamly-g0/5
    ">
      {/* Icona calendario */}
      <div className="
        w-11 h-11 rounded-xl
        bg-roamly-g7 border border-roamly-g6
        flex items-center justify-center
        text-xl shrink-0
      ">
        📅
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0">
        <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/40">
          Ricordo del giorno
        </p>
        <p className="font-dm-sans text-sm text-roamly-text/60 mt-0.5 leading-snug">
          Torna ogni giorno per rivivere
          un momento del tuo passato.
        </p>
      </div>

      {/* Shimmer placeholder destra */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <div className="w-16 h-2.5 bg-roamly-g6 rounded-full animate-pulse" />
        <div className="w-10 h-2 bg-roamly-g6 rounded-full animate-pulse" />
      </div>
    </div>
  )
}
