import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { PageLayout }              from '@/components/layout/PageLayout'
import { PageHeader }              from '@/components/layout/PageHeader'
import { AnimatedPage }            from '@/components/layout/AnimatedPage'
import { Button }                  from '@/components/ui/Button'
import { RicordoForm }             from './RicordoForm'
import { FotoUploader }            from './FotoUploader'
import { useViaggi }               from '@/hooks/useViaggi'
import { useCreateRicordo }        from '@/hooks/useCrudRicordo'
import { useUploadFotoMultiplo }   from '@/hooks/useFoto'
import type { RicordoFormData }    from './RicordoForm'
import type { ViaggioConStato }    from '@/types'

// ============================================================
// NuovoRicordoPage — /nuovo-ricordo
//
// Scenari:
//   A. ?viaggioId=:id → viaggio pre-selezionato (da ViaggioDetailPage)
//   B. Nessun query param → mostra ViaggioSelector
//   C. Zero viaggi → schermata "Crea prima un viaggio"
//
// REGOLA HOOK: tutti gli hook sono dichiarati in cima al componente,
// prima di qualsiasi return condizionale. Nessun hook dopo un if/return.
// ============================================================

export function NuovoRicordoPage() {
  // ── Tutti gli hook prima di qualsiasi return ───────────────
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const viaggioIdParam    = searchParams.get('viaggioId')

  const { data: viaggi, isLoading: isLoadingViaggi } = useViaggi()

  // Stato foto pre-selezionate (disponibile sempre, indipendente dal branch)
  const [filesDaAllegare, setFilesDaAllegare] = useState<File[]>([])

  // Ricava il viaggio preselezionato dai dati (null finché viaggi non carica)
  const viaggioPreselezionato = viaggioIdParam && viaggi
    ? viaggi.find((v) => v.id === viaggioIdParam) ?? null
    : null

  const viaggioId = viaggioPreselezionato?.id ?? ''

  // Hook upload — viaggioId può essere '' prima della selezione,
  // ma uploadMultipliConId riceve il ricordoId al momento della chiamata
  const {
    uploadMultipliConId,
    isLoading: isUploading,
  } = useUploadFotoMultiplo('', 0, viaggioId)

  // Hook create — onCreato è stabile: se non ci sono file non fa upload
  const { createRicordo: createRicordoMutation, isLoading, error } = useCreateRicordo({
    skipNavigate: filesDaAllegare.length > 0,
    onCreato: async (ricordoId) => {
      if (filesDaAllegare.length > 0) {
        await uploadMultipliConId(filesDaAllegare, ricordoId)
      }
      navigate(`/viaggi/${viaggioId}`)
    },
  })

  // ── Return condizionali (solo dopo tutti gli hook) ─────────

  // Loading iniziale
  if (isLoadingViaggi) {
    return (
      <PageLayout withBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
        </div>
      </PageLayout>
    )
  }

  // Nessun viaggio
  if (!viaggi || viaggi.length === 0) {
    return (
      <PageLayout withBottomNav={false}>
        <NessunViaggioState onCrea={() => navigate('/viaggi/nuovo')} />
      </PageLayout>
    )
  }

  // Nessun viaggio pre-selezionato → selector
  if (!viaggioPreselezionato) {
    return (
      <PageLayout withBottomNav={false}>
        <ViaggioSelectorPage
          viaggi={viaggi}
          onSeleziona={(id) => navigate(`/nuovo-ricordo?viaggioId=${id}`, { replace: true })}
          onBack={() => navigate(-1)}
        />
      </PageLayout>
    )
  }

  // ── Render principale ──────────────────────────────────────

  function handleSubmit(data: RicordoFormData) {
    createRicordoMutation({
      viaggio_id: viaggioId,
      titolo:     data.titolo,
      testo:      data.testo     || null,
      luogo:      data.luogo     || null,
      mood:       data.mood,
      data:       data.data,
      preferito:  data.preferito,
    })
  }

  const isSubmitting = isLoading || isUploading

  return (
    <PageLayout withBottomNav={false}>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {/* Header */}
        <PageHeader title="Nuovo ricordo" variant="withBack" />

        {/* Viaggio selezionato — badge cliccabile */}
        <div className="px-5 pt-2 pb-4">
          <button
            onClick={() => navigate(`/nuovo-ricordo`, { replace: true })}
            className="
              flex items-center gap-2 px-3 py-2
              bg-roamly-g6 border border-roamly-g5 rounded-xl
              hover:bg-roamly-g5 active:scale-[0.98]
              transition-all duration-150
            "
          >
            <ViaggioCoverIcon value={viaggioPreselezionato.cover_emoji} size={18} />
            <div className="flex-1 text-left">
              <p className="font-dm-sans text-xs text-roamly-text/50">Viaggio</p>
              <p className="font-dm-sans text-sm font-medium text-roamly-g0 leading-none">
                {viaggioPreselezionato.nome}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-roamly-text/30">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Form + sezione foto */}
        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">
          <RicordoForm
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            error={error}
          />

          {/* Foto opzionali prima del salvataggio */}
          <div className="flex flex-col gap-2">
            <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50">
              Foto (opzionale)
            </p>

            {/* Anteprime file selezionati */}
            {filesDaAllegare.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {filesDaAllegare.map((f, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-roamly-g6 border border-roamly-g5">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setFilesDaAllegare((prev) => prev.filter((_, j) => j !== i))}
                      className="
                        absolute top-0.5 right-0.5
                        w-5 h-5 rounded-full bg-black/50
                        flex items-center justify-center text-white
                      "
                      aria-label="Rimuovi"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FotoUploader
              onFiles={setFilesDaAllegare}
              isLoading={false}
              progress={0}
              multiple={true}
              label="Aggiungi foto al ricordo"
              disabled={isSubmitting}
            />

            {filesDaAllegare.length > 0 && (
              <p className="font-dm-sans text-xs text-roamly-text/40">
                {filesDaAllegare.length === 1
                  ? '1 foto selezionata — verrà caricata dopo il salvataggio'
                  : `${filesDaAllegare.length} foto selezionate — verranno caricate dopo il salvataggio`
                }
              </p>
            )}
          </div>
        </div>

      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

// ------------------------------------------------------------
// NessunViaggioState
// ------------------------------------------------------------

function NessunViaggioState({ onCrea }: { onCrea: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-roamly-g7 shadow-roamly flex items-center justify-center">
        <MapPin size={32} className="text-roamly-g3" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-lora text-xl font-semibold text-roamly-g0">
          Per salvare un ricordo
        </h2>
        <p className="font-lora text-xl font-semibold text-roamly-g0">
          serve prima un viaggio.
        </p>
        <p className="font-dm-sans text-sm text-roamly-text/50 mt-2 leading-relaxed">
          Crea il tuo primo viaggio e poi inizia
          <br />a raccogliere i tuoi momenti.
        </p>
      </div>
      <Button onClick={onCrea} size="lg">
        Crea il tuo primo viaggio
      </Button>
    </div>
  )
}

// ------------------------------------------------------------
// ViaggioSelectorPage
// ------------------------------------------------------------

function ViaggioSelectorPage({
  viaggi,
  onSeleziona,
  onBack,
}: {
  viaggi: ViaggioConStato[]
  onSeleziona: (id: string) => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Nuovo ricordo"
        subtitle="A quale viaggio appartiene?"
        variant="withBack"
        onBack={onBack}
      />

      <div className="flex-1 px-5 pb-8 flex flex-col gap-2">
        {viaggi.map((v) => (
          <button
            key={v.id}
            onClick={() => onSeleziona(v.id)}
            className="
              flex items-center gap-4 p-4
              bg-white rounded-2xl shadow-roamly
              hover:shadow-roamly-lg
              active:scale-[0.98]
              transition-all duration-150
              text-left w-full
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            <div className="w-11 h-11 rounded-xl bg-roamly-g7
              flex items-center justify-center shrink-0 text-roamly-g2">
              <ViaggioCoverIcon value={v.cover_emoji} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-dm-sans font-semibold text-sm text-roamly-text truncate">
                {v.nome}
              </p>
              {v.destinazione && (
                <p className="font-dm-sans text-xs text-roamly-text/40 truncate mt-0.5">
                  {v.destinazione}
                </p>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-roamly-text/20 shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
