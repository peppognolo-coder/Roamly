import { useNavigate } from 'react-router-dom'
import { StatoBadge } from './StatoBadge'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ViaggioCard — card riutilizzabile per la lista viaggi
// Usata in ViaggiPage. Naviga a /viaggi/:id al tap.
// ============================================================

interface ViaggioCardProps {
  viaggio: ViaggioConStato
}

export function ViaggioCard({ viaggio }: ViaggioCardProps) {
  const navigate = useNavigate()

  const dataFormattata = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const emoji = viaggio.cover_emoji ?? '✈️'

  return (
    <div
      onClick={() => navigate(`/viaggi/${viaggio.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/viaggi/${viaggio.id}`)}
      className="
        flex items-center gap-4 p-4
        bg-white rounded-2xl
        border border-roamly-g6
        shadow-sm shadow-roamly-g0/5
        cursor-pointer
        hover:shadow-md hover:border-roamly-g5
        active:scale-[0.99]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* Emoji cover */}
      <div className="
        w-12 h-12 rounded-xl
        bg-roamly-g7
        flex items-center justify-center
        text-2xl shrink-0
        border border-roamly-g6
      ">
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-dm-sans font-semibold text-roamly-text truncate">
            {viaggio.nome}
          </p>
          <StatoBadge stato={viaggio.stato_effettivo} />
        </div>

        {(viaggio.destinazione || viaggio.paese) && (
          <p className="font-dm-sans text-sm text-roamly-text/50 truncate mt-0.5">
            {[viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')}
          </p>
        )}

        <p className="font-dm-mono text-xs text-roamly-text/35 mt-1">
          {dataFormattata}
        </p>
      </div>

      {/* Chevron */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-roamly-text/20 shrink-0"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  )
}
