import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bookmark, MapPin, Sparkles, Plus, Trash2, Loader2, Folder, Pencil, Plane } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useLuoghiSalvati, useArricchisciLuogo, useGestioneRaccolte } from '@/hooks/useLuoghiSalvati'
import { LuogoSearchInput } from '@/components/ui/LuogoSearchInput'
import { SelettoreRaccolte } from './SelettoreRaccolte'
import { useToast } from '@/hooks/useToast'
import { trovaClusterVicini, descriviCluster, distanzaKm } from '@/lib/luoghi-clustering'
import { elencoRaccolte, inRaccolta, nomeEsistenteONuovo, pulisciNomeRaccolta, type Raccolta } from '@/lib/raccolte'
import type { RisultatoGeocoding } from '@/lib/geocoding'
import type { LuogoSalvato } from '@/types'

// ============================================================
// LuoghiSalvatiPage — /profilo/salvati  ("Voglio andarci")
// La wishlist personale: posti che vuoi visitare un giorno, anche
// senza un viaggio. Si aggiungono da qui con la ricerca, oppure
// dalla mappa di un viaggio.
//
// Raccolte: cartelle libere ("Road trip", "Con amici"…). Sopra la ricerca
// "Salva in:" sceglie dove finisce il prossimo posto (o nessuna raccolta:
// resta nell'elenco generale). In cima compaiono le cartelle; toccandone
// una (?raccolta=nome) si vedono solo i suoi posti, e da lì si può
// rinominarla, eliminarla (i posti restano) o organizzarci un viaggio.
//
// Quando 3+ posti non ancora assegnati a un viaggio sono vicini tra loro
// l'app propone di organizzarci un viaggio.
// ============================================================

