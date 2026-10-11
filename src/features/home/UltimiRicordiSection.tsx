import { useNavigate } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { useFotoRicordo } from '@/hooks/useFoto'
import type { Ricordo } from '@/types'

// ============================================================
// UltimiRicordiSection — ultimi ricordi in scroll orizzontale
// Card verticali con la foto del ricordo (se c'è), titolo e data.
// ============================================================

const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-200 to-yellow-100',
  meravigliato: 'from-pink-200 to-rose-100',
  sereno:       'from-roamly-g5 to-roamly-g6',
  entusiasta:   'from-orange-200 to-amber-100',
  ispirato:     'from-violet-200 to-purple-100',
  grato:        'from-emerald-200 to-green-100',
  nostalgico:   'from-slate-200 to-gray-100',
  sorpreso:     'from-cyan-200 to-sky-100',
  stanco:       'from-stone-300 to-stone-100',
  divertito:    'from-lime-200 to-yellow-100',
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
          {[1, 2].map((i) => (
            <div key={i} className="shrink-0 w-[150px] h-[200px] bg-roamly-g6 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (ricordi.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-lora text-lg font-semibold text-roamly-g0">I tuoi ricordi</h2>
        <button
          onClick={() => navigate('/nuovo-ricordo')}
          className="flex flex-col items-center gap-2.5 py-8 px-6 text-center
            rounded-2xl border border-dashed border-roamly-g5 bg-roamly-g7
            active:scale-[0.99] transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-white shadow-roamly flex items-center justify-center text-roamly-g3">
            <BookOpen size={18} />
          </div>
          <p className="font-dm-sans text-sm font-medium text-roamly-g1">Ancora nessun ricordo</p>
          <p className="font-dm-sans text-xs text-roamly-text/45">Aggiungi il primo per iniziare il tuo diario</p>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-lora text-lg font-semibold text-roamly-g0">Ultimi ricordi</h2>
        <button
          onClick={() => navigate('/diario')}
          className="flex items-center gap-0.5 font-dm-sans text-xs font-medium text-roamly-g2 active:opacity-60"
        >
          Vedi tutti
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5 snap-x snap-mandatory">
        {ricordi.slice(0, 6).map((r) => (
          <RicordoCardHome key={r.id} ricordo={r} onClick={() => navigate(`/ricordi/${r.id}`)} />
        ))}
      </div>
    </div>
  )
}

function RicordoCardHome({ ricordo, onClick }: { ricordo: Ricordo; onClick: () => void }) {
  const { data: foto } = useFotoRicordo(ricordo.id)
  const copertina = foto?.find((f) => f.is_cover) ?? foto?.[0]
  const url = copertina?.signedUrl
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g5 to-roamly-g6'

  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const data = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

  return (
    <button
      onClick={onClick}
      className="relative shrink-0 snap-start w-[150px] h-[200px] rounded-2xl overflow-hidden text-left
        shadow-roamly active:scale-[0.98] transition-transform
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-start justify-end p-3`}>
        {!url && <MoodIcon mood={ricordo.mood} size={44} />}
      </div>
      {url && (
        <img src={url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className={`absolute inset-0 ${url
        ? 'bg-gradient-to-t from-black/75 via-black/10 to-transparent'
        : ''}`} />

      {url && (
        <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center">
          <MoodIcon mood={ricordo.mood} size={22} />
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-0.5">
        <p className={`font-lora text-[15px] font-semibold leading-snug line-clamp-2
          ${url ? 'text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]' : 'text-roamly-g0'}`}>
          {ricordo.titolo}
        </p>
        <p className={`font-dm-mono text-[10px] ${url ? 'text-white/75' : 'text-roamly-g0/60'}`}>{data}</p>
      </div>
    </button>
  )
}
