import { PageLayout }    from '@/components/layout/PageLayout'
import { PageHeader }    from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { ViaggioForm }   from './ViaggioForm'
import { DEFAULT_COVER_ICON_ID } from '@/lib/viaggio-cover-icons'
import { useCreateViaggio } from '@/hooks/useCrudViaggio'
import type { ViaggioFormData } from './ViaggioForm'

// ============================================================
// NuovoViaggioPage — /viaggi/nuovo
// Solo Nome obbligatorio → viaggio creabile in < 60 secondi.
// ============================================================

export function NuovoViaggioPage() {
  const { createViaggio, isLoading, error } = useCreateViaggio()

  function handleSubmit(data: ViaggioFormData) {
    createViaggio({
      nome:         data.nome,
      destinazione: data.destinazione || null,
      paese:        data.paese        || null,
      data_inizio:  data.data_inizio  || null,
      data_fine:    data.data_fine    || null,
      cover_emoji:  data.cover_emoji  ?? DEFAULT_COVER_ICON_ID,
      budget_totale: null,
    })
  }

  return (
    <PageLayout withBottomNav={false}>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {/* Header con back */}
        <PageHeader
          title="Nuovo viaggio"
          subtitle="Solo il nome è obbligatorio"
          variant="withBack"
        />

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
