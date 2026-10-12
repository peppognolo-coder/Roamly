import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Navigation, Globe, Phone, Clock, BookOpen,
  Plane, Trash2, Check, X, Loader2, ExternalLink, Star,
} from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { useLuoghiSalvati, useAggiornaLuogo, useArricchisciLuogo } from '@/hooks/useLuoghiSalvati'
import { useViaggi } from '@/hooks/useViaggi'
import { useToast } from '@/hooks/useToast'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import type { LuogoSalvato } from '@/types'

// ============================================================
// LuogoSalvatoPage — /profilo/salvati/:id
// La scheda di un posto di "Voglio andarci": foto di copertina e
// descrizione (da Wikipedia, recuperate in automatico la prima volta),
// informazioni pratiche, mappa, e le azioni: aprire in Maps, aggiungere
// a un viaggio, rimuovere dai salvati.
// ============================================================

const ZONE_AMPIE = ['Città', 'Località', 'Comune', 'Isola', 'Regione', 'Paese']

const GIORNI: [RegExp, string][] = [
  [/\bMo\b/g, 'Lun'], [/\bTu\b/g, 'Mar'], [/\bWe\b/g, 'Mer'], [/\bTh\b/g, 'Gio'],
  [/\bFr\b/g, 'Ven'], [/\bSa\b/g, 'Sab'], [/\bSu\b/g, 'Dom'],
  [/\bPH\b/g, 'festivi'], [/\boff\b/g, 'chiuso'],
]

function orariLeggibili(raw: string): string {
  return GIORNI.reduce((t, [re, it]) => t.replace(re, it), raw).replace(/;\s*/g, '\n')
}

// Nome + zona (es. "Trattoria da Mario, Roma, Lazio"): così Google apre la
// scheda dell'attività con foto, recensioni e orari. Le sole coordinate
// metterebbero uno spillo sul punto, spesso senza la scheda del locale.
function testoRicerca(l: LuogoSalvato): string {
  const zona = (l.indirizzo ?? '').split(',').slice(1, 4).map((p) => p.trim()).filter(Boolean).join(', ')
  return zona ? `${l.nome}, ${zona}` : l.nome
}

function linkMaps(l: LuogoSalvato): string {
  const zona = (l.indirizzo ?? '').split(',').length > 1
  // Senza un indirizzo il nome da solo è ambiguo: meglio le coordinate
  const query = zona ? testoRicerca(l) : `${l.lat},${l.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function linkTripadvisor(l: LuogoSalvato): string {
  return `https://www.tripadvisor.it/Search?q=${encodeURIComponent(testoRicerca(l))}`
}

function urlMappa(l: LuogoSalvato): string {
  const d = l.categoria && ZONE_AMPIE.includes(l.categoria) ? 0.08 : 0.008
  return (
    `https://www.openstreetmap.org/export/embed.html?bbox=${l.lng - d * 1.5},${l.lat - d},${l.lng + d * 1.5},${l.lat + d}` +
    `&layer=mapnik&marker=${l.lat},${l.lng}`
  )
}

