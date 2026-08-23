import { useNavigate } from 'react-router-dom'
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

  if (ricordi.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50">
          Ultimi ricordi
        </h2>
        <button
          onClick={() => navigate('/diario')}
          className="font-dm-sans text-xs text-roamly-g2 hover:text-roamly-g1 transition-colors"
        >
          Vedi tutti →
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
      {/* Thumbnail */}
      <div className={`
        h-20 w-full shrink-0
        bg-gradient-to-br ${gradient}
        flex items-center justify-center
      `}>
        <span className="text-3xl opacity-70">{moodOption?.emoji ?? '📝'}</span>
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
