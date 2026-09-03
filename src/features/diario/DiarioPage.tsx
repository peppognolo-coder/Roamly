import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageLayout }            from '@/components/layout/PageLayout'
import { BottomNav }             from '@/components/layout/BottomNav'
import { HeroCardDiario }        from './HeroCardDiario'
import { RicordoDelGiornoCard, RicordoDelGiornoCardSkeleton } from '@/components/ricordi/RicordoDelGiornoCard'
import { useRicordoDelGiorno }    from '@/hooks/useRicordoDelGiorno'
import { FiltriBar }             from './FiltriBar'
import { SezioneViaggio }        from './SezioneViaggio'
import { DiarioVuoto, DiarioVuotoConFiltri } from './TimelineVuota'
import { useDiario }             from '@/hooks/useDiario'
import { useFiltriDiario }       from '@/hooks/useFiltriDiario'
import { useCollapseViaggi }     from '@/hooks/useCollapseViaggi'

// ============================================================
// DiarioPage — /diario
// "Il Diario non è una lista. È il luogo dove l'utente torna
//  non per fare qualcosa, ma per sentire qualcosa."
//
// Struttura:
//   Header sticky
//   FiltriBar
//   HeroCardDiario (Ricordo in evidenza)
//   RicordoDelGiornoCard (placeholder B45 — visibile se ≥ 3 ricordi)
//   Timeline: SezioneViaggio[] collassabili
// ============================================================

export function DiarioPage() {
  const { filtri, toggleMood, togglePreferiti, toggleAutore, resetFiltri } = useFiltriDiario()

  const {
    sezioni,
    ricordoInEvidenza,
    isLoading,
    isEmpty,
    isEmptyConFiltri,
    totaleFiltrati,
    totaleRicordi,
    haViaggi,
    autoriDisponibili,
  } = useDiario(filtri)

  // IDs per il collapse — stabile, memoizzato
  const viaggioIds = useMemo(
    () => sezioni.map((s) => s.viaggio.id),
    [sezioni]
  )
  const { isExpanded, toggle } = useCollapseViaggi(viaggioIds)

  // Viaggio del ricordo in evidenza — cercato direttamente nelle sezioni già in memoria.
  // Evita un fetch/hook aggiuntivo: il viaggio è già presente in sezioni
  // grazie a useDiario che carica tutti i viaggi con useViaggi().
  const viaggioHero = ricordoInEvidenza
    ? sezioni.find((s) => s.viaggio.id === ricordoInEvidenza.viaggio_id)?.viaggio
    : undefined

  // B45 — Ricordo del Giorno reale
  const { data: ricordoDelGiorno, isLoading: isLoadingB45 } = useRicordoDelGiorno()
  // Mostra solo se l'utente ha almeno 3 ricordi
  const mostraRicordoDelGiorno = totaleRicordi >= 3

  return (
    <PageLayout>
      <div className="flex flex-col min-h-screen">

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 bg-roamly-bg/95 backdrop-blur-sm px-5 pt-14 pb-3">
          <h1 className="font-lora text-h1 text-roamly-g0 mb-3">
            Il tuo diario
          </h1>
          <FiltriBar
            filtri={filtri}
            onToggleMood={toggleMood}
            onTogglePreferiti={togglePreferiti}
            onToggleAutore={toggleAutore}
            onReset={resetFiltri}
            totaleFiltrati={totaleFiltrati}
            totaleRicordi={totaleRicordi}
            autoriDisponibili={autoriDisponibili}
          />
        </header>

        {/* ── Loading globale ── */}
        {isLoading && (
          <div className="flex-1 px-5 pt-4 flex flex-col gap-4">
            <SkeletonHero />
            <SkeletonTimeline />
          </div>
        )}

        {/* ── Empty state: nessun ricordo ── */}
        {!isLoading && isEmpty && <DiarioVuoto haViaggi={haViaggi} />}

        {/* ── Empty state: filtri azzerano tutto ── */}
        {!isLoading && isEmptyConFiltri && (
          <DiarioVuotoConFiltri onReset={resetFiltri} />
        )}

        {/* ── Contenuto principale ── */}
        {!isLoading && !isEmpty && !isEmptyConFiltri && (
          <div className="flex-1 px-5 pt-4 pb-8 flex flex-col gap-5">

            {/* Hero Card */}
            {ricordoInEvidenza && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <HeroCardDiario
                  ricordo={ricordoInEvidenza}
                  viaggio={viaggioHero}
                />
              </motion.div>
            )}

            {/* B45 — Ricordo del Giorno reale */}
            {mostraRicordoDelGiorno && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
              >
                {isLoadingB45 ? (
                  <RicordoDelGiornoCardSkeleton />
                ) : ricordoDelGiorno ? (
                  <RicordoDelGiornoCard
                    ricordo={ricordoDelGiorno.ricordo}
                    viaggio={ricordoDelGiorno.viaggio}
                    labelTempo={ricordoDelGiorno.labelTempo}
                  />
                ) : null}
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              className="flex flex-col gap-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.15 }}
            >
              {sezioni.map((sezione) => (
                <SezioneViaggio
                  key={sezione.viaggio.id}
                  sezione={sezione}
                  isExpanded={isExpanded(sezione.viaggio.id)}
                  onToggle={() => toggle(sezione.viaggio.id)}
                />
              ))}
            </motion.div>

          </div>
        )}

      </div>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// Skeletons
// ------------------------------------------------------------

function SkeletonHero() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-roamly">
      <div className="h-36 bg-roamly-g6 animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/3" />
        <div className="h-6 bg-roamly-g6 rounded animate-pulse w-4/5" />
        <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}

function SkeletonTimeline() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-roamly-g6 animate-pulse" />
            <div className="h-4 bg-roamly-g6 rounded animate-pulse w-1/3" />
          </div>
          <div className="flex gap-0 h-20 bg-white rounded-2xl shadow-roamly overflow-hidden">
            <div className="w-20 bg-roamly-g6 animate-pulse" />
            <div className="flex-1 p-3 flex flex-col gap-2">
              <div className="h-3 bg-roamly-g6 rounded animate-pulse w-3/4" />
              <div className="h-2.5 bg-roamly-g6 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