export function LuogoSalvatoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError } = useToast()
  const { luoghi, isLoading, rimuoviLuogoSalvato } = useLuoghiSalvati()
  const aggiorna = useAggiornaLuogo()
  const arricchisci = useArricchisciLuogo()
  const { data: viaggi = [] } = useViaggi()

  const luogo = luoghi.find((l) => l.id === id) ?? null
  const viaggioCollegato = luogo?.viaggio_id ? viaggi.find((v) => v.id === luogo.viaggio_id) : undefined

  const [cercaInfo, setCercaInfo] = useState(false)
  const [fotoRotta, setFotoRotta] = useState(false)
  const [sceltaViaggio, setSceltaViaggio] = useState(false)
  const [confermaRimozione, setConfermaRimozione] = useState(false)
  const [rimuovendo, setRimuovendo] = useState(false)
  const avviato = useRef(false)

  // Prima apertura: recupera descrizione, foto e informazioni (una sola volta)
  useEffect(() => {
    if (!luogo || luogo.info_aggiornate_at || avviato.current) return
    avviato.current = true
    setCercaInfo(true)
    arricchisci(luogo).finally(() => setCercaInfo(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luogo?.id, luogo?.info_aggiornate_at])

  function indietro() {
    if (location.key !== 'default') navigate(-1)
    else navigate('/profilo/salvati', { replace: true })
  }

  async function assegna(viaggioId: string | null, nomeViaggio?: string) {
    if (!luogo) return
    setSceltaViaggio(false)
    const errore = await aggiorna(luogo.id, { viaggio_id: viaggioId })
    if (errore) showError(`Non sono riuscito ad aggiornare il luogo (${errore})`, 8000)
    else showSuccess(viaggioId ? `Aggiunto a ${nomeViaggio}` : 'Tolto dal viaggio')
  }

  function rimuovi() {
    if (!luogo) return
    setRimuovendo(true)
    rimuoviLuogoSalvato(luogo.id, {
      onSuccess: () => { showSuccess('Rimosso dai tuoi posti'); indietro() },
      onError: (msg) => { setRimuovendo(false); showError(`Non sono riuscito a rimuoverlo (${msg})`, 8000) },
    })
  }

  // ── Caricamento / non trovato ─────────────────────────────
  if (isLoading || !luogo) {
    return (
      <PageLayout>
        <AnimatedPage>
          <div className="px-5 pt-14 flex flex-col gap-4">
            <button onClick={indietro} aria-label="Indietro"
              className="w-10 h-10 rounded-full bg-roamly-g7 text-roamly-g1 flex items-center justify-center">
              <ArrowLeft size={18} />
            </button>
            {isLoading ? (
              <div className="h-[240px] rounded-3xl bg-roamly-g6 animate-pulse" />
            ) : (
              <p className="font-dm-sans text-sm text-roamly-text/50 text-center py-12">Posto non trovato.</p>
            )}
          </div>
        </AnimatedPage>
        <BottomNav />
      </PageLayout>
    )
  }

  const haFoto = !!luogo.foto_url && !fotoRotta
  const sottotitolo = [luogo.categoria, luogo.indirizzo?.split(',').slice(1, 3).join(',').trim()].filter(Boolean).join(' · ')

  return (
    <PageLayout>
      <AnimatedPage>
        <div className="flex flex-col min-h-screen pb-28">

          {/* ── Copertina ── */}
          <div className="relative h-[290px] shrink-0 overflow-hidden"
            style={{ background: '#DFF3FA' }}>
            {haFoto ? (
              <img
                src={luogo.foto_url ?? ''}
                alt={luogo.nome}
                onError={() => setFotoRotta(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(11,111,153,.13) 0 3px, transparent 3px 9px)' }}>
                {cercaInfo
                  ? <Loader2 size={26} className="animate-spin text-roamly-g3" />
                  : <MapPin size={34} className="text-roamly-g3/60" />}
              </div>
            )}
            {haFoto && <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />}

            <button
              onClick={indietro}
              aria-label="Indietro"
              className="absolute left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-roamly-g0
                flex items-center justify-center shadow-roamly active:scale-95 transition-transform"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            >
              <ArrowLeft size={18} />
            </button>

            {haFoto && luogo.foto_credito && (
              <span className="absolute right-3 bottom-2 font-dm-mono text-[9px] text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
                Foto: {luogo.foto_credito}
              </span>
            )}
          </div>

          <div className="px-5 pt-5 flex flex-col gap-5">

            {/* ── Titolo ── */}
            <div className="flex flex-col gap-1.5">
              <h1 className="font-lora text-[26px] leading-tight font-semibold text-roamly-g0">{luogo.nome}</h1>
              {sottotitolo && (
                <p className="font-dm-sans text-sm text-roamly-text/55">{sottotitolo}</p>
              )}
              {viaggioCollegato && (
                <span className="self-start mt-1 px-2.5 py-1 rounded-full bg-roamly-g6 font-dm-mono text-[10px] font-medium uppercase tracking-wide text-roamly-g1">
                  Nel viaggio · {viaggioCollegato.nome}
                </span>
              )}
            </div>

            {/* ── Azioni ── */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={linkMaps(luogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 rounded-2xl bg-roamly-g0 text-white inline-flex items-center justify-center gap-2
                    font-dm-sans text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  <Navigation size={16} /> Apri in Maps
                </a>
                <a
                  href={linkTripadvisor(luogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 rounded-2xl bg-white shadow-roamly text-roamly-g1 inline-flex items-center justify-center gap-2
                    font-dm-sans text-sm font-semibold active:scale-[0.98] transition-transform"
                >
                  <Star size={16} className="text-roamly-g2" /> Tripadvisor
                </a>
              </div>
              <button
                onClick={() => setSceltaViaggio(true)}
                className="h-12 rounded-2xl bg-white shadow-roamly text-roamly-g1 inline-flex items-center justify-center gap-2
                  font-dm-sans text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                <Plane size={16} className="text-roamly-coral" />
                {luogo.viaggio_id ? 'Cambia viaggio' : 'Aggiungi a un viaggio'}
              </button>
            </div>

            {/* ── Descrizione ── */}
            {luogo.descrizione ? (
              <section className="bg-white rounded-2xl shadow-roamly p-4 flex flex-col gap-2.5">
                <p className="font-dm-sans text-[15px] leading-relaxed text-roamly-text/80">{luogo.descrizione}</p>
                {luogo.wikipedia_url && (
                  <a href={luogo.wikipedia_url} target="_blank" rel="noopener noreferrer"
                    className="self-start inline-flex items-center gap-1.5 font-dm-sans text-xs font-medium text-roamly-g2">
                    <BookOpen size={13} /> Leggi di più su Wikipedia <ExternalLink size={11} />
                  </a>
                )}
              </section>
            ) : cercaInfo ? (
              <div className="bg-white rounded-2xl shadow-roamly p-4 flex items-center gap-3 text-roamly-text/50">
                <Loader2 size={16} className="animate-spin text-roamly-g3" />
                <p className="font-dm-sans text-sm">Sto cercando informazioni su questo posto…</p>
              </div>
            ) : (
              <p className="font-dm-sans text-xs text-roamly-text/40 leading-relaxed">
                Per questo posto non ho trovato una descrizione. Puoi comunque aprirlo in Maps o aggiungerlo a un viaggio.
              </p>
            )}

            {/* ── Informazioni pratiche ── */}
            {(luogo.orari || luogo.sito_web || luogo.telefono) && (
              <section className="bg-white rounded-2xl shadow-roamly divide-y divide-roamly-g6">
                {luogo.orari && (
                  <div className="flex items-start gap-3 p-4">
                    <Clock size={16} className="text-roamly-g3 mt-0.5 shrink-0" />
                    <p className="font-dm-sans text-sm text-roamly-text/80 whitespace-pre-line">{orariLeggibili(luogo.orari)}</p>
                  </div>
                )}
                {luogo.sito_web && (
                  <a href={luogo.sito_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4">
                    <Globe size={16} className="text-roamly-g3 shrink-0" />
                    <span className="font-dm-sans text-sm text-roamly-g1 truncate">{luogo.sito_web.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </a>
                )}
                {luogo.telefono && (
                  <a href={`tel:${luogo.telefono.replace(/\s/g, '')}`} className="flex items-center gap-3 p-4">
                    <Phone size={16} className="text-roamly-g3 shrink-0" />
                    <span className="font-dm-sans text-sm text-roamly-g1">{luogo.telefono}</span>
                  </a>
                )}
              </section>
            )}

            {/* ── Mappa ── */}
            <div className="rounded-2xl overflow-hidden shadow-roamly bg-roamly-g6 h-[200px]">
              <iframe
                title={`Mappa di ${luogo.nome}`}
                src={urlMappa(luogo)}
                loading="lazy"
                className="w-full h-full border-0"
              />
            </div>

            {/* ── Rimuovi ── */}
            {confermaRimozione ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                <p className="font-dm-sans text-sm text-red-700">Vuoi togliere questo posto dai tuoi salvati?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setConfermaRimozione(false)} disabled={rimuovendo}
                    className="h-11 rounded-xl bg-white text-roamly-g1 font-dm-sans text-sm font-medium">
                    Annulla
                  </button>
                  <button onClick={rimuovi} disabled={rimuovendo}
                    className="h-11 rounded-xl bg-red-500 text-white font-dm-sans text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-70">
                    {rimuovendo ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Rimuovi
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfermaRimozione(true)}
                className="h-12 rounded-2xl border border-red-200 text-red-500 inline-flex items-center justify-center gap-2
                  font-dm-sans text-sm font-medium active:scale-[0.98] transition-transform"
              >
                <Trash2 size={16} /> Rimuovi dai salvati
              </button>
            )}
          </div>
        </div>
      </AnimatedPage>

      {sceltaViaggio && createPortal(
        <div className="fixed inset-0 z-[90] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSceltaViaggio(false)} />
          <div className="relative w-full max-w-[430px] max-h-[75vh] overflow-y-auto bg-roamly-bg rounded-t-3xl p-5 pb-8 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-lora text-lg font-semibold text-roamly-g0">A quale viaggio?</h2>
              <button onClick={() => setSceltaViaggio(false)} aria-label="Chiudi"
                className="w-8 h-8 rounded-full bg-roamly-g7 text-roamly-g1 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {viaggi.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="font-dm-sans text-sm text-roamly-text/55">Non hai ancora nessun viaggio.</p>
                <button
                  onClick={() => navigate('/viaggi/nuovo', { state: { daLuoghi: { nomeZona: luogo.nome, paese: null, lat: luogo.lat, lng: luogo.lng, ids: [luogo.id] } } })}
                  className="h-11 px-5 rounded-full bg-roamly-g0 text-white font-dm-sans text-sm font-semibold"
                >
                  Crea un viaggio con questo posto
                </button>
              </div>
            ) : (
              <>
                {viaggi.map((v) => {
                  const attivo = v.id === luogo.viaggio_id
                  return (
                    <button
                      key={v.id}
                      onClick={() => assegna(v.id, v.nome)}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white shadow-roamly text-left active:scale-[0.98] transition-transform"
                    >
                      <span className="w-10 h-10 rounded-xl bg-roamly-g7 flex items-center justify-center text-roamly-g2 shrink-0">
                        <ViaggioCoverIcon value={v.cover_emoji} size={18} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-dm-sans text-sm font-semibold text-roamly-g0 truncate">{v.nome}</span>
                        <span className="block font-dm-mono text-[10px] text-roamly-text/40">{formatDataViaggio(v.data_inizio, v.data_fine)}</span>
                      </span>
                      {attivo && <Check size={18} className="text-roamly-g2 shrink-0" />}
                    </button>
                  )
                })}
                {luogo.viaggio_id && (
                  <button onClick={() => assegna(null)}
                    className="h-11 rounded-xl text-roamly-text/55 font-dm-sans text-sm font-medium">
                    Togli dal viaggio
                  </button>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      <BottomNav />
    </PageLayout>
  )
}
