import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { RicordoCard } from '@/features/momenti/RicordoCard'
import { GiornoLabel } from './GiornoLabel'
import { SezioneVuota } from './TimelineVuota'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import type { SezioneViaggio as SezioneViaggioType } from '@/lib/diario-utils'

// ============================================================
// SezioneViaggio — sezione collassabile nella timeline del Diario
//
// Header: tap area sinistra/centro → collapse/expand
//         tap icona → → naviga a /viaggi/:id
// Animazione: Framer Motion height 0 ↔ auto, 250ms easeInOut
// ============================================================

interface SezioneViaggioProps {
  sezione: SezioneViaggioType
  isExpanded: boolean
  onToggle: () => void
}

export function SezioneViaggio({ sezione, isExpanded, onToggle }: SezioneViaggioProps) {
  const navigate = useNavigate()
  const { viaggio, giorni, totaleRicordi, totaleFiltrati, isEmpty, isEmptyConFiltri } = sezione

  const dataViaggio = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)

  // Label contatore nella header
  const labelContatore = () => {
    if (isEmpty) return 'Nessun ricordo'
    if (isEmptyConFiltri) return `0 di ${totaleRicordi}`
    if (totaleFiltrati < totaleRicordi) return `${totaleFiltrati} di ${totaleRicordi}`
    return `${totaleRicordi} ${totaleRicordi === 1 ? 'ricordo' : 'ricordi'}`
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── Header sezione — due zone di tap distinte ── */}
      <div className="flex items-center gap-2 py-2">

        {/* Zona collapse (sinistra + centro) — occupa tutto lo spazio disponibile */}
        <button
          onClick={onToggle}
          className="
            flex items-center gap-3 flex-1 min-w-0
            text-left
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-lg
            active:opacity-70
            transition-opacity duration-100
          "
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Comprimi' : 'Espandi'} ${viaggio.nome}`}
        >
          {/* Emoji copertina */}
          <span className="text-xl shrink-0">{viaggio.cover_emoji ?? '✈️'}</span>

          {/* Nome + metadati */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-lora text-base font-semibold text-roamly-g0 truncate">
                {viaggio.nome}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-dm-mono text-[10px] text-roamly-text/35 truncate">
                {dataViaggio}
              </span>
              <span className="text-roamly-text/20 text-[10px]">·</span>
              <span className="font-dm-sans text-[10px] text-roamly-text/35 shrink-0">
                {labelContatore()}
              </span>
            </div>
          </div>

          {/* Chevron animato */}
          <motion.div
            animate={{ rotate: isExpanded ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-roamly-text/30">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </motion.div>
        </button>

        {/* Zona navigazione (destra) — tap separato → /viaggi/:id */}
        <button
          onClick={() => navigate(`/viaggi/${viaggio.id}`)}
          className="
            w-7 h-7 rounded-lg
            flex items-center justify-center
            text-roamly-g3/60 hover:text-roamly-g2 hover:bg-roamly-g6
            transition-all duration-150
            shrink-0
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          "
          aria-label={`Vai al viaggio ${viaggio.nome}`}
          title="Apri viaggio"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* ── Contenuto collassabile ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="contenuto"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-4 pb-2 pt-1">

              {/* Viaggio senza ricordi */}
              {isEmpty && (
                <SezioneVuota viaggioId={viaggio.id} />
              )}

              {/* Filtri azzerano i risultati */}
              {isEmptyConFiltri && (
                <p className="font-dm-sans text-sm text-roamly-text/40 text-center py-3">
                  Nessun ricordo corrisponde ai filtri attivi.
                </p>
              )}

              {/* Giorni con ricordi */}
              {giorni.map((giorno) => (
                <div key={giorno.data} className="flex flex-col gap-2">
                  <GiornoLabel dataFormattata={giorno.dataFormattata} />
                  <div className="flex flex-col gap-2">
                    {giorno.ricordi.map((r) => (
                      <RicordoCard key={r.id} ricordo={r} />
                    ))}
                  </div>
                </div>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
