import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

// ============================================================
// TimelineVuota — empty states per il Diario
// Tre varianti distinte per contesto:
//   A. nessun ricordo in assoluto
//   B. filtri che azzerano i risultati
//   C. sezione viaggio senza ricordi (inline)
// ============================================================

// ---- A. Nessun ricordo in assoluto -------------------------

export function DiarioVuoto() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center px-4">
      <div className="
        w-20 h-20 rounded-3xl
        bg-roamly-g7 border border-roamly-g6
        flex items-center justify-center
      ">
        <span className="text-4xl">📖</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-lora text-xl font-semibold text-roamly-g0">
          Il tuo diario è ancora
        </p>
        <p className="font-lora text-xl font-semibold text-roamly-g0">
          tutto da scrivere.
        </p>
        <p className="font-dm-sans text-sm text-roamly-text/50 mt-2 leading-relaxed">
          Ogni viaggio che hai vissuto merita
          <br />di essere ricordato. Inizia dal primo.
        </p>
      </div>

      <Button onClick={() => navigate('/viaggi/nuovo')} size="lg">
        Crea il tuo primo viaggio
      </Button>
    </div>
  )
}

// ---- B. Filtri che azzerano i risultati --------------------

export function DiarioVuotoConFiltri({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12 text-center px-4">
      <div className="
        w-16 h-16 rounded-2xl
        bg-roamly-g7 border border-roamly-g6
        flex items-center justify-center
      ">
        <span className="text-3xl">🔍</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="font-lora text-lg font-semibold text-roamly-g0">
          Nessun ricordo corrisponde
        </p>
        <p className="font-lora text-lg font-semibold text-roamly-g0">
          ai filtri selezionati.
        </p>
      </div>

      <button
        onClick={onReset}
        className="
          font-dm-sans text-sm font-medium text-roamly-g2
          underline hover:text-roamly-g1
          focus:outline-none focus-visible:ring-1 focus-visible:ring-roamly-g3
        "
      >
        Rimuovi i filtri
      </button>
    </div>
  )
}

// ---- C. Sezione viaggio senza ricordi (inline) -------------

export function SezioneVuota({ viaggioId }: { viaggioId: string }) {
  const navigate = useNavigate()

  return (
    <div className="
      flex items-center justify-between
      px-4 py-3
      bg-roamly-g7 rounded-xl border border-roamly-g6
    ">
      <p className="font-dm-sans text-sm text-roamly-text/40">
        Nessun ricordo ancora
      </p>
      <button
        onClick={() => navigate(`/nuovo-ricordo?viaggioId=${viaggioId}`)}
        className="
          font-dm-sans text-xs font-medium text-roamly-g2
          hover:text-roamly-g1
          focus:outline-none focus-visible:ring-1 focus-visible:ring-roamly-g3
        "
      >
        Aggiungi il primo →
      </button>
    </div>
  )
}
