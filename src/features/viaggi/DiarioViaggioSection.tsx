import { useMemo }              from 'react'
import { useNavigate }          from 'react-router-dom'
import { motion }               from 'framer-motion'
import { RicordoTimelineCard }  from './RicordoTimelineCard'
import { buildTimelineViaggio, formatDataGiornoBreve } from '@/lib/viaggi-diario-utils'
import type { Ricordo }         from '@/types'

// ============================================================
// DiarioViaggioSection — timeline narrativa del viaggio
// Sezione "Diario" in ViaggioDetailPage.
//
// Raggruppamento per data ASC (passato → presente).
// Ogni giorno mostra: header data · stats · lista ricordi.
// Dati: ricordi + coversMap + fotoCount già in cache — zero query aggiuntive.
// ============================================================

interface DiarioViaggioSectionProps {
  viaggioId:   string
  ricordi:     Ricordo[]
  coversMap?:  Map<string, string>      // ricordoId → thumbnailSignedUrl
  fotoCount?:  Map<string, number>      // ricordoId → count
  isLoading:   boolean
}

export function DiarioViaggioSection({
  viaggioId,
  ricordi,
  coversMap,
  fotoCount,
  isLoading,
}: DiarioViaggioSectionProps) {
  const navigate = useNavigate()

  // Costruisce la timeline — memoizzata: ricalcola solo se dati cambiano
  const giorni = useMemo(
    () => buildTimelineViaggio(ricordi, fotoCount ?? new Map()),
    [ricordi, fotoCount]
  )

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((g) => (
          <div key={g} className="flex flex-col gap-2">
            <div className="h-5 bg-roamly-g6 rounded animate-pulse w-2/5" />
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-0 h-24 bg-white rounded-2xl border border-roamly-g6 overflow-hidden">
                <div className="w-24 bg-roamly-g6 animate-pulse shrink-0" />
                <div className="flex-1 p-3.5 flex flex-col gap-2">
                  <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/4" />
                  <div className="h-4 bg-roamly-g6 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── Empty state ──
  if (giorni.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center
        bg-white rounded-2xl border border-roamly-g6">
        <div className="
          w-16 h-16 rounded-2xl bg-roamly-g7 border border-roamly-g6
          flex items-center justify-center
        ">
          <span className="text-3xl">📖</span>
        </div>
        <div className="flex flex-col gap-1 px-6">
          <p className="font-lora text-base font-semibold text-roamly-g0">
            Questo viaggio aspetta ancora
          </p>
          <p className="font-lora text-base font-semibold text-roamly-g0">
            la sua storia.
          </p>
          <p className="font-dm-sans text-sm text-roamly-text/50 mt-1">
            Aggiungi il tuo primo ricordo per iniziare il diario.
          </p>
        </div>
        <button
          onClick={() => navigate(`/nuovo-ricordo?viaggioId=${viaggioId}`)}
          className="
            px-5 py-2.5 bg-roamly-g0 rounded-xl
            font-dm-sans text-sm font-medium text-white
            hover:bg-roamly-g1 active:scale-95
            transition-all duration-150
          "
        >
          Aggiungi il primo ricordo
        </button>
      </div>
    )
  }

  // ── Timeline ──
  return (
    <div className="flex flex-col gap-6">
      {giorni.map((giorno, gi) => (
        <motion.div
          key={giorno.data}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: gi * 0.04, ease: 'easeOut' }}
          className="flex flex-col gap-2"
        >
          {/* Header giorno */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <h3 className="font-lora text-base font-semibold text-roamly-g0">
                {formatDataGiornoBreve(giorno.data)}
              </h3>
              <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5">
                {giorno.totaleRicordi === 1
                  ? '1 ricordo'
                  : `${giorno.totaleRicordi} ricordi`
                }
                {giorno.totaleFoto > 0 && (
                  <span> · {giorno.totaleFoto === 1 ? '1 foto' : `${giorno.totaleFoto} foto`}</span>
                )}
              </p>
            </div>
            <div className="flex-1 h-px bg-roamly-g6" />
          </div>

          {/* Ricordi del giorno */}
          <div className="flex flex-col gap-2">
            {giorno.ricordi.map((r) => (
              <RicordoTimelineCard
                key={r.id}
                ricordo={r}
                coverUrl={coversMap?.get(r.id)}
                fotoCount={fotoCount?.get(r.id) ?? 0}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
