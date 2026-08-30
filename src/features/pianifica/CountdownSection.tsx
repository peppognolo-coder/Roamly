import { useNavigate } from 'react-router-dom'
import { CalendarDays, PartyPopper } from 'lucide-react'
import { Button }        from '@/components/ui/Button'
import { StatoBadge }    from '@/features/viaggi/StatoBadge'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import type { ViaggioConStato } from '@/types'

// ============================================================
// CountdownSection — schermata Pianifica
// Mostra il countdown al prossimo viaggio pianificato.
// Tre stati: viaggio in corso · prossimo pianificato · nessun viaggio
// ============================================================

interface CountdownSectionProps {
  prossimoViaggio:  ViaggioConStato | null
  giorniAlPartenza: number | null
  viaggioAttivo:    ViaggioConStato | null
}

export function CountdownSection({
  prossimoViaggio,
  giorniAlPartenza,
  viaggioAttivo,
}: CountdownSectionProps) {
  const navigate = useNavigate()

  // Se c'è un viaggio in corso, mostrarlo come contestualizzazione
  if (viaggioAttivo && viaggioAttivo.stato_effettivo === 'in_corso') {
    return (
      <div className="
        flex items-center gap-4 px-5 py-4
        bg-roamly-g0 rounded-2xl
        shadow-md shadow-roamly-g0/20
      ">
        <div className="
          w-12 h-12 rounded-xl bg-white/15
          flex items-center justify-center text-2xl shrink-0
        ">
          {viaggioAttivo.cover_emoji ?? '✈️'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-dm-sans text-xs text-white/60 uppercase tracking-wider mb-0.5">
            Sei in viaggio
          </p>
          <p className="font-lora text-lg font-semibold text-white truncate">
            {viaggioAttivo.nome}
          </p>
          <p className="font-dm-mono text-[10px] text-white/40 mt-0.5">
            {formatDataViaggio(viaggioAttivo.data_inizio, viaggioAttivo.data_fine)}
          </p>
        </div>
        <StatoBadge stato="in_corso" size="sm" />
      </div>
    )
  }

  // Nessun viaggio pianificato
  if (!prossimoViaggio) {
    return (
      <div className="
        flex flex-col items-center gap-4 py-8 px-4 text-center
        bg-roamly-g7 rounded-2xl border border-roamly-g5 border-dashed
      ">
        <CalendarDays size={36} className="text-roamly-g3" />
        <div className="flex flex-col gap-1">
          <p className="font-lora text-lg font-semibold text-roamly-g0">
            Nessun viaggio in programma
          </p>
          <p className="font-dm-sans text-sm text-roamly-text/50">
            Inizia a pianificare la tua prossima avventura.
          </p>
        </div>
        <Button onClick={() => navigate('/viaggi/nuovo')} size="md">
          Pianifica un viaggio
        </Button>
      </div>
    )
  }

  // Countdown al prossimo viaggio
  const isOggi   = giorniAlPartenza === 0
  const isDomani = giorniAlPartenza === 1

  const labelCountdown = (() => {
    if (isOggi)   return 'Partenza oggi!'
    if (isDomani) return 'Manca 1 giorno'
    if (giorniAlPartenza !== null) return `Mancano ${giorniAlPartenza} giorni`
    return 'Data non definita'
  })()

  return (
    <div
      onClick={() => navigate(`/viaggi/${prossimoViaggio.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/viaggi/${prossimoViaggio.id}`)}
      className="
        flex flex-col gap-3 px-5 py-4
        bg-roamly-g0 rounded-2xl
        shadow-md shadow-roamly-g0/20
        cursor-pointer hover:bg-roamly-g1
        active:scale-[0.99]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* Label + emoji viaggio */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">
          {prossimoViaggio.cover_emoji ?? '✈️'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-dm-sans text-xs text-white/60 uppercase tracking-wider mb-0.5">
            Prossimo viaggio
          </p>
          <p className="font-lora text-base font-semibold text-white truncate">
            {prossimoViaggio.nome}
          </p>
          {prossimoViaggio.destinazione && (
            <p className="font-dm-sans text-xs text-white/50 truncate mt-0.5">
              {[prossimoViaggio.destinazione, prossimoViaggio.paese].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Countdown numerico */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/10">
        <p className={`
          font-lora font-semibold text-white
          flex items-center gap-2
          ${isOggi ? 'text-xl' : 'text-2xl'}
        `}>
          {labelCountdown}
          {isOggi && <PartyPopper size={18} />}
        </p>
        {!isOggi && giorniAlPartenza !== null && (
          <p className="font-dm-mono text-[10px] text-white/40 ml-auto shrink-0">
            {formatDataViaggio(prossimoViaggio.data_inizio, prossimoViaggio.data_fine)}
          </p>
        )}
      </div>
    </div>
  )
}
