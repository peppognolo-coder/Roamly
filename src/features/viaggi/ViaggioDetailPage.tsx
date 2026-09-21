import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Check, NotebookPen, Heart, Star, UserPlus, Users, Sparkles, ChevronRight, Crown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { PageLayout }       from '@/components/layout/PageLayout'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }        from '@/components/layout/BottomNav'
import { Button }           from '@/components/ui/Button'
import { StatoBadge }       from './StatoBadge'
import { ViaggioForm }      from './ViaggioForm'
import { formatDataViaggio, calcolaPercentualeTrascorsa } from '@/lib/viaggi-utils'
import { useViaggio, useStatisticheViaggio } from '@/hooks/useViaggi'
import { useUpdateViaggio, useDeleteViaggio } from '@/hooks/useCrudViaggio'
import { useMioRuolo, useMembriViaggio } from '@/hooks/useMembri'
import { useInvitoLink }    from '@/hooks/useInviti'
import { useRealtimeSync }  from '@/hooks/useRealtimeSync'
import { useBudgetVoci }    from '@/hooks/useBudget'
import { queryKeys }        from '@/lib/queryKeys'
import { coloreIniziale }   from '@/lib/avatar-utils'
import { RicordoCard }           from '@/features/momenti/RicordoCard'
import { PianificaHub }          from '@/features/pianifica/PianificaHub'
import { SettleUpCard }          from '@/features/pianifica/SettleUpCard'
import { ShareCardViaggio }      from './ShareCardViaggio'
import { useRicordi }       from '@/hooks/useRicordi'
import { useCoversByViaggio, useCoverViaggio, useFotoCountByViaggio } from '@/hooks/useFoto'
import type { ViaggioFormData } from './ViaggioForm'

// ============================================================
// ViaggioDetailPage — /viaggi/:id
// Header viaggio · Statistiche inline nell'hero (% giorni trascorsi,
// spesi, ricordi) · 3 tab: Pianifica / Ricordi / Persone (il Racconto
// immersivo non è più un tab — si raggiunge dalla card di recap a
// fine viaggio, vedi RecapViaggioPage → RaccontoPage).
// Modifica inline · Eliminazione con conferma.
// ============================================================

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

