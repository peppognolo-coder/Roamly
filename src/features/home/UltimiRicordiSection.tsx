import { useNavigate } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import { MOOD_OPTIONS } from '@/types'
import type { Ricordo } from '@/types'

// ============================================================
// UltimiRicordiSection — ultimi 5 ricordi in scroll orizzontale
// Card compatte: thumbnail mood + titolo + data
// ============================================================

const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-100 to-yellow-50',
  meravigliato: 'from-pink-100 to-rose-50',
  sereno:       'from-roamly-g7 to-roamly-g6',
  entusiasta:   'from-orange-100 to-amber-50',
  ispirato:     'from-violet-100 to-purple-50',
}

interface UltimiRicordiSectionProps {
  ricordi: Ricordo[]
  isLoading: boolean
}

export function UltimiRicordiSection({ ricordi, isLoading }: UltimiRicordiSectionProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-roamly-g6 rounded animate-pulse w-1/3" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-32">
              <div className="h-24 bg-roamly-g6 rounded-xl animate-pulse mb-2" />
              <div className="h-3 bg-roamly-g6 rounded animate-pulse w-4/5 mb-1" />
              <div className="h-2.5 bg-roamly-g6 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Nessun ricordo ancora: prima si tornava null e la pagina finiva lì
  // con un vuoto brusco (con Oggi/B45 nascosti perché non applicabili,
  // la Home poteva mostrare solo header + card viaggio + statistiche
  // e poi tanto bianco). Un invito coerente con lo stile delle altre
  // vuote dell'app (Salvati, Notifiche) è più onesto del vuoto secco.
  if (ricordi.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50">
          Ultimi ricordi
        </h2>
        <button
          onClick={() => navigate('/nuovo-ricordo')}
          className="
            flex flex-col items-center gap-2.5 py-8 px-6 text-center
            rounded-2xl border border-dashed border-roamly-g5 bg-roamly-g7
            hover:border-roamly-g4 active:scale-[0.99]
            transition-all duration-150
          "
        >
          <div className="w-11 h-11 rounded-xl bg-white shadow-roamly flex items-center justify-center text-roamly-g3">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-dm-sans text-sm font-medium text-roamly-g1">
              Ancora nessun ricordo
            </p>
            <p className="font-dm-sans text-xs text-roamly-text/45">
              Aggiungi il primo per iniziare il tuo diario
            </p>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50">
          Ultimi ricordi
        </h2>
        <button
          onClick={() => navigate('/diario')}
          className="flex items-center gap-0.5 font-dm-sans text-xs text-roamly-g2 hover:text-roamly-g1 transition-colors"
        >
          Vedi tutti
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Scroll orizzontale — nessuna scrollbar visibile */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
        {ricordi.slice(0, 5).map((r) => (
          <RicordoCardCompatta key={r.id} ricordo={r} onClick={() => navigate(`/ricordi/${r.id}`)} />
        ))}
      </div>
    </div>
  )
}

// ---- Card compatta ----

function RicordoCardCompatta({ ricordo, onClick }: { ricordo: Ricordo; onClick: () => void }) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g7 to-roamly-g6'

  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={onClick}
      className="
        shrink-0 w-32
        flex flex-col
        bg-white rounded-xl
        overflow-hidden
        shadow-roamly
        hover:shadow-roamly-lg
        active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        text-left
      "
    >
      {/* Thumbnail — etichetta mood in basso a sinistra, come nel mockup */}
      <div className={`
        h-[86px] w-full shrink-0 p-2
        bg-gradient-to-br ${gradient}
        flex items-end
      `}>
        {moodOption && (
          <span className="font-dm-mono text-[9px] font-medium uppercase tracking-wider text-roamly-g0/45">
            {moodOption.label}
          </span>
        )}
      </div>

      {/* Testo */}
      <div className="p-2">
        <p className="font-dm-sans text-xs font-semibold text-roamly-text line-clamp-2 leading-snug">
          {ricordo.titolo}
        </p>
        <p className="font-dm-mono text-[9px] text-roamly-text/30 mt-1">
          {dataFormattata}
        </p>
      </div>
    </button>
  )
}
