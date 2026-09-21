import { useParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { RaccontoViaggio } from './RaccontoViaggio'
import { useViaggio, useStatisticheViaggio } from '@/hooks/useViaggi'
import { useRicordi } from '@/hooks/useRicordi'
import { useCoversByViaggio, useCoverViaggio, useFotoCountByViaggio } from '@/hooks/useFoto'

// ============================================================
// RaccontoPage — /viaggi/:id/racconto
// Esperienza editoriale immersiva (RaccontoViaggio), non più un
// tab di ViaggioDetailPage — ora raggiungibile solo dalla card
// "Il tuo recap è pronto" (RecapViaggioPage → "Rileggi il racconto").
// ============================================================

export function RaccontoPage() {
  const { id: viaggioId } = useParams<{ id: string }>()

  const { data: viaggio, isLoading: isLoadingViaggio } = useViaggio(viaggioId)
  const { data: stats } = useStatisticheViaggio(viaggioId)
  const { data: ricordi = [], isLoading: isLoadingRicordi } = useRicordi(viaggioId)
  const { data: coversMap }   = useCoversByViaggio(viaggioId)
  const { data: coverViaggio } = useCoverViaggio(viaggioId)
  const { data: fotoCount }    = useFotoCountByViaggio(viaggioId)

  const isLoading = isLoadingViaggio || isLoadingRicordi

  if (isLoading || !viaggio) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <AnimatedPage>
        <RaccontoViaggio
          viaggioId={viaggioId ?? ''}
          viaggio={viaggio}
          ricordi={ricordi}
          coversMap={coversMap}
          fotoCount={fotoCount}
          coverViaggio={coverViaggio}
          numRicordi={stats?.ricordi ?? 0}
          isLoading={isLoadingRicordi}
        />
      </AnimatedPage>
    </PageLayout>
  )
}
