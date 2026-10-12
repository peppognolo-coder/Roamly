import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { PageLayout }    from '@/components/layout/PageLayout'
import { PageHeader }    from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { ViaggioForm }   from './ViaggioForm'
import { DEFAULT_COVER_ICON_ID } from '@/lib/viaggio-cover-icons'
import { useCreateViaggio } from '@/hooks/useCrudViaggio'
import { useAssegnaLuoghi } from '@/hooks/useLuoghiSalvati'
import type { ViaggioFormData } from './ViaggioForm'

// Stato opzionale passato da "Voglio andarci" quando si organizza un viaggio
// a partire da luoghi salvati vicini tra loro.
interface StatoDaLuoghi {
  daLuoghi?: {
    nomeZona: string | null
    paese: string | null
    lat: number
    lng: number
    ids: string[]
  }
}

// ============================================================
// NuovoViaggioPage — /viaggi/nuovo
// Solo Nome obbligatorio → viaggio creabile in < 60 secondi.
// ============================================================

export function NuovoViaggioPage() {
  const location = useLocation()
  const daLuoghi = (location.state as StatoDaLuoghi | null)?.daLuoghi
  const assegnaLuoghi = useAssegnaLuoghi()
  const { createViaggio, isLoading, error } = useCreateViaggio({
    onCreato: (viaggioId) => {
      if (daLuoghi) void assegnaLuoghi(daLuoghi.ids, viaggioId)
    },
  })

  const iniziale = useMemo<Partial<ViaggioFormData> | undefined>(() => {
    if (!daLuoghi) return undefined
    return {
      nome: daLuoghi.nomeZona ? `Viaggio a ${daLuoghi.nomeZona}`.slice(0, 60) : '',
      destinazione: daLuoghi.nomeZona ?? '',
      paese: daLuoghi.paese ?? '',
      destinazione_lat: daLuoghi.lat,
      destinazione_lng: daLuoghi.lng,
    }
  }, [daLuoghi])

  function handleSubmit(data: ViaggioFormData) {
    createViaggio({
      nome:         data.nome,
      destinazione: data.destinazione || null,
      paese:        data.paese        || null,
      paese_codice: data.paese_codice || null,
      destinazione_lat: data.destinazione_lat ?? null,
      destinazione_lng: data.destinazione_lng ?? null,
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
          subtitle={daLuoghi ? `Con i ${daLuoghi.ids.length} posti che hai salvato` : 'Solo il nome è obbligatorio'}
          variant="withBack"
        />

        {/* Form */}
        <div className="flex-1 px-5 pb-8">
          <ViaggioForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitLabel="Crea viaggio"
            iniziale={iniziale}
          />
        </div>

      </div>
    </AnimatedPage>
    </PageLayout>
  )
}
