import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { useAutoreRicordo } from '@/hooks/useAutoreRicordo'
import { AutoreBadge } from '@/components/ricordi/AutoreBadge'
import { MOOD_OPTIONS } from '@/types'
import type { Ricordo, ViaggioConStato } from '@/types'

// ============================================================
// HeroCardDiario — carta editoriale del Ricordo in evidenza
// Mostra il ricordo più significativo (highlight → preferito → ultimo).
// Highlight è sempre false nel MVP (Opzione C — V1.1).
// ============================================================

interface HeroCardDiarioProps {
  ricordo: Ricordo
  viaggio?: ViaggioConStato
}

// Gradient per mood — coerente con RicordoCard
const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-200 via-yellow-100 to-amber-50',
  meravigliato: 'from-pink-200 via-rose-100 to-pink-50',
  sereno:       'from-roamly-g5 via-roamly-g6 to-roamly-g7',
  entusiasta:   'from-orange-200 via-amber-100 to-orange-50',
  ispirato:     'from-violet-200 via-purple-100 to-violet-50',
}

export function HeroCardDiario({ ricordo, viaggio }: HeroCardDiarioProps) {
  const navigate = useNavigate()
  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g5 to-roamly-g7'
  const { autore } = useAutoreRicordo(ricordo)

  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      onClick={() => navigate(`/ricordi/${ricordo.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/ricordi/${ricordo.id}`)}
      className="
        rounded-3xl overflow-hidden
        bg-white
        shadow-roamly-lg
        cursor-pointer
        active:scale-[0.98]
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* Zona gradient — h-36 */}
      <div className={`
        h-36 w-full
        bg-gradient-to-br ${gradient}
        flex items-center justify-center
        relative
      `}>
        {/* Emoji mood grande */}
        <span className="text-5xl opacity-80">{moodOption?.emoji}</span>

        {/* Label "IN EVIDENZA" */}
        <div className="absolute top-3 left-4">
          <span className="
            font-dm-sans text-[9px] font-semibold uppercase tracking-widest
            text-roamly-g1/70 bg-white/60 backdrop-blur-sm
            px-2 py-0.5 rounded-full
          ">
            In evidenza
          </span>
        </div>

        {/* Indicatore preferito */}
        {ricordo.preferito && (
          <div className="absolute top-3 right-4 w-6 h-6 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Heart size={12} className="fill-red-400 text-red-400" />
          </div>
        )}
      </div>

      {/* Contenuto testuale */}
      <div className="p-4 flex flex-col gap-2">
        {/* Mood + data + autore (se collaborativo) */}
        <div className="flex items-center gap-2">
          <span className="
            font-dm-sans text-[10px] font-semibold uppercase tracking-wider
            text-roamly-text/40
          ">
            {moodOption?.label}
          </span>
          <span className="text-roamly-text/20 text-xs">·</span>
          <span className="font-dm-mono text-[10px] text-roamly-text/35">
            {dataFormattata}
          </span>
          {autore && (
            <>
              <span className="text-roamly-text/20 text-xs">·</span>
              <AutoreBadge nome={autore.nome} avatarUrl={autore.avatarUrl} size="xs" />
            </>
          )}
        </div>

        {/* Titolo */}
        <h2 className="font-lora text-xl font-semibold text-roamly-g0 leading-snug line-clamp-2">
          {ricordo.titolo}
        </h2>

        {/* Luogo */}
        {ricordo.luogo && (
          <div className="flex items-center gap-1 text-roamly-text/40">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="font-dm-sans text-xs">{ricordo.luogo}</span>
          </div>
        )}

        {/* Link viaggio */}
        {viaggio && (
          <button
            onClick={(e) => {
              e.stopPropagation() // non attiva il navigate della card
              navigate(`/viaggi/${viaggio.id}`)
            }}
            className="
              flex items-center gap-1.5 mt-1
              text-roamly-g2 hover:text-roamly-g1
              transition-colors duration-150
              focus:outline-none focus-visible:ring-1 focus-visible:ring-roamly-g3
              w-fit
            "
          >
            <ViaggioCoverIcon value={viaggio.cover_emoji} size={14} />
            <span className="font-dm-sans text-xs font-medium">
              Parte di: {viaggio.nome}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
