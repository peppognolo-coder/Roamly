import { useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { TappaForm } from './TappaForm'
import type { TappaFormData } from './TappaForm'
import { useTappe, useCreateTappa, useUpdateTappa, useDeleteTappa } from '@/hooks/useTappe'

// ============================================================
// TappaPage — /viaggi/:id/tappe/nuova (create)
//              /viaggi/:id/tappe/:tappaId (edit)
// Usata sia da Itinerario che da Attività — il redirect di ritorno
// dipende da dove si arriva (?from=itinerario|attivita).
// ============================================================

export function TappaPage() {
  const { id: viaggioId, tappaId } = useParams<{ id: string; tappaId?: string }>()
  const [searchParams] = useSearchParams()
  const fromAttivita = searchParams.get('from') === 'attivita'
  const redirectTo = `/viaggi/${viaggioId}/${fromAttivita ? 'attivita' : 'itinerario'}`

  const isEdit = !!tappaId && tappaId !== 'nuova'
  const giornoParam = searchParams.get('giorno')
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  const { data: tappe } = useTappe(viaggioId)
  const tappa = isEdit ? tappe?.find((t) => t.id === tappaId) : undefined

  const { createTappa, isLoading: isCreating, error: createError } = useCreateTappa(viaggioId ?? '', redirectTo)
  const { updateTappa, isLoading: isUpdating, error: updateError } = useUpdateTappa(viaggioId ?? '', redirectTo)
  const { deleteTappa, isLoading: isDeleting, error: deleteError } = useDeleteTappa(viaggioId ?? '', redirectTo)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const posizioneIniziale = latParam && lngParam
    ? { lat: Number(latParam), lng: Number(lngParam) }
    : undefined

  function handleSubmit(data: TappaFormData) {
    const payload = {
      viaggio_id: viaggioId ?? '',
      nome: data.nome,
      categoria: data.categoria,
      giorno: data.giorno || null,
      giorno_fine: data.giorno_fine || data.giorno || null,
      ora: data.ora || null,
      indirizzo: data.indirizzo || null,
      note: data.note || null,
      ...(posizioneIniziale && !isEdit
        ? { lat: posizioneIniziale.lat, lng: posizioneIniziale.lng }
        : {}),
    }

    if (isEdit && tappaId) {
      updateTappa(tappaId, payload)
    } else {
      createTappa(payload)
    }
  }

  function handleDelete() {
    if (!tappaId) return
    deleteTappa(tappaId)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title={isEdit ? 'Modifica tappa' : 'Nuova tappa'}
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-8">
          <TappaForm
            tappa={tappa}
            giornoIniziale={giornoParam ?? undefined}
            posizioneIniziale={posizioneIniziale}
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
            error={createError ?? updateError}
            submitLabel={isEdit ? 'Salva modifiche' : 'Aggiungi'}
          />

          {isEdit && (
            <div className="mt-6">
              {deleteError && (
                <p className="font-dm-sans text-sm text-red-500 mb-3 text-center">
                  {deleteError}
                </p>
              )}
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500/70 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} className="mr-1.5" />
                  Elimina tappa
                </Button>
              ) : (
                <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
                  <p className="font-dm-sans text-sm font-medium text-red-600">
                    Eliminare questa tappa? L'azione non può essere annullata.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                      disabled={isDeleting}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleDelete}
                      isLoading={isDeleting}
                      className="flex-1 !bg-red-500 hover:!bg-red-600"
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
