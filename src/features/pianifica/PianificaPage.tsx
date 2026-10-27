import { motion }            from 'framer-motion'
import { PageLayout }        from '@/components/layout/PageLayout'
import { staggerItem }       from '@/lib/animations'
import { PageHeader }        from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { CountdownSection }  from './CountdownSection'
import { ChecklistSection }  from './ChecklistSection'
import { ViaggioCard }       from '@/features/viaggi/ViaggioCard'
import { usePianifica }      from '@/hooks/usePianifica'

// ============================================================
// PianificaPage — /pianifica
// Struttura:
//   Header
//   CountdownSection  (prossimo viaggio o viaggio in corso) — è l'unica
//                     card del prossimo viaggio; apre la sua pianificazione
//   Valigia           (checklist del prossimo viaggio, subito sotto)
//   Altri viaggi      (lista ViaggioCard con accordion checklist)
// ============================================================

export function PianificaPage() {
  const {
    viaggiPianificati,
    prossimoViaggio,
    giorniAlPartenza,
    viaggioAttivo,
    isLoading,
  } = usePianifica()

  // Il countdown mostra il prossimo viaggio solo se non c'è un viaggio in corso
  const countdownMostraProssimo = viaggioAttivo?.stato_effettivo !== 'in_corso'
  const altriPianificati = countdownMostraProssimo
    ? viaggiPianificati.filter((v) => v.id !== prossimoViaggio?.id)
    : viaggiPianificati

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {/* Header */}
        <PageHeader title="Pianifica" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-6">

          {/* Skeleton globale */}
          {isLoading && <SkeletonPianifica />}

          {/* Contenuto */}
          {!isLoading && (
            <>
              {/* Countdown / stato viaggio corrente */}
              <CountdownSection
                prossimoViaggio={prossimoViaggio}
                giorniAlPartenza={giorniAlPartenza}
                viaggioAttivo={viaggioAttivo}
              />

              {/* Checklist del prossimo viaggio — la card del viaggio è già
                  il countdown qui sopra, quindi non si ripete */}
              {prossimoViaggio && countdownMostraProssimo && (
                <div className="bg-white rounded-2xl shadow-roamly px-4 py-3">
                  <ChecklistSection viaggio={prossimoViaggio} />
                </div>
              )}

              {/* Altri viaggi futuri + checklist */}
              {altriPianificati.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider
                    text-roamly-text/50 mb-2">
                    {countdownMostraProssimo ? 'Altri viaggi in programma' : 'Viaggi in programma'} · {altriPianificati.length}
                  </h2>

                  {altriPianificati.map((viaggio, i) => (
                    <motion.div key={viaggio.id} {...staggerItem(i)} className="
                      bg-white rounded-2xl
                      shadow-roamly
                      px-4 pt-1 pb-3 mb-3
                    ">
                      <ViaggioCard viaggio={viaggio} linkTab="pianifica" />
                      <div className="h-px bg-roamly-g6 mx-0 my-1" />
                      <ChecklistSection viaggio={viaggio} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

// ------------------------------------------------------------
// Skeleton
// ------------------------------------------------------------

function SkeletonPianifica() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-28 bg-roamly-g6 rounded-2xl animate-pulse" />
      <div className="flex flex-col gap-3">
        <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/3" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-roamly-g6 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
