import { PageLayout }        from '@/components/layout/PageLayout'
import { PageHeader }        from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }         from '@/components/layout/BottomNav'
import { CountdownSection }  from './CountdownSection'
import { ChecklistSection }  from './ChecklistSection'
import { ViaggioCard }       from '@/features/viaggi/ViaggioCard'
import { usePianifica }      from '@/hooks/usePianifica'

// ============================================================
// PianificaPage — /pianifica
// Struttura:
//   Header
//   CountdownSection  (prossimo viaggio o viaggio in corso)
//   Viaggi futuri     (lista ViaggioCard con accordion checklist)
// ============================================================

export function PianificaPage() {
  const {
    viaggiPianificati,
    prossimoViaggio,
    giorniAlPartenza,
    viaggioAttivo,
    isLoading,
  } = usePianifica()

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

              {/* Viaggi futuri + checklist */}
              {viaggiPianificati.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider
                    text-roamly-text/50 mb-2">
                    Viaggi pianificati · {viaggiPianificati.length}
                  </h2>

                  {viaggiPianificati.map((viaggio) => (
                    <div key={viaggio.id} className="
                      bg-white rounded-2xl
                      shadow-roamly
                      px-4 pt-1 pb-3
                    ">
                      {/* Card viaggio (navigazione a dettaglio) */}
                      <ViaggioCard viaggio={viaggio} linkTab="pianifica" />

                      {/* Divisore */}
                      <div className="h-px bg-roamly-g6 mx-0 my-1" />

                      {/* Checklist lazy accordion */}
                      <ChecklistSection viaggio={viaggio} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
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
