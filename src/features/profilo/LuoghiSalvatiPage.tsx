import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useLuoghiSalvati, useArricchisciLuogo } from '@/hooks/useLuoghiSalvati'
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
  const arricchisci = useArricchisciLuogo()
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
        onSuccess: (luogo) => {
          showSuccess('Aggiunto ai posti che vuoi visitare')
          // Foto e descrizione arrivano in un secondo momento, senza far attendere
          if (luogo) void arricchisci(luogo, r)
        },
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
                    onApri={() => navigate(`/profilo/salvati/${luogo.id}`)}
                    onRimuovi={(fallito) =>
                      rimuoviLuogoSalvato(luogo.id, {
                        onSuccess: () => showSuccess('Rimosso dai tuoi posti'),
                        onError: (msg) => {
                          fallito()
                          showError(`Non sono riuscito a rimuoverlo (${msg})`, 8000)
                        },
                      })
                    }
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
  onApri,
  onRimuovi,
}: {
  luogo: LuogoSalvato
  onApri: () => void
  onRimuovi: (fallito: () => void) => void
}) {
  const [conferma, setConferma] = useState(false)
  const [rimuovendo, setRimuovendo] = useState(false)
  const [fotoRotta, setFotoRotta] = useState(false)
  const haFoto = !!luogo.foto_url && !fotoRotta
  const etichetta = luogo.categoria ?? (luogo.viaggio_id ? 'In un viaggio' : null)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onApri}
      onKeyDown={(e) => e.key === 'Enter' && onApri()}
      className="relative rounded-[18px] overflow-hidden bg-white shadow-roamly cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div
        className="relative h-[104px] flex items-center justify-center overflow-hidden"
        style={haFoto ? undefined : {
          background: '#DFF3FA',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(11,111,153,.13) 0 3px, transparent 3px 9px)',
        }}
      >
        {haFoto ? (
          <img
            src={luogo.foto_url ?? ''}
            alt=""
            loading="lazy"
            onError={() => setFotoRotta(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <MapPin size={20} className="text-roamly-g3/50" />
        )}

        {etichetta && (
          <span className="
            absolute left-[9px] top-[9px] px-2 py-1 rounded-full
            bg-white/85 font-dm-mono text-[8.5px] font-medium
            uppercase tracking-wider text-roamly-g2 truncate max-w-[70%]
          ">
            {etichetta}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setConferma(true) }}
          aria-label="Rimuovi dai salvati"
          className="
            absolute right-[7px] top-[7px] w-8 h-8 rounded-full
            bg-white/90 backdrop-blur-sm shadow-roamly
            flex items-center justify-center text-roamly-text/60
            hover:text-red-500 active:scale-95
            transition-all duration-150
          "
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="px-3 pt-2.5 pb-3.5">
        <p className="font-dm-sans text-[13px] font-medium text-roamly-g0 truncate">
          {luogo.nome}
        </p>
        {luogo.indirizzo && (
          <p className="font-dm-sans text-[11px] text-roamly-g2 truncate mt-1">
            {luogo.indirizzo.split(',').slice(1, 3).join(',').trim() || luogo.indirizzo}
          </p>
        )}
      </div>

      {conferma && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 p-3 text-center"
        >
          <p className="font-dm-sans text-[13px] font-medium text-roamly-g0">Rimuovere questo posto?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConferma(false)}
              disabled={rimuovendo}
              className="h-9 px-4 rounded-full bg-roamly-g7 text-roamly-g1 font-dm-sans text-xs font-medium"
            >
              Annulla
            </button>
            <button
              onClick={() => { setRimuovendo(true); onRimuovi(() => setRimuovendo(false)) }}
              disabled={rimuovendo}
              className="h-9 px-4 rounded-full bg-red-500 text-white font-dm-sans text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-70"
            >
              {rimuovendo && <Loader2 size={12} className="animate-spin" />}
              Rimuovi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
