import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Check, NotebookPen, Heart, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }       from '@/components/layout/PageLayout'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }        from '@/components/layout/BottomNav'
import { Button }           from '@/components/ui/Button'
import { StatoBadge }       from './StatoBadge'
import { ViaggioForm }      from './ViaggioForm'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import { useViaggio, useStatisticheViaggio } from '@/hooks/useViaggi'
import { useUpdateViaggio, useDeleteViaggio } from '@/hooks/useCrudViaggio'
import { RicordoCard }           from '@/features/momenti/RicordoCard'
import { RaccontoViaggio }       from './RaccontoViaggio'
import { PianificaHub }          from '@/features/pianifica/PianificaHub'
import { ShareCardViaggio }      from './ShareCardViaggio'
import { useRicordi }       from '@/hooks/useRicordi'
import { useCoversByViaggio, useCoverViaggio, useFotoCountByViaggio } from '@/hooks/useFoto'
import type { ViaggioFormData } from './ViaggioForm'

// ============================================================
// ViaggioDetailPage — /viaggi/:id
// Header viaggio · Statistiche base · Sezione ricordi (placeholder S3)
// Modifica inline · Eliminazione con conferma
// ============================================================

export function ViaggioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: viaggio, isLoading } = useViaggio(id)
  const { data: stats } = useStatisticheViaggio(id)
  const { data: ricordi = [], isLoading: isLoadingRicordi } = useRicordi(id)
  // Covers caricate in parallelo con i ricordi — anti N+1 su RicordoCard
  const { data: coversMap }    = useCoversByViaggio(id)
  // Cover visuale del viaggio — foto più recente is_cover=true tra i ricordi
  const { data: coverViaggio }  = useCoverViaggio(id)
  // Conteggio foto per ricordo — per statistiche giorno nel Diario
  const { data: fotoCount }     = useFotoCountByViaggio(id)

  const { updateViaggio, isLoading: isUpdating, isSuccess: updateSuccess, error: updateError } =
    useUpdateViaggio(id ?? '')
  const { deleteViaggio, isLoading: isDeleting, error: deleteError } = useDeleteViaggio()

  const [isEditing, setIsEditing]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [tab, setTab]                 = useState<'ricordi' | 'racconto' | 'pianifica'>('racconto')
  const [showShare, setShowShare]     = useState(false)

  // Chiude il form solo dopo che la mutation è completata con successo.
  // useEffect reagisce al cambio di updateSuccess senza timer o setState
  // dentro callback asincroni — nessun aggiornamento su componente smontato.
  useEffect(() => {
    if (updateSuccess) {
      setIsEditing(false)
    }
  }, [updateSuccess])

  // ---- Loading ----
  if (isLoading) {
    return (
      <PageLayout>
        <SkeletonDetail />
        <BottomNav />
      </PageLayout>
    )
  }

  // ---- Not found ----
  if (!viaggio) {
    return (
      <PageLayout>
        
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-5 text-center">
          <p className="font-lora text-xl text-roamly-g0">Viaggio non trovato</p>
          <Button variant="secondary" onClick={() => navigate('/viaggi')}>
            Torna ai viaggi
          </Button>
        </div>
        <BottomNav />
      </PageLayout>
    )
  }

  // ---- Handlers ----
  function handleUpdate(data: ViaggioFormData) {
    // setIsEditing(false) NON va qui — il form si chiude solo dopo
    // che la mutation ha avuto successo (gestito dall'useEffect sopra).
    updateViaggio({
      nome:         data.nome,
      destinazione: data.destinazione || null,
      paese:        data.paese        || null,
      data_inizio:  data.data_inizio  || null,
      data_fine:    data.data_fine    || null,
      cover_emoji:  data.cover_emoji  ?? viaggio!.cover_emoji,
    })
  }

  function handleDelete() {
    if (id) deleteViaggio(id)
  }

  const emoji         = viaggio.cover_emoji ?? '✈️'
  const dataFormattata = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const totFoto        = fotoCount ? Array.from(fotoCount.values()).reduce((a, b) => a + b, 0) : 0

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col">

        {/* Header */}
        <header className="px-5 pt-14 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/viaggi')}
              className="
                w-9 h-9 rounded-xl
                flex items-center justify-center
                bg-roamly-g7 shadow-roamly
                hover:bg-roamly-g6 active:scale-[0.98]
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
              "
              aria-label="Torna ai viaggi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1" />
            {/* Azioni */}
            <button
              onClick={() => setShowShare(true)}
              className="
                w-9 h-9 rounded-xl flex items-center justify-center
                bg-roamly-g6
                hover:bg-roamly-g5 active:scale-[0.98]
                transition-all duration-150
              "
              aria-label="Condividi viaggio"
              title="Condividi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-roamly-g1">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
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
          </div>

          {/* Hero viaggio */}
          <div className="flex items-start gap-4">
            {/* Hero icon: foto cover del viaggio se disponibile, altrimenti emoji */}
            <div className="
              w-16 h-16 rounded-2xl bg-roamly-g7
              shadow-roamly
              flex items-center justify-center
              text-3xl shrink-0 overflow-hidden relative
            ">
              {coverViaggio ? (
                <>
                  <img
                    src={coverViaggio}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {/* Emoji badge sovrapposta in basso a sinistra */}
                  <div className="
                    absolute bottom-0.5 right-0.5
                    w-6 h-6 rounded-full
                    bg-black/40 backdrop-blur-sm
                    flex items-center justify-center
                    text-sm leading-none
                  ">
                    {emoji}
                  </div>
                </>
              ) : (
                emoji
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-lora text-h1 text-roamly-g0 leading-tight">
                {viaggio.nome}
              </h1>
              {(viaggio.destinazione || viaggio.paese) && (
                <p className="font-dm-sans text-sm text-roamly-text/50 mt-0.5">
                  {[viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StatoBadge stato={viaggio.stato_effettivo} size="md" />
                <span className="font-dm-mono text-xs text-roamly-text/35">
                  {dataFormattata}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

          {/* Form modifica */}
          {isEditing && (
            <div className="bg-white rounded-2xl shadow-roamly p-5">
              <h2 className="font-dm-sans font-semibold text-sm text-roamly-text/60
                uppercase tracking-wider mb-4">
                Modifica viaggio
              </h2>
              {updateError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-dm-sans text-sm text-red-600">{updateError}</p>
                </div>
              )}
              {updateSuccess && (
                <div className="mb-4 px-4 py-3 bg-roamly-g6 border border-roamly-g5 rounded-xl flex items-center gap-2">
                  <Check size={15} className="text-roamly-g1 shrink-0" />
                  <p className="font-dm-sans text-sm text-roamly-g1">Modifiche salvate</p>
                </div>
              )}
              <ViaggioForm
                viaggio={viaggio}
                onSubmit={handleUpdate}
                isLoading={isUpdating}
                submitLabel="Salva modifiche"
              />
            </div>
          )}

          {/* Statistiche base */}
          <div className="bg-white rounded-2xl shadow-roamly p-5">
            <h2 className="font-dm-sans font-semibold text-sm text-roamly-text/60
              uppercase tracking-wider mb-4">
              Statistiche
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Ricordi"
                value={stats?.ricordi ?? 0}
                icon={NotebookPen}
              />
              <StatCard
                label="Preferiti"
                value={stats?.preferiti ?? 0}
                icon={Heart}
              />
              <StatCard
                label="Highlight"
                value={stats?.highlight ?? 0}
                icon={Star}
              />
            </div>
          </div>

          {/* Tab Racconto / Ricordi */}
          <div className="flex flex-col gap-4">

            {/* Tab bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-roamly-g7 rounded-xl p-1">
                {(['racconto', 'ricordi', 'pianifica'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`
                      px-4 py-1.5 rounded-lg
                      font-dm-sans text-sm font-medium
                      transition-all duration-150
                      ${tab === t
                        ? 'bg-white text-roamly-g0 shadow-sm'
                        : 'text-roamly-text/50 hover:text-roamly-text/70'
                      }
                    `}
                  >
                    {t === 'racconto' ? 'Racconto' : t === 'ricordi' ? 'Ricordi' : 'Pianifica'}
                  </button>
                ))}
              </div>
              {tab !== 'pianifica' && (
              <button
                onClick={() => navigate(`/nuovo-ricordo?viaggioId=${id}`)}
                className="
                  flex items-center gap-1 px-3 py-1.5
                  bg-roamly-g0 rounded-xl
                  font-dm-sans text-xs font-medium text-white
                  hover:bg-roamly-g1 active:scale-[0.98]
                  transition-all duration-150
                "
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Aggiungi
              </button>
              )}
            </div>

            {/* Tab Racconto */}
            {tab === 'racconto' && (
              <RaccontoViaggio
                viaggioId={id ?? ''}
                viaggio={viaggio}
                ricordi={ricordi}
                coversMap={coversMap}
                fotoCount={fotoCount}
                coverViaggio={coverViaggio}
                numRicordi={stats?.ricordi ?? 0}
                isLoading={isLoadingRicordi}
              />
            )}

            {/* Tab Pianifica */}
            {tab === 'pianifica' && (
              <PianificaHub viaggioId={id ?? ''} />
            )}

            {/* Tab Ricordi */}
            {tab === 'ricordi' && (
              isLoadingRicordi ? (
                <div className="flex flex-col gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-0 h-24 bg-white rounded-2xl shadow-roamly overflow-hidden">
                      <div className="w-20 bg-roamly-g6 animate-pulse shrink-0" />
                      <div className="flex-1 p-3.5 flex flex-col gap-2">
                        <div className="h-4 bg-roamly-g6 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ricordi.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center
                  bg-white rounded-2xl shadow-roamly">
                  <span className="text-3xl">📖</span>
                  <div className="flex flex-col gap-1">
                    <p className="font-lora text-base font-semibold text-roamly-g0">
                      Questo viaggio aspetta ancora la sua storia.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/nuovo-ricordo?viaggioId=${id}`)}
                    className="
                      px-4 py-2 bg-roamly-g0 rounded-xl
                      font-dm-sans text-sm font-medium text-white
                      hover:bg-roamly-g1 active:scale-[0.98]
                      transition-all duration-150
                    "
                  >
                    Aggiungi il primo ricordo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {ricordi.map((r) => (
                    <RicordoCard
                      key={r.id}
                      ricordo={r}
                      coverUrl={coversMap?.get(r.id)}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Zona pericolosa — Elimina */}
          {!isEditing && (
            <div className="border border-red-100 rounded-2xl p-5">
              <h2 className="font-dm-sans font-semibold text-sm text-red-400
                uppercase tracking-wider mb-2">
                Zona pericolosa
              </h2>
              <p className="font-dm-sans text-sm text-roamly-text/50 mb-4">
                Elimina il viaggio e tutti i ricordi associati.
                Questa azione è irreversibile.
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
                  Elimina viaggio
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="font-dm-sans text-sm font-medium text-red-600">
                    Sei sicuro? Questa azione non può essere annullata.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirm(false)}
                      className="flex-1"
                    >
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
        <ShareCardViaggio
          viaggio={viaggio}
          coverUrl={coverViaggio}
          numRicordi={stats?.ricordi ?? 0}
          numFoto={totFoto}
          onClose={() => setShowShare(false)}
        />
      )}
    </PageLayout>
  )
}

// ------------------------------------------------------------
// StatCard — singola statistica
// ------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: LucideIcon
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 px-2
      bg-roamly-g7 rounded-xl">
      <Icon size={18} className="text-roamly-g3" />
      <span className="font-dm-mono text-xl font-medium text-roamly-g0">
        {value}
      </span>
      <span className="font-dm-sans text-xs text-roamly-text/50">
        {label}
      </span>
    </div>
  )
}

// ------------------------------------------------------------
// SkeletonDetail — loading state
// ------------------------------------------------------------

function SkeletonDetail() {
  return (
    <div className="px-5 pt-14 pb-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-roamly-g6 animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div className="h-6 bg-roamly-g6 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-roamly-g6 rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="h-32 bg-roamly-g6 rounded-2xl animate-pulse" />
    </div>
  )
}
