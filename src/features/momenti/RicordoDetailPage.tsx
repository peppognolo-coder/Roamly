import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { PageLayout }     from '@/components/layout/PageLayout'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }      from '@/components/layout/BottomNav'
import { Button }         from '@/components/ui/Button'
import { RicordoForm }    from './RicordoForm'
import { useRicordo }     from '@/hooks/useRicordi'
import { useViaggi }      from '@/hooks/useViaggi'
import { useUpdateRicordo, useDeleteRicordo, useTogglePreferito } from '@/hooks/useCrudRicordo'
import { useAutoreRicordo } from '@/hooks/useAutoreRicordo'
import { useFotoRicordo } from '@/hooks/useFoto'
import { AutoreBadge }    from '@/components/ricordi/AutoreBadge'
import { ShareCardRicordo } from './ShareCardRicordo'
import { ReazioniRicordo } from '@/components/ricordi/ReazioniRicordo'
import { MOOD_OPTIONS }   from '@/types'
import type { RicordoFormData } from './RicordoForm'
import { FotoGalleria }    from './FotoGalleria'

// ============================================================
// RicordoDetailPage — /ricordi/:id
// Il viaggio di appartenenza è mostrato in modo prominente
// e cliccabile — non come link secondario.
// ============================================================

export function RicordoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: ricordo, isLoading: isLoadingRicordo } = useRicordo(id)

  // viaggioId è undefined finché ricordo non è caricato.
  // I hook tollerano undefined e applicano le guardie internamente —
  // nessuna queryKey orfana viene costruita con stringa vuota.
  const viaggioId = ricordo?.viaggio_id

  // Il viaggio viene derivato dalla cache di useViaggi() già in memoria
  // (stessa queryKey di tutti i consumer) invece di chiamare useViaggio(id)
  // separatamente. Elimina il waterfall: useViaggio era enabled solo dopo
  // che useRicordo completava, producendo due fetch sequenziali.
  // Se la lista non è in cache, useViaggi parte in parallelo con useRicordo.
  const { data: viaggi } = useViaggi()
  const viaggio = viaggi?.find((v) => v.id === viaggioId) ?? null

  const { updateRicordo, isLoading: isUpdating, isSuccess: updateSuccess, error: updateError } =
    useUpdateRicordo(id ?? '', viaggioId)
  const { deleteRicordo, isLoading: isDeleting, error: deleteError } =
    useDeleteRicordo(viaggioId)
  const { toggle: togglePreferito } = useTogglePreferito(viaggioId)
  const { autore } = useAutoreRicordo(ricordo)
  const { data: foto } = useFotoRicordo(ricordo?.id)

  const [isEditing, setIsEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // Chiude il form solo dopo mutation completata con successo
  useEffect(() => {
    if (updateSuccess) setIsEditing(false)
  }, [updateSuccess])

  // ---- Loading ----
  if (isLoadingRicordo) {
    return (
      <PageLayout>
        <SkeletonDetail />
        <BottomNav />
      </PageLayout>
    )
  }

  // ---- Not found ----
  if (!ricordo) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-5 text-center">
          <p className="font-lora text-xl text-roamly-g0">Ricordo non trovato</p>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Torna indietro
          </Button>
        </div>
        <BottomNav />
      </PageLayout>
    )
  }

  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  // Parsing locale: evita lo shift UTC su stringhe 'YYYY-MM-DD'
  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  function handleUpdate(data: RicordoFormData) {
    updateRicordo({
      titolo:    data.titolo,
      testo:     data.testo     || null,
      luogo:     data.luogo     || null,
      mood:      data.mood,
      data:      data.data,
      preferito: data.preferito,
    })
  }

  function handleDelete() {
    if (id) deleteRicordo(id)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col">

        {/* Header nav */}
        <header className="flex items-center gap-3 px-5 pt-14 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
              bg-roamly-g7 shadow-roamly
              hover:bg-roamly-g6 active:scale-[0.98]
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
          <div className="flex-1" />
          <button
            onClick={() => setShowShare(true)}
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
              bg-roamly-g7 shadow-roamly
              hover:bg-roamly-g6 active:scale-[0.98]
              transition-all duration-150
            "
            aria-label="Condividi ricordo"
          >
            <Share2 size={16} className="text-roamly-text/60" />
          </button>
          <button
            onClick={() => togglePreferito(ricordo.id, ricordo.preferito)}
            className="
              w-9 h-9 rounded-xl flex items-center justify-center
              bg-roamly-g7 shadow-roamly
              hover:bg-roamly-g6 active:scale-[0.98]
              transition-all duration-150
            "
            aria-label={ricordo.preferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          >
            <Heart
              size={17}
              className={ricordo.preferito ? 'fill-red-400 text-red-400' : 'text-roamly-text/40'}
            />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="
              px-3 py-1.5 rounded-xl
              font-dm-sans text-sm font-medium
              text-roamly-g1 bg-roamly-g6
              hover:bg-roamly-g5 active:scale-[0.98]
              transition-all duration-150
            "
          >
            {isEditing ? 'Annulla' : 'Modifica'}
          </button>
        </header>

        <div className="px-5 flex flex-col gap-5 pb-8">

          {/* ── Viaggio di appartenenza — prominente e cliccabile ── */}
          {viaggio && (
            <button
              onClick={() => navigate(`/viaggi/${viaggio.id}`)}
              className="
                flex items-center gap-3 p-4
                bg-roamly-g0 rounded-2xl
                text-left w-full
                hover:bg-roamly-g1 active:scale-[0.98]
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
              "
            >
              <div className="
                w-10 h-10 rounded-xl bg-white/15
                flex items-center justify-center
                shrink-0 text-white
              ">
                <ViaggioCoverIcon value={viaggio.cover_emoji} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans text-xs text-white/60 uppercase tracking-wider mb-0.5">
                  Parte del viaggio
                </p>
                <p className="font-lora text-base font-semibold text-white truncate">
                  {viaggio.nome}
                </p>
                {viaggio.destinazione && (
                  <p className="font-dm-sans text-xs text-white/50 truncate mt-0.5">
                    {viaggio.destinazione}
                  </p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="opacity-50 shrink-0">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {/* ── Hero ricordo ── */}
          {!isEditing && (
            <div className="flex flex-col gap-4">
              {/* Mood + data */}
              <div className="flex items-center gap-3">
                <div className="
                  w-12 h-12 rounded-2xl bg-roamly-g7 shadow-roamly
                  flex items-center justify-center text-2xl shrink-0
                ">
                  {moodOption?.emoji}
                </div>
                <div>
                  <p className="font-dm-sans text-xs text-roamly-text/40 uppercase tracking-wider">
                    {moodOption?.label}
                  </p>
                  <p className="font-dm-mono text-xs text-roamly-text/35 mt-0.5 capitalize">
                    {dataFormattata}
                  </p>
                </div>
                {ricordo.highlight && (
                  <span className="ml-auto text-lg">⭐</span>
                )}
              </div>

              {/* Autore — solo su viaggi con più collaboratori */}
              {autore && (
                <AutoreBadge
                  nome={autore.nome}
                  testoOverride={autore.seiTu ? 'Aggiunto da te' : `Aggiunto da ${autore.nome}`}
                  avatarUrl={autore.avatarUrl}
                  size="sm"
                />
              )}

              {/* Titolo */}
              <h1 className="font-lora text-h1 text-roamly-g0 leading-snug">
                {ricordo.titolo}
              </h1>

              {/* Luogo */}
              {ricordo.luogo && (
                <div className="flex items-center gap-1.5 text-roamly-text/40">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="font-dm-sans text-sm">{ricordo.luogo}</span>
                </div>
              )}

              {/* Testo */}
              {ricordo.testo && (
                <div className="bg-white rounded-2xl shadow-roamly p-4">
                  <p className="font-dm-sans text-base text-roamly-text leading-relaxed whitespace-pre-wrap">
                    {ricordo.testo}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Galleria foto ── */}
          {!isEditing && (
            <FotoGalleria
              ricordoId={ricordo.id}
              viaggioId={viaggioId}
            />
          )}

          {/* ── Reazioni — solo su viaggi collaborativi ── */}
          {!isEditing && (
            <ReazioniRicordo ricordoId={ricordo.id} viaggioId={viaggioId} />
          )}

          {/* ── Form modifica ── */}
          {isEditing && (
            <div className="bg-white rounded-2xl border border-roamly-g5 p-5">
              <h2 className="font-dm-sans font-semibold text-sm text-roamly-text/60
                uppercase tracking-wider mb-4">
                Modifica ricordo
              </h2>
              {updateError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-dm-sans text-sm text-red-600">{updateError}</p>
                </div>
              )}
              <RicordoForm
                ricordo={ricordo}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
                submitLabel="Salva modifiche"
              />
            </div>
          )}

          {/* ── Eliminazione ── */}
          {!isEditing && (
            <div className="border border-red-100 rounded-2xl p-5">
              <h2 className="font-dm-sans font-semibold text-sm text-red-400
                uppercase tracking-wider mb-2">
                Zona pericolosa
              </h2>
              <p className="font-dm-sans text-sm text-roamly-text/50 mb-4">
                Questo ricordo verrà eliminato definitivamente.
              </p>
              {deleteError && (
                <p className="font-dm-sans text-sm text-red-500 mb-3">{deleteError}</p>
              )}
              {!showConfirm ? (
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirm(true)}
                  className="text-red-500 hover:bg-red-50"
                >
                  Elimina ricordo
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="font-dm-sans text-sm font-medium text-red-600">
                    Sei sicuro? Questa azione non può essere annullata.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1">
                      Annulla
                    </Button>
                    <Button
                      onClick={handleDelete}
                      isLoading={isDeleting}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
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
      <BottomNav />
      {/* Share Card modal */}
      {showShare && (
        <ShareCardRicordo
          ricordo={ricordo}
          viaggio={viaggio}
          coverUrl={foto?.find((f) => f.is_cover)?.signedUrl ?? foto?.[0]?.signedUrl ?? null}
          onClose={() => setShowShare(false)}
        />
      )}
    </PageLayout>
  )
}

// ------------------------------------------------------------
// SkeletonDetail
// ------------------------------------------------------------

function SkeletonDetail() {
  return (
    <div className="px-5 pt-14 pb-6 flex flex-col gap-5">
      <div className="h-20 bg-roamly-g6 rounded-2xl animate-pulse" />
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-roamly-g6 animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="h-8 bg-roamly-g6 rounded animate-pulse w-4/5" />
      <div className="h-32 bg-roamly-g6 rounded-2xl animate-pulse" />
    </div>
  )
}
