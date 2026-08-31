import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { StatoBadge } from './StatoBadge'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
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

  return (
    <div
      onClick={() => navigate(`/viaggi/${viaggio.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/viaggi/${viaggio.id}`)}
      className="
        flex items-center gap-4 p-4
        bg-white rounded-2xl
        shadow-roamly
        cursor-pointer
        hover:shadow-roamly-lg
        active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* Icona copertina */}
      <div className="
        w-12 h-12 rounded-xl
        bg-roamly-g7
        flex items-center justify-center
        shrink-0 text-roamly-g2
      ">
        <ViaggioCoverIcon value={viaggio.cover_emoji} size={22} />
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
      <ChevronRight size={16} className="text-roamly-text/20 shrink-0" />
    </div>
  )
}
