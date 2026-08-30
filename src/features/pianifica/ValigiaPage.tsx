import { useParams } from 'react-router-dom'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { ChecklistSection } from './ChecklistSection'

// ============================================================
// ValigiaPage — /viaggi/:id/valigia
// Wrapper sottile: riusa ChecklistSection già esistente,
// ora agganciata al viaggio specifico invece che al "prossimo
// viaggio" globale di PianificaPage.
// ============================================================

export function ValigiaPage() {
  const { id } = useParams<{ id: string }>()
  const { data: viaggio, isLoading } = useViaggio(id)

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title="Valigia"
          subtitle={viaggio?.nome}
          variant="withBack"
        />

        <div className="flex-1 px-5">
          {isLoading ? (
            <div className="h-24 bg-white rounded-2xl shadow-roamly animate-pulse" />
          ) : viaggio ? (
            <ChecklistSection viaggio={viaggio} />
          ) : (
            <p className="font-dm-sans text-sm text-roamly-text/50 text-center py-8">
              Viaggio non trovato.
            </p>
          )}
        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