export function LuoghiSalvatiPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { luoghi, isLoading, rimuoviLuogoSalvato, salvaLuogo, isSalvando } = useLuoghiSalvati()
  const { showSuccess, showError } = useToast()
  const arricchisci = useArricchisciLuogo()
  const gestione = useGestioneRaccolte()
  const [ricerca, setRicerca] = useState('')
  const [salvaIn, setSalvaIn] = useState<string | null>(null)
  const [rinominando, setRinominando] = useState(false)
  const [nuovoNome, setNuovoNome] = useState('')
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [lavoro, setLavoro] = useState(false)

  const raccolte = useMemo(() => elencoRaccolte(luoghi), [luoghi])
  const nomiRaccolte = raccolte.map((r) => r.nome)

  // Raccolta aperta (dall'URL) e i suoi posti
  const nomeAperto = searchParams.get('raccolta')
  const raccoltaAperta: Raccolta | null = nomeAperto
    ? raccolte.find((r) => r.nome.toLowerCase() === nomeAperto.toLowerCase()) ?? null
    : null
  const luoghiVisibili = nomeAperto ? luoghi.filter((l) => inRaccolta(l, nomeAperto)) : luoghi

  // I nuovi posti finiscono nella raccolta aperta, altrimenti in quella scelta
  const raccoltaDestinazione = nomeAperto ?? salvaIn
  // Una raccolta appena creata non ha ancora posti: la si mostra comunque tra i chip
  const chipRaccolte = salvaIn && !nomiRaccolte.some((n) => n.toLowerCase() === salvaIn.toLowerCase())
    ? [...nomiRaccolte, salvaIn]
    : nomiRaccolte

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
        raccolte: raccoltaDestinazione ? [raccoltaDestinazione] : [],
      },
      {
        onSuccess: (luogo) => {
          showSuccess(raccoltaDestinazione ? `Aggiunto a ${raccoltaDestinazione}` : 'Aggiunto ai posti che vuoi visitare')
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

  function apriRaccolta(nome: string) {
    navigate(`/profilo/salvati?raccolta=${encodeURIComponent(nome)}`)
  }

  function esciDaRaccolta() {
    setRinominando(false)
    setConfermaElimina(false)
    if (location.key !== 'default') navigate(-1)
    else navigate('/profilo/salvati', { replace: true })
  }

  async function confermaRinomina() {
    if (!raccoltaAperta) return
    const nome = nomeEsistenteONuovo(nomiRaccolte.filter((n) => n !== raccoltaAperta.nome), nuovoNome)
    if (!pulisciNomeRaccolta(nome) || nome === raccoltaAperta.nome) { setRinominando(false); return }
    setLavoro(true)
    const errore = await gestione.rinomina(luoghi, raccoltaAperta.nome, nome)
    setLavoro(false)
    setRinominando(false)
    if (errore) showError(`Non sono riuscito a rinominarla (${errore})`, 8000)
    else navigate(`/profilo/salvati?raccolta=${encodeURIComponent(nome)}`, { replace: true })
  }

  async function eliminaRaccolta() {
    if (!raccoltaAperta) return
    setLavoro(true)
    const errore = await gestione.elimina(luoghi, raccoltaAperta.nome)
    setLavoro(false)
    setConfermaElimina(false)
    if (errore) showError(`Non sono riuscito a eliminarla (${errore})`, 8000)
    else { showSuccess('Raccolta eliminata: i posti restano salvati'); esciDaRaccolta() }
  }

  // Un viaggio con tutti i posti della raccolta. Il centro e la destinazione
  // si precompilano solo se i posti sono vicini (altrimenti è un itinerario
  // lungo, come un road trip, e la destinazione la scegli tu).
  function viaggioDaRaccolta() {
    if (!raccoltaAperta) return
    const info = descriviCluster(raccoltaAperta.luoghi)
    const compatta = raccoltaAperta.luoghi.every((l) => distanzaKm(l, info) <= 40)
    navigate('/viaggi/nuovo', {
      state: {
        daLuoghi: {
          nomeViaggio: raccoltaAperta.nome,
          nomeZona: compatta ? info.nomeZona : null,
          paese: compatta ? info.paese : null,
          lat: compatta ? info.lat : null,
          lng: compatta ? info.lng : null,
          ids: info.ids,
        },
      },
    })
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title={nomeAperto ? (raccoltaAperta?.nome ?? nomeAperto) : 'Voglio andarci'}
          subtitle={
            isLoading
              ? undefined
              : nomeAperto
                ? `${luoghiVisibili.length} ${luoghiVisibili.length === 1 ? 'posto' : 'posti'} in questa raccolta`
                : `${luoghi.length} ${luoghi.length === 1 ? 'posto salvato' : 'posti salvati'}. Nessuna fretta — restano qui.`
          }
          variant="withBack"
          onBack={nomeAperto ? esciDaRaccolta : undefined}
        />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-4">

          {/* Strumenti della raccolta aperta */}
          {nomeAperto && raccoltaAperta && (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={viaggioDaRaccolta}
                className="h-12 rounded-2xl bg-roamly-g0 text-white inline-flex items-center justify-center gap-2
                  font-dm-sans text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                <Plane size={16} /> Organizza un viaggio con questa raccolta
              </button>

              {rinominando ? (
                <form onSubmit={(e) => { e.preventDefault(); void confermaRinomina() }} className="flex gap-2">
                  <input
                    autoFocus
                    value={nuovoNome}
                    onChange={(e) => setNuovoNome(e.target.value)}
                    maxLength={40}
                    className="flex-1 h-11 px-4 rounded-2xl bg-roamly-g7 border border-roamly-g5 outline-none font-dm-sans text-roamly-text focus:border-roamly-g2"
                    style={{ fontSize: 16 }}
                  />
                  <button type="submit" disabled={lavoro}
                    className="h-11 px-4 rounded-2xl bg-roamly-g0 text-white font-dm-sans text-sm font-semibold disabled:opacity-60">
                    Salva
                  </button>
                  <button type="button" onClick={() => setRinominando(false)}
                    className="h-11 px-3 rounded-2xl text-roamly-text/55 font-dm-sans text-sm">
                    Annulla
                  </button>
                </form>
              ) : confermaElimina ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 flex flex-col gap-2.5">
                  <p className="font-dm-sans text-sm text-red-700">Eliminare la raccolta? I posti restano salvati.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={() => setConfermaElimina(false)} disabled={lavoro}
                      className="h-10 rounded-xl bg-white text-roamly-g1 font-dm-sans text-sm font-medium">Annulla</button>
                    <button onClick={() => void eliminaRaccolta()} disabled={lavoro}
                      className="h-10 rounded-xl bg-red-500 text-white font-dm-sans text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-70">
                      {lavoro && <Loader2 size={14} className="animate-spin" />} Elimina
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => { setNuovoNome(raccoltaAperta.nome); setRinominando(true) }}
                    className="inline-flex items-center gap-1.5 font-dm-sans text-[13px] font-medium text-roamly-g2">
                    <Pencil size={13} /> Rinomina
                  </button>
                  <button onClick={() => setConfermaElimina(true)}
                    className="inline-flex items-center gap-1.5 font-dm-sans text-[13px] font-medium text-red-500">
                    <Trash2 size={13} /> Elimina raccolta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Aggiungi un posto, senza bisogno di un viaggio */}
          <div className="flex flex-col gap-2">
            {!nomeAperto && (
              <div className="flex flex-col gap-1.5">
                <p className="font-dm-mono text-[10px] font-medium uppercase tracking-[0.14em] text-roamly-text/40">Salva in</p>
                <SelettoreRaccolte
                  tutte={chipRaccolte}
                  selezionate={salvaIn ? [salvaIn] : []}
                  onNessuna={() => setSalvaIn(null)}
                  onToggle={(nome) => setSalvaIn(salvaIn?.toLowerCase() === nome.toLowerCase() ? null : nome)}
                  onNuova={(nome) => setSalvaIn(nome)}
                />
              </div>
            )}
            <LuogoSearchInput
              placeholder={nomeAperto ? `Aggiungi un posto a ${raccoltaAperta?.nome ?? nomeAperto}…` : 'Cerca un posto da aggiungere…'}
              value={ricerca}
              onChangeValue={setRicerca}
              onSelectLuogo={aggiungi}
            />
            <p className="font-dm-sans text-[11px] text-roamly-text/40 flex items-center gap-1">
              <Plus size={11} />
              {isSalvando
                ? 'Salvataggio…'
                : raccoltaDestinazione
                  ? `Il posto che tocchi finisce in “${raccoltaDestinazione}”.`
                  : 'Una città, un monumento, un locale: tocca il risultato per salvarlo.'}
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
          ) : nomeAperto && luoghiVisibili.length === 0 ? (
            <p className="font-dm-sans text-sm text-roamly-text/50 text-center py-10">
              Questa raccolta è vuota. Cerca un posto qui sopra per aggiungerlo.
            </p>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Cartelle */}
              {!nomeAperto && raccolte.length > 0 && (
                <section className="flex flex-col gap-2.5">
                  <h2 className="font-lora text-lg font-semibold text-roamly-g0">Le tue raccolte</h2>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                    {raccolte.map((r) => (
                      <CartellaRaccolta key={r.nome} raccolta={r} onApri={() => apriRaccolta(r.nome)} />
                    ))}
                  </div>
                </section>
              )}

              {!nomeAperto && clusterPrincipale && (
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

              {!nomeAperto && raccolte.length > 0 && (
                <h2 className="font-lora text-lg font-semibold text-roamly-g0 -mb-1">Tutti i posti</h2>
              )}

              <div className="grid grid-cols-2 gap-3">
                {luoghiVisibili.map((luogo) => (
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
// CartellaRaccolta — una cartella con il mosaico delle foto dei suoi posti
// ------------------------------------------------------------

function CartellaRaccolta({ raccolta, onApri }: { raccolta: Raccolta; onApri: () => void }) {
  const foto = raccolta.foto
  return (
    <button
      onClick={onApri}
      className="shrink-0 w-[150px] rounded-[18px] overflow-hidden bg-white shadow-roamly text-left active:scale-[0.98] transition-transform"
    >
      <div className="relative h-[92px] bg-roamly-g6 overflow-hidden"
        style={foto.length === 0 ? { background: '#DFF3FA', backgroundImage: 'repeating-linear-gradient(135deg, rgba(11,111,153,.13) 0 3px, transparent 3px 9px)' } : undefined}>
        {foto.length > 0 ? (
          <div className={`absolute inset-0 grid gap-px ${foto.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {foto.map((f, i) => (
              <img key={i} src={f} alt="" loading="lazy" className="w-full h-full object-cover"
                style={foto.length === 3 && i === 0 ? { gridRow: 'span 2' } : undefined} />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Folder size={24} className="text-roamly-g3/60" />
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="font-dm-sans text-[13px] font-semibold text-roamly-g0 truncate">{raccolta.nome}</p>
        <p className="font-dm-sans text-[11px] text-roamly-g2 mt-0.5">
          {raccolta.luoghi.length} {raccolta.luoghi.length === 1 ? 'posto' : 'posti'}
        </p>
      </div>
    </button>
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
