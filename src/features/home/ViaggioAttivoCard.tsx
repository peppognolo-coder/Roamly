import { useNavigate } from 'react-router-dom'
import { StatoBadge } from '@/features/viaggi/StatoBadge'
import { calcolaGiorniAlPartenza, formatDataViaggio } from '@/lib/viaggi-utils'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ViaggioAttivoCard — card viaggio attivo/prossimo in Home
// Tre stati: in_corso · pianificato · nessun viaggio
// ============================================================

interface ViaggioAttivoCardProps {
  viaggio: ViaggioConStato | null
  isLoading: boolean
}

export function ViaggioAttivoCard({ viaggio, isLoading }: ViaggioAttivoCardProps) {
  const navigate = useNavigate()

  if (isLoading) return <ViaggioAttivoSkeleton />

  if (!viaggio) return <NessunViaggioCard />

  const dataViaggio = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const stato = viaggio.stato_effettivo

  // Calcola progresso per viaggio in corso
  const progresso = (() => {
    if (stato !== 'in_corso' || !viaggio.data_inizio || !viaggio.data_fine) return null
    const [iy, im, id] = viaggio.data_inizio.split('-').map(Number)
    const [fy, fm, fd] = viaggio.data_fine.split('-').map(Number)
    const inizio = new Date(iy, im - 1, id).getTime()
    const fine   = new Date(fy, fm - 1, fd).getTime()
    const oggi   = new Date()
    oggi.setHours(0, 0, 0, 0)
    const totale   = fine - inizio
    const trascorso = Math.min(oggi.getTime() - inizio, totale)
    return totale > 0 ? Math.round((trascorso / totale) * 100) : 0
  })()

  // Countdown per viaggio pianificato
  const giorniAlPartenza = stato === 'pianificato' && viaggio.data_inizio
    ? calcolaGiorniAlPartenza(viaggio.data_inizio)
    : null

  return (
    <button
      onClick={() => navigate(`/viaggi/${viaggio.id}`)}
      className="
        w-full text-left
        bg-roamly-g0 rounded-2xl p-4
        hover:bg-roamly-g1 active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        shadow-roamly-lg
      "
    >
      {/* Riga superiore: emoji + nome + badge */}
      <div className="flex items-start gap-3">
        <div className="
          w-11 h-11 rounded-xl bg-white/15
          flex items-center justify-center
          text-xl shrink-0
        ">
          {viaggio.cover_emoji ?? '✈️'}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-lora text-base font-semibold text-white truncate">
              {viaggio.nome}
            </p>
            <StatoBadge stato={stato} size="sm" />
          </div>

          {viaggio.destinazione && (
            <p className="font-dm-sans text-xs text-white/60 truncate mt-0.5">
              {[viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')}
            </p>
          )}

          <p className="font-dm-mono text-[10px] text-white/40 mt-0.5">
            {dataViaggio}
          </p>
        </div>

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="opacity-40 shrink-0 mt-1">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {/* Barra progresso per viaggio in corso */}
      {progresso !== null && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-dm-sans text-[10px] text-white/50">Progresso viaggio</span>
            <span className="font-dm-mono text-[10px] text-white/50">{progresso}%</span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/70 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {/* Countdown per viaggio pianificato */}
      {giorniAlPartenza !== null && giorniAlPartenza > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="font-dm-sans text-xs text-white/60">
            Mancano
          </span>
          <span className="font-lora text-sm font-semibold text-white">
            {giorniAlPartenza} {giorniAlPartenza === 1 ? 'giorno' : 'giorni'}
          </span>
        </div>
      )}
    </button>
  )
}

// ---- Nessun viaggio ----

function NessunViaggioCard() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/viaggi/nuovo')}
      className="
        w-full text-left
        bg-roamly-g7 rounded-2xl p-4
        border border-roamly-g5 border-dashed
        hover:bg-roamly-g6 active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-roamly-g6 flex items-center justify-center text-xl">
          ✈️
        </div>
        <div>
          <p className="font-dm-sans font-medium text-sm text-roamly-g1">
            Pianifica il tuo prossimo viaggio
          </p>
          <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5">
            La tua prossima avventura ti aspetta
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-roamly-text/20 ml-auto shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  )
}

// ---- Skeleton ----

function ViaggioAttivoSkeleton() {
  return (
    <div className="bg-roamly-g0/20 rounded-2xl p-4">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-xl bg-roamly-g5 animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-0.5">
          <div className="h-4 bg-roamly-g5 rounded animate-pulse w-2/3" />
          <div className="h-3 bg-roamly-g5 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  )
}
