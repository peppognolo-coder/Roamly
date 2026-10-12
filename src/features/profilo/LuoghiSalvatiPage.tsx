import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Sparkles, Plus } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useLuoghiSalvati } from '@/hooks/useLuoghiSalvati'
import { LuogoSearchInput } from '@/components/ui/LuogoSearchInput'
import { useToast } from '@/hooks/useToast'
import { trovaClusterVicini, descriviCluster, distanzaKm } from '@/lib/luoghi-clustering'
import type { RisultatoGeocoding } from '@/lib/geocoding'
import type { LuogoSalvato } from '@/types'

// ============================================================
// LuoghiSalvatiPage — /profilo/salvati  ("Voglio andarci")
// La wishlist personale: posti che vuoi visitare un giorno, anche
// senza un viaggio. Si aggiungono da qui con la ricerca, oppure
// dalla mappa di un viaggio. Quando 3+ posti non ancora assegnati
// sono vicini tra loro (distanza reale su lat/lng) l'app propone di
// organizzarci un viaggio: il form si apre già compilato e i posti
// vengono collegati al nuovo viaggio.
// ============================================================

export function LuoghiSalvatiPage() {
  const navigate = useNavigate()
  const { luoghi, isLoading, rimuoviLuogoSalvato, salvaLuogo, isSalvando } = useLuoghiSalvati()
  const { showSuccess, showError } = useToast()
  const [ricerca, setRicerca] = useState('')

  // Solo i posti non ancora assegnati a un viaggio alimentano il suggerimento
  const clusterPrincipale = useMemo(() => {
    const liberi = luoghi.filter((l) => !l.viaggio_id)
    const cluster = trovaClusterVicini(liberi)[0]
    return cluster ? { luoghi: cluster, info: descriviCluster(cluster) } : null
  }, [luoghi])

  function aggiungi(r: RisultatoGeocoding) {
    const doppio = luoghi.some((l) => distanzaKm(l, r) < 0.1)
    setRicerca('')
    if (doppio) {
      showSuccess('Questo posto è già tra i tuoi salvati')
      return
    }
    // Il messaggio di conferma compare solo se il salvataggio è davvero riuscito
    salvaLuogo(
      {
        nome: r.label.split(',')[0],
        lat: r.lat,
        lng: r.lng,
        indirizzo: r.label,
        viaggio_id: null,
      },
      {
        onSuccess: () => showSuccess('Aggiunto ai posti che vuoi visitare'),
        onError: (msg) => showError(`Non sono riuscito a salvare il posto (${msg})`, 8000),
      }
    )
  }

  function organizzaViaggio() {
    if (!clusterPrincipale) return
    navigate('/viaggi/nuovo', { state: { daLuoghi: clusterPrincipale.info } })
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title="Voglio andarci"
          subtitle={
            !isLoading
              ? `${luoghi.length} ${luoghi.length === 1 ? 'posto salvato' : 'posti salvati'}. Nessuna fretta — restano qui.`
              : undefined
          }
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">
          {/* Aggiungi un posto, senza bisogno di un viaggio */}
          <div className="flex flex-col gap-1.5">
            <LuogoSearchInput
              placeholder="Cerca un posto da aggiungere…"
              value={ricerca}
              onChangeValue={setRicerca}
              onSelectLuogo={aggiungi}
            />
            <p className="font-dm-sans text-[11px] text-roamly-text/40 flex items-center gap-1">
              <Plus size={11} /> {isSalvando ? 'Salvataggio…' : 'Una città, un monumento, un locale: tocca il risultato per salvarlo.'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[150px] bg-white rounded-[18px] shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : luoghi.length === 0 ? (
            <div className="
              flex flex-col items-center gap-3 py-12 px-8 text-center
              rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7
            ">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-roamly flex items-center justify-center">
                <Bookmark size={24} className="text-roamly-g3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-lora text-base font-semibold text-roamly-g0">
                  Ancora nessun luogo salvato
                </p>
                <p className="font-dm-sans text-sm text-roamly-text/50 leading-relaxed max-w-[240px]">
                  Cerca qui sopra un posto che sogni di visitare, oppure salvalo dalla mappa di un viaggio.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {clusterPrincipale && (
                <div className="p-4 rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-roamly-g3 shrink-0" />
                    <p className="font-lora text-sm font-semibold text-roamly-g0">
                      {clusterPrincipale.luoghi.length} posti salvati
                      {clusterPrincipale.info.nomeZona ? ` vicino a ${clusterPrincipale.info.nomeZona}` : ' nella stessa zona'}
                    </p>
                  </div>
                  <p className="font-dm-sans text-xs text-roamly-g2 leading-relaxed">
                    Ci faresti un bel viaggio. Lo organizziamo? Il form si apre già compilato e i posti restano collegati al viaggio.
                  </p>
                  <button
                    onClick={organizzaViaggio}
                    className="
                      self-start h-9 px-4 rounded-full
                      bg-roamly-g0 text-white
                      font-dm-sans text-xs font-medium
                      hover:bg-roamly-g1 active:scale-[0.98]
                      transition-all duration-150
                    "
                  >
                    Organizza un viaggio
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {luoghi.map((luogo) => (
                  <LuogoCard
                    key={luogo.id}
                    luogo={luogo}
                    onRimuovi={() => rimuoviLuogoSalvato(luogo.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// LuogoCard
// ------------------------------------------------------------

function LuogoCard({
  luogo,
  onRimuovi,
}: {
  luogo: LuogoSalvato
  onRimuovi: () => void
}) {
  return (
    <div className="rounded-[18px] overflow-hidden bg-white shadow-roamly">
      {/* Placeholder visivo — nessuna foto in questo dato, solo
          posizione e categoria libera inserita dall'utente */}
      <div
        className="relative h-[104px] flex items-center justify-center"
        style={{
          background: '#DFF3FA',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(11,111,153,.13) 0 3px, transparent 3px 9px)',
        }}
      >
        {!luogo.categoria && luogo.viaggio_id && (
          <span className="
            absolute left-[9px] top-[9px] px-2 py-1 rounded-full
            bg-white/85 font-dm-mono text-[8.5px] font-medium
            uppercase tracking-wider text-roamly-g2
          ">
            In un viaggio
          </span>
        )}
        {luogo.categoria && (
          <span className="
            absolute left-[9px] top-[9px] px-2 py-1 rounded-full
            bg-white/85 font-dm-mono text-[8.5px] font-medium
            uppercase tracking-wider text-roamly-g2 truncate max-w-[80%]
          ">
            {luogo.categoria}
          </span>
        )}

        <MapPin size={20} className="text-roamly-g3/50" />

        <button
          onClick={onRimuovi}
          aria-label="Rimuovi dai salvati"
          className="
            absolute right-[9px] top-[9px] w-7 h-7 rounded-full
            bg-roamly-coral/90 backdrop-blur-sm
            flex items-center justify-center text-white
            hover:bg-roamly-coral-dark active:scale-95
            transition-all duration-150
          "
        >
          <Bookmark size={12} fill="currentColor" />
        </button>
      </div>

      <div className="px-3 pt-2.5 pb-3.5">
        <p className="font-dm-sans text-[13px] font-medium text-roamly-g0 truncate">
          {luogo.nome}
        </p>
        {luogo.indirizzo && (
          <p className="font-dm-sans text-[11px] text-roamly-g2 truncate mt-1">
            {luogo.indirizzo}
          </p>
        )}
      </div>
    </div>
  )
}
