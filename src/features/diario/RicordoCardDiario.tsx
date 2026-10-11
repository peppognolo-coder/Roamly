import { useNavigate } from 'react-router-dom'
import { Heart, MapPin } from 'lucide-react'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { AutoreBadge } from '@/components/ricordi/AutoreBadge'
import { useAutoreRicordo } from '@/hooks/useAutoreRicordo'
import { useFotoRicordo } from '@/hooks/useFoto'
import { ContestoInline } from '@/features/momenti/ContestoRicordo'
import { useInViewOnce } from './useInViewOnce'
import type { Ricordo } from '@/types'

// ============================================================
// RicordoCardDiario — card grande del Diario: foto in alto, poi
// titolo, anteprima del racconto, contesto, luogo e data.
// `viaggioNome`: etichetta col viaggio, per gli elenchi che mescolano
// più viaggi (ricerca, "da riscoprire").
// `coverUrl`: se la pagina l'ha già (mappa per viaggio) si passa qui;
// se è undefined la card se la cerca da sola, solo quando è vicina
// allo schermo.
// ============================================================

const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-100 to-yellow-50',
  meravigliato: 'from-pink-100 to-rose-50',
  sereno:       'from-roamly-g6 to-roamly-g7',
  entusiasta:   'from-orange-100 to-amber-50',
  ispirato:     'from-violet-100 to-purple-50',
  grato:        'from-emerald-100 to-green-50',
  nostalgico:   'from-slate-100 to-gray-50',
  sorpreso:     'from-cyan-100 to-sky-50',
  stanco:       'from-stone-200 to-stone-50',
  divertito:    'from-lime-100 to-yellow-50',
}

interface Props {
  ricordo: Ricordo
  coverUrl?: string | null
  viaggioNome?: string
  /** Piccola riga sopra il titolo (es. "Un anno fa") */
  eyebrow?: string
}

export function RicordoCardDiario({ ricordo, coverUrl, viaggioNome, eyebrow }: Props) {
  const navigate = useNavigate()
  const { autore } = useAutoreRicordo(ricordo)
  const { ref, visto } = useInViewOnce<HTMLDivElement>()

  // Se la cover non è stata passata, la cerca da sé (solo se visibile)
  const { data: foto } = useFotoRicordo(coverUrl === undefined && visto ? ricordo.id : undefined)
  const fotoAutonoma = (foto?.find((f) => f.is_cover) ?? foto?.[0])?.signedUrl
  const url = coverUrl === undefined ? fotoAutonoma : coverUrl
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g6 to-roamly-g7'

  const [y, m, d] = ricordo.data.split('-').map(Number)
  const data = new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

  const vai = () => navigate(`/ricordi/${ricordo.id}`)

  return (
    <div
      ref={ref}
      onClick={vai}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && vai()}
      className="bg-white rounded-3xl overflow-hidden shadow-roamly cursor-pointer
        active:scale-[0.99] transition-transform duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
    >
      {url && (
        <div className="relative h-[190px] bg-roamly-g6">
          <img src={url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-roamly">
            <MoodIcon mood={ricordo.mood} size={24} />
          </span>
          {ricordo.preferito && (
            <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <Heart size={15} className="fill-roamly-coral-dark text-roamly-coral-dark" />
            </span>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        {(eyebrow || viaggioNome) && (
          <div className="flex items-center gap-2 flex-wrap">
            {eyebrow && (
              <span className="font-dm-mono text-[10px] uppercase tracking-wider text-roamly-coral-dark">{eyebrow}</span>
            )}
            {viaggioNome && (
              <span className="inline-flex items-center max-w-full h-6 px-2.5 rounded-full bg-roamly-g6 border border-roamly-g5
                font-dm-sans text-[11px] font-medium text-roamly-g1 truncate">
                {viaggioNome}
              </span>
            )}
          </div>
        )}

        <div className="flex items-start gap-3">
          {!url && (
            <span className={`shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <MoodIcon mood={ricordo.mood} size={30} />
            </span>
          )}
          <h3 className="flex-1 font-lora text-lg font-semibold text-roamly-g0 leading-snug line-clamp-2">
            {ricordo.titolo}
          </h3>
          {!url && ricordo.preferito && (
            <Heart size={15} className="shrink-0 mt-1 fill-roamly-coral-dark text-roamly-coral-dark" />
          )}
        </div>

        {ricordo.testo && (
          <p className="font-dm-sans text-sm text-roamly-text/70 leading-relaxed line-clamp-3">{ricordo.testo}</p>
        )}

        <ContestoInline ricordo={ricordo} className="max-w-full" />

        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {ricordo.luogo && (
            <span className="inline-flex items-center gap-1 font-dm-sans text-xs text-roamly-text/45 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{ricordo.luogo.split(',').slice(0, 2).join(',')}</span>
            </span>
          )}
          <span className="flex items-center gap-2 ml-auto shrink-0">
            {autore && <AutoreBadge nome={autore.nome} avatarUrl={autore.avatarUrl} size="xs" />}
            <span className="font-dm-mono text-[10px] text-roamly-text/35">{data}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
