import { useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { PrenotazioneForm } from './PrenotazioneForm'
import type { PrenotazioneFormData } from './PrenotazioneForm'
import { usePrenotazioni, useCreatePrenotazione, useUpdatePrenotazione, useDeletePrenotazione } from '@/hooks/usePrenotazioni'
import type { TipoPrenotazione } from '@/types'

// ============================================================
// PrenotazionePage — /viaggi/:id/prenotazioni/nuova (create)
//                     /viaggi/:id/prenotazioni/:prenotazioneId (edit)
// Stessa pagina per entrambe le modalità, come ViaggioForm/RicordoForm.
// ============================================================

export function PrenotazionePage() {
  const { id: viaggioId, prenotazioneId } = useParams<{ id: string; prenotazioneId?: string }>()
  const [searchParams] = useSearchParams()

  const isEdit = !!prenotazioneId && prenotazioneId !== 'nuova'
  const tipoParam = searchParams.get('tipo') as TipoPrenotazione | null

  // In modalità edit, recupera la prenotazione dalla lista già in cache
  // (evita una query dedicata per il singolo elemento)
  const { data: prenotazioni } = usePrenotazioni(viaggioId)
  const prenotazione = isEdit ? prenotazioni?.find((p) => p.id === prenotazioneId) : undefined

  const { createPrenotazione, isLoading: isCreating, error: createError } = useCreatePrenotazione(viaggioId ?? '')
  const { updatePrenotazione, isLoading: isUpdating, error: updateError } = useUpdatePrenotazione(viaggioId ?? '')
  const { deletePrenotazione, isLoading: isDeleting, error: deleteError } = useDeletePrenotazione(viaggioId ?? '')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSubmit(data: PrenotazioneFormData) {
    const payload = {
      viaggio_id: viaggioId ?? '',
      tipo: data.tipo,
      nome: data.nome,
      data: data.data || null,
      prezzo: data.prezzo ? Number(data.prezzo) : null,
      stato: data.stato,
      dettaglio: data.note ? { note: data.note } : null,
    }

    if (isEdit && prenotazioneId) {
      updatePrenotazione(prenotazioneId, payload)
    } else {
      createPrenotazione(payload)
    }
  }

  function handleDelete() {
    if (!prenotazioneId) return
    deletePrenotazione(prenotazioneId)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title={isEdit ? 'Modifica prenotazione' : 'Nuova prenotazione'}
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-8">
          <PrenotazioneForm
            prenotazione={prenotazione}
            tipoIniziale={tipoParam ?? undefined}
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
                  Elimina prenotazione
                </Button>
              ) : (
                <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
                  <p className="font-dm-sans text-sm font-medium text-red-600">
                    Eliminare questa prenotazione? L'azione non può essere annullata.
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
