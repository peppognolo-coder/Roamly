import { useParams, useSearchParams } from 'react-router-dom'
import { PageLayout }   from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { PrenotazioneForm } from './PrenotazioneForm'
import type { PrenotazioneFormData } from './PrenotazioneForm'
import { usePrenotazioni, useCreatePrenotazione, useUpdatePrenotazione, useDeletePrenotazione } from '@/hooks/usePrenotazioni'
import type { TipoPrenotazione } from '@/types'

// ============================================================
// PrenotazionePage — /viaggi/:id/prenotazioni/nuova (create)
//                     /viaggi/:id/prenotazioni/:prenotazioneId (edit)
// Stessa pagina per entrambe le modalità, come ViaggioForm/RicordoForm.
// Il layout (header, barra di progresso, footer con CTA) vive
// interamente in PrenotazioneForm — wizard a 3 passi.
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

  function handleSubmit(data: PrenotazioneFormData) {
    // Costruisce dettaglio includendo solo i campi effettivamente valorizzati,
    // per non riempire il JSONB di stringhe vuote.
    const dettaglio: Record<string, string> = {}
    const campiExtra: (keyof PrenotazioneFormData)[] = [
      'note', 'sottotipo', 'numero', 'da', 'a', 'orario',
      'checkout', 'numero_conferma', 'numero_biglietti',
      'numero_persone', 'numero_pratica', 'scadenza',
    ]
    for (const campo of campiExtra) {
      const valore = data[campo]
      if (valore) dettaglio[campo] = String(valore)
    }

    const payload = {
      viaggio_id: viaggioId ?? '',
      tipo: data.tipo,
      nome: data.nome,
      data: data.data || null,
      prezzo: data.prezzo ? Number(data.prezzo) : null,
      stato: data.stato,
      dettaglio: Object.keys(dettaglio).length > 0 ? dettaglio : null,
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
      <AnimatedPage className="flex flex-col h-screen overflow-hidden">
        <PrenotazioneForm
          prenotazione={prenotazione}
          tipoIniziale={tipoParam ?? undefined}
          onSubmit={handleSubmit}
          isLoading={isCreating || isUpdating}
          error={createError ?? updateError}
          submitLabel={isEdit ? 'Salva modifiche' : 'Aggiungi'}
          isEdit={isEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      </AnimatedPage>
    </PageLayout>
  )
}
