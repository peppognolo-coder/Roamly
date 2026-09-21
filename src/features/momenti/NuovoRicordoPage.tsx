import { useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, Plus, X } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { PageLayout }              from '@/components/layout/PageLayout'
import { PageHeader }              from '@/components/layout/PageHeader'
import { AnimatedPage }            from '@/components/layout/AnimatedPage'
import { Button }                  from '@/components/ui/Button'
import { RicordoForm }             from './RicordoForm'
import { useViaggi }               from '@/hooks/useViaggi'
import { useCreateRicordo }        from '@/hooks/useCrudRicordo'
import { useUploadFotoMultiplo }   from '@/hooks/useFoto'
import { calcolaDurataViaggio }    from '@/lib/viaggi-utils'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // "Si aggiunge al giorno N" — giorno del viaggio in cui cade oggi
  // (il form pre-compila la data a oggi; se l'utente la cambia a mano
  // il numero non si aggiorna, ma per il caso comune — nuovo ricordo
  // "adesso" — è corretto senza dover sollevare lo stato del form).
  const giornoOggi = (() => {
    if (!viaggioPreselezionato.data_inizio) return null
    const durata = calcolaDurataViaggio(viaggioPreselezionato.data_inizio, viaggioPreselezionato.data_fine)
    const [iy, im, id] = viaggioPreselezionato.data_inizio.split('-').map(Number)
    const inizio = new Date(iy, im - 1, id)
    const oggiDate = new Date()
    oggiDate.setHours(0, 0, 0, 0)
    const trascorsi = Math.floor((oggiDate.getTime() - inizio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (trascorsi < 1) return null
    return durata ? Math.min(trascorsi, durata) : trascorsi
  })()

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      setFilesDaAllegare(Array.from(files))
    }
    e.target.value = ''
  }

  const fotoGrid = (
    <div>
      <p className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70 mb-2">
        Foto
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {filesDaAllegare.map((f, i) => (
          <div key={i} className="relative aspect-square rounded-[14px] overflow-hidden bg-roamly-g6 border border-roamly-g5">
            <img
              src={URL.createObjectURL(f)}
              alt=""
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setFilesDaAllegare((prev) => prev.filter((_, j) => j !== i))}
              className="
                absolute top-1 right-1
                w-5 h-5 rounded-full bg-black/50
                flex items-center justify-center text-white
              "
              aria-label="Rimuovi foto"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
          className="
            aspect-square rounded-[14px]
            border border-dashed border-roamly-g5
            flex flex-col items-center justify-center gap-1.5
            text-roamly-g1
            hover:bg-roamly-g7 active:scale-[0.98]
            transition-all duration-150
            disabled:opacity-50
          "
        >
          <Plus size={18} />
          <span className="font-dm-sans text-[10px] font-medium">aggiungi</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {filesDaAllegare.length > 0 && (
        <p className="font-dm-sans text-[11px] text-roamly-text/40 mt-2">
          {filesDaAllegare.length === 1
            ? '1 foto selezionata — verrà caricata dopo il salvataggio'
            : `${filesDaAllegare.length} foto selezionate — verranno caricate dopo il salvataggio`
          }
        </p>
      )}
    </div>
  )

  return (
    <PageLayout withBottomNav={false}>
      <AnimatedPage className="flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <div className="flex-none px-5 pt-3 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Chiudi"
            className="
              shrink-0 w-[34px] h-[34px] rounded-full
              flex items-center justify-center
              bg-roamly-g7 text-roamly-g1
              hover:bg-roamly-g6 transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            <X size={15} />
          </button>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/nuovo-ricordo', { replace: true })}
              className="
                block font-dm-mono text-[9px] font-medium uppercase tracking-[0.16em]
                text-roamly-text/30 hover:text-roamly-text/50
                transition-colors duration-150 truncate text-left
              "
            >
              {viaggioPreselezionato.nome} · oggi
            </button>
            <h1 className="font-lora text-[20px] leading-tight font-semibold text-roamly-g0 mt-1">
              Com'è andata?
            </h1>
          </div>
        </div>

        {/* Form scrollabile */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <RicordoForm
            formId="ricordo-form"
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            error={error}
            beforeTitolo={fotoGrid}
            hideSubmitButton
          />
        </div>

        {/* Footer fisso — salva */}
        <div className="
          flex-none px-5 pt-3 pb-6
          border-t border-roamly-text/[0.06]
          bg-roamly-bg/95 backdrop-blur-sm
          flex items-center gap-3
        ">
          <p className="flex-1 font-dm-sans text-[11px] leading-snug text-roamly-text/40">
            {filesDaAllegare.length > 0 && (
              <>{filesDaAllegare.length} {filesDaAllegare.length === 1 ? 'foto' : 'foto'} · </>
            )}
            {giornoOggi
              ? `si aggiunge al giorno ${giornoOggi}`
              : `Il ricordo entra nel diario di ${viaggioPreselezionato.nome}.`
            }
          </p>
          <button
            type="submit"
            form="ricordo-form"
            disabled={isSubmitting}
            className="
              flex-none h-[50px] px-6
              flex items-center justify-center gap-2
              bg-roamly-coral rounded-full
              shadow-[0_8px_24px_-6px_rgba(229,86,58,0.5)]
              hover:bg-roamly-coral-dark active:scale-[0.98]
              transition-all duration-150
              disabled:opacity-60
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-coral-dark
            "
          >
            {isSubmitting && (
              <span className="w-4 h-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
            )}
            <span className="font-dm-sans text-[15px] font-semibold text-white">
              Salva ricordo
            </span>
          </button>
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
