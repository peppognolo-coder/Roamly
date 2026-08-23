import { useNavigate } from 'react-router-dom'
import { PageLayout }    from '@/components/layout/PageLayout'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { ViaggioForm }   from './ViaggioForm'
import { useCreateViaggio } from '@/hooks/useCrudViaggio'
import type { ViaggioFormData } from './ViaggioForm'

// ============================================================
// NuovoViaggioPage — /viaggi/nuovo
// Solo Nome obbligatorio → viaggio creabile in < 60 secondi.
// ============================================================

export function NuovoViaggioPage() {
  const navigate = useNavigate()
  const { createViaggio, isLoading, error } = useCreateViaggio()

  function handleSubmit(data: ViaggioFormData) {
    createViaggio({
      nome:         data.nome,
      destinazione: data.destinazione || null,
      paese:        data.paese        || null,
      data_inizio:  data.data_inizio  || null,
      data_fine:    data.data_fine    || null,
      cover_emoji:  data.cover_emoji  ?? '✈️',
      budget_totale: null,
    })
  }

  return (
    <PageLayout withBottomNav={false}>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {/* Header con back */}
        <header className="flex items-center gap-3 px-5 pt-14 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="
              w-9 h-9 rounded-xl
              flex items-center justify-center
              bg-roamly-g7 border border-roamly-g6
              hover:bg-roamly-g6
              active:scale-95
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
            aria-label="Torna indietro"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="font-lora text-xl font-semibold text-roamly-g0">
              Nuovo viaggio
            </h1>
            <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5">
              Solo il nome è obbligatorio
            </p>
          </div>
        </header>

        {/* Form */}
        <div className="flex-1 px-5 pb-8">
          <ViaggioForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel="Crea viaggio"
          />
        </div>

      </div>
    </AnimatedPage>
    </PageLayout>
  )
}