function iniziali(nome: string | null): string {
  if (!nome) return '?'
  return nome.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function ViaggioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { data: viaggio, isLoading } = useViaggio(id)
  const { data: stats } = useStatisticheViaggio(id)
  const { data: ricordi = [], isLoading: isLoadingRicordi } = useRicordi(id)
  // Covers caricate in parallelo con i ricordi — anti N+1 su RicordoCard
  const { data: coversMap }    = useCoversByViaggio(id)
  // Cover visuale del viaggio — foto più recente is_cover=true tra i ricordi
  const { data: coverViaggio }  = useCoverViaggio(id)
  // Conteggio foto per ricordo — per statistiche giorno nel Diario
  const { data: fotoCount }     = useFotoCountByViaggio(id)
  // Spesi totale — per lo stat inline nell'hero
  const { data: voci = [] }     = useBudgetVoci(id)

  const { updateViaggio, isLoading: isUpdating, isSuccess: updateSuccess, error: updateError } =
    useUpdateViaggio(id ?? '')
  const { deleteViaggio, isLoading: isDeleting, error: deleteError } = useDeleteViaggio()
  const { data: mioRuolo } = useMioRuolo(id)
  const { data: membri = [] } = useMembriViaggio(id)
  const { condividi: condividiInvito, isLoading: isInvitando } = useInvitoLink(id ?? '', viaggio?.nome ?? '')

  useRealtimeSync('viaggi', 'id', id, [queryKeys.viaggi.detail(id ?? '')])
  useRealtimeSync('ricordi', 'viaggio_id', id, [queryKeys.ricordi.byViaggio(id ?? '')])

  const [isEditing, setIsEditing]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  // Tab iniziale: legge ?tab= dall'URL (es. link dal prompt viaggio imminente
  // in Home) per aprire direttamente su Pianifica; altrimenti default Ricordi
  // — il Racconto non è più un tab (vedi RecapViaggioPage → RaccontoPage).
  const tabIniziale = searchParams.get('tab')
  const [tab, setTab] = useState<'ricordi' | 'pianifica' | 'persone'>(
    tabIniziale === 'pianifica' || tabIniziale === 'persone' ? tabIniziale : 'ricordi'
  )
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
      paese_codice: data.paese_codice || null,
      destinazione_lat: data.destinazione_lat ?? null,
      destinazione_lng: data.destinazione_lng ?? null,
      data_inizio:  data.data_inizio  || null,
      data_fine:    data.data_fine    || null,
      cover_emoji:  data.cover_emoji  ?? viaggio!.cover_emoji,
    })
  }

  function handleDelete() {
    if (id) deleteViaggio(id)
  }

  const coverValue      = viaggio.cover_emoji
  const dataFormattata = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const totFoto        = fotoCount ? Array.from(fotoCount.values()).reduce((a, b) => a + b, 0) : 0
  const totaleSpese    = voci.reduce((sum, v) => sum + v.importo, 0)
  const percentualeTrascorsa = calcolaPercentualeTrascorsa(viaggio.data_inizio, viaggio.data_fine)

  // Stat inline nell'hero — % giorni trascorsi (solo se il viaggio ha
  // entrambe le date), spesi totale, numero ricordi.
  const heroStats: { valore: string; etichetta: string }[] = [
    ...(percentualeTrascorsa !== null
      ? [{ valore: `${percentualeTrascorsa}%`, etichetta: 'del viaggio' }]
      : []),
    { valore: formatEuro(totaleSpese), etichetta: 'spesi' },
    { valore: String(stats?.ricordi ?? 0), etichetta: (stats?.ricordi ?? 0) === 1 ? 'ricordo' : 'ricordi' },
  ]

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col">

        {/* Header */}
        <header className="px-5 pt-14 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
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
            {mioRuolo === 'proprietario' && (
              <button
                onClick={condividiInvito}
                disabled={isInvitando}
                className="
                  w-9 h-9 rounded-xl flex items-center justify-center
                  bg-roamly-g6
                  hover:bg-roamly-g5 active:scale-[0.98]
                  transition-all duration-150
                  disabled:opacity-50
                "
                aria-label="Invita al viaggio"
                title="Invita"
              >
                {isInvitando ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-roamly-g1 border-t-transparent animate-spin" />
                ) : (
                  <UserPlus size={16} className="text-roamly-g1" />
                )}
              </button>
            )}
            {mioRuolo && (
              (membri?.length ?? 0) > 1 ? (
                <button
                  onClick={() => setTab('persone')}
                  className="
                    rounded-xl p-0.5
                    hover:bg-roamly-g6 active:scale-[0.98]
                    transition-all duration-150
                  "
                  aria-label="Persone del viaggio"
                  title="Persone"
                >
                  <AvatarStack viaggioId={id ?? ''} size="md" maxVisible={3} />
                </button>
              ) : (
                <button
                  onClick={() => setTab('persone')}
                  className="
                    w-9 h-9 rounded-xl flex items-center justify-center
                    bg-roamly-g6
                    hover:bg-roamly-g5 active:scale-[0.98]
                    transition-all duration-150
                  "
                  aria-label="Persone del viaggio"
                  title="Persone"
                >
                  <Users size={16} className="text-roamly-g1" />
                </button>
              )
            )}
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
                  {/* Icona copertina sovrapposta in basso a sinistra */}
                  <div className="
                    absolute bottom-0.5 right-0.5
                    w-6 h-6 rounded-full
                    bg-black/40 backdrop-blur-sm
                    flex items-center justify-center
                    text-white
                  ">
                    <ViaggioCoverIcon value={coverValue} size={13} />
                  </div>
                </>
              ) : (
                <span className="text-roamly-g3">
                  <ViaggioCoverIcon value={coverValue} size={28} />
                </span>
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

          {/* Stat inline — % giorni trascorsi · spesi · ricordi */}
          <div className="flex items-center mt-4 pt-3.5 border-t border-roamly-g6">
            {heroStats.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                {i > 0 && <div className="w-px h-8 bg-roamly-g6 mr-4" />}
                <div>
                  <p className="font-dm-mono text-sm font-semibold text-roamly-g0">
                    {s.valore}
                  </p>
                  <p className="font-dm-sans text-[11px] text-roamly-text/40">
                    {s.etichetta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

          {/* Recap di fine viaggio — solo per viaggi conclusi. Unico
              punto d'accesso al Racconto immersivo (RaccontoPage), che
              non è più un tab qui sotto. */}
          {viaggio.stato_effettivo === 'concluso' && (
            <button
              onClick={() => navigate(`/viaggi/${id}/recap`)}
              className="
                flex items-center gap-3 p-4
                bg-gradient-to-r from-roamly-g0 to-roamly-g1
                rounded-2xl text-left
                active:scale-[0.98] transition-all duration-150
              "
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans text-sm font-semibold text-white">
                  Il tuo recap è pronto
                </p>
                <p className="font-dm-sans text-xs text-white/60">
                  Scopri il tuo viaggio in numeri, e rileggi il racconto
                </p>
              </div>
              <ChevronRight size={18} className="text-white/60 shrink-0" />
            </button>
          )}

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

          {/* Statistiche */}
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

          {/* Tab Pianifica / Ricordi / Persone */}
          <div className="flex flex-col gap-4">

            {/* Tab bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-roamly-g7 rounded-xl p-1">
                {(['pianifica', 'ricordi', 'persone'] as const).map((t) => (
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
                    {t === 'pianifica' ? 'Pianifica' : t === 'ricordi' ? 'Ricordi' : 'Persone'}
                  </button>
                ))}
              </div>
              {tab === 'ricordi' && (
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

            {/* Tab Persone */}
            {tab === 'persone' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {membri.map((m) => {
                    const nome = m.display_name ?? 'Utente Roamly'
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-roamly"
                      >
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <span
                            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-dm-sans font-semibold text-white text-sm"
                            style={{ background: coloreIniziale(nome) }}
                          >
                            {iniziali(m.display_name)}
                          </span>
                        )}
                        <p className="flex-1 min-w-0 font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                          {nome}
                        </p>
                        {m.ruolo === 'proprietario' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-roamly-g6 shrink-0">
                            <Crown size={11} className="text-roamly-g2" />
                            <span className="font-dm-sans text-[10px] font-medium text-roamly-g2">
                              Proprietario
                            </span>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => navigate(`/viaggi/${id}/membri`)}
                  className="
                    flex items-center justify-center gap-1.5 py-3
                    border border-dashed border-roamly-g5 rounded-2xl
                    font-dm-sans text-sm font-medium text-roamly-g2
                    hover:bg-roamly-g7 active:scale-[0.98]
                    transition-all duration-150
                  "
                >
                  <UserPlus size={15} />
                  Gestisci membri e inviti
                </button>

                <SettleUpCard viaggioId={id ?? ''} />
              </div>
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
