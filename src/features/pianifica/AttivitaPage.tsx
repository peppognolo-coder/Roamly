import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Clock, Pencil, ExternalLink, EyeOff, Eye, Search, Heart, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import { useTappeNascoste } from '@/hooks/useTappeNascoste'
import { useLuoghiSalvati } from '@/hooks/useLuoghiSalvati'
import { useLuogoSearch } from '@/hooks/useLuogoSearch'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys }    from '@/lib/queryKeys'
import { cercaLuoghi }  from '@/lib/geocoding'
import type { RisultatoGeocoding } from '@/lib/geocoding'
import type { TappaViaggio } from '@/types'
import 'leaflet/dist/leaflet.css'
import '@/styles/leaflet-overrides.css'

// ============================================================
// AttivitaPage — /viaggi/:id/attivita
// Mappa con pin delle tappe. Tap su un pin → dettagli.
// Tap su un punto vuoto → crea una nuova tappa lì.
// Stesso dato di Itinerario (tappe_viaggio), vista diversa — le
// tappe con luogo selezionato dalla ricerca in Itinerario (o
// posizionate qui a mano) compaiono qui automaticamente, colorate
// per giorno di visita. Filtri per mostrare/nascondere un giorno
// alla volta; eliminare/aggiungere resta invariato (form condiviso).
//
// "Nascondi per me" (useTappeNascoste) è diverso dai filtri giorno:
// i filtri sono temporanei, per sessione; nascondere è una
// preferenza personale salvata, che resta per gli accessi futuri
// ma non tocca la tappa per gli altri membri né in Itinerario.
//
// Modalità mappa (Oggi / Salvati / Vicino a me) — la modalità
// "Oggi" è il comportamento originale, invariato (filtri giorno,
// popup completo). "Salvati" e "Vicino a me" mostrano un bottom
// sheet con chip orizzontali al posto dei filtri giorno, e
// alimentano la mappa con i luoghi salvati (useLuoghiSalvati)
// invece delle tappe dell'itinerario.
// ============================================================

const CENTRO_DEFAULT: [number, number] = [41.9028, 12.4964] // Roma

const SENZA_GIORNO = '__senza_giorno__'
const COLORE_SENZA_GIORNO = '#94A3B8'
const COLORE_SALVATO = '#FF6B4A' // corallo — coerente con l'accento "salva" nel resto dell'app

// Palette colori per giorno — ciclica, distinguibile a colpo
// d'occhio anche con molti giorni in un viaggio lungo.
const PALETTE_GIORNI = [
  '#0F7EA8', '#FF6B4A', '#3DA35D', '#C084FC',
  '#F5A623', '#EC4899', '#64748B', '#14B8A6',
]

function coloreGiorno(indice: number): string {
  return PALETTE_GIORNI[indice % PALETTE_GIORNI.length]
}

// Cache dei divIcon per colore — evita di ricrearli ad ogni render
// (Leaflet non ha bisogno di nuove istanze se il colore non cambia).
const cacheIcone = new Map<string, L.DivIcon>()

function iconaPerColore(colore: string): L.DivIcon {
  const esistente = cacheIcone.get(colore)
  if (esistente) return esistente

  const icona = L.divIcon({
    className: 'roamly-marker',
    html: `
      <div style="
        width: 30px; height: 30px;
        background: ${colore};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(12,42,61,0.3);
      "></div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  })
  cacheIcone.set(colore, icona)
  return icona
}

// Icona distinta per il risultato di una ricerca non ancora
// aggiunto/salvato — un punto vuoto, per non confonderlo con una
// tappa o un luogo già salvato.
const iconaRicerca = L.divIcon({
  className: 'roamly-marker',
  html: `
    <div style="
      width: 26px; height: 26px;
      background: #fff;
      border: 3px solid #0C2A3D;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(12,42,61,0.3);
    "></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -28],
})

function formatGiornoBreve(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const label = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function distanzaKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

type ModalitaMappa = 'oggi' | 'salvati' | 'vicino'

const MODALITA_LABEL: Record<ModalitaMappa, string> = {
  oggi: 'Tappe di oggi',
  salvati: 'Salvati',
  vicino: 'Vicino a me',
}
const MODALITA_SHORT: Record<ModalitaMappa, string> = {
  oggi: 'OGGI',
  salvati: 'SALV',
  vicino: 'VIC',
}
const MODALITA_SUCCESSIVA: Record<ModalitaMappa, ModalitaMappa> = {
  oggi: 'salvati',
  salvati: 'vicino',
  vicino: 'oggi',
}

interface PuntoMappa {
  id: string
  lat: number
  lng: number
  nome: string
  meta: string
  colore: string
  tipo: 'tappa' | 'luogo'
}

function PosizionaMappa({
  punti,
  centroFallback,
  zoomFallback,
}: {
  punti: [number, number][]
  centroFallback: [number, number] | null
  zoomFallback: number
}) {
  const map = useMap()
  // Priorità: punti della modalità corrente (adatta ai confini) >
  // centro di fallback (destinazione geocodificata, poi GPS) quando
  // arriva in modo asincrono > resta sul default iniziale se nessuno
  // dei due è ancora disponibile. Reagisce ai cambi perché — a
  // differenza dei props center/zoom di MapContainer, validi solo al
  // mount — qui usiamo l'API imperativa di Leaflet per spostare la
  // mappa anche dopo il primo render (es. quando risolve la
  // geocodifica, o quando si cambia modalità).
  useEffect(() => {
    if (punti.length === 1) {
      map.setView(punti[0], 14)
    } else if (punti.length > 1) {
      map.fitBounds(L.latLngBounds(punti), { padding: [40, 40] })
    } else if (centroFallback) {
      map.setView(centroFallback, zoomFallback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [punti, centroFallback, zoomFallback])
  return null
}

function CatturaMappa({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map])
  return null
}

function urlMaps(indirizzo: string, lat?: number | null, lng?: number | null): string {
  const query = lat != null && lng != null ? `${lat},${lng}` : indirizzo
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function GestoreClick({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function AttivitaPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: tappe = [], isLoading } = useTappe(viaggioId)
  const { idNascosti, nascondiTappa, mostraTappa } = useTappeNascoste()
  const { luoghi: luoghiSalvati, salvaLuogo, rimuoviLuogoSalvato } = useLuoghiSalvati(viaggioId)
  const [geoloc, setGeoloc] = useState<[number, number] | null>(null)
  const [giorniNascosti, setGiorniNascosti] = useState<Set<string>>(new Set())
  const [mostraElencoNascoste, setMostraElencoNascoste] = useState(false)

  const [modalita, setModalita] = useState<ModalitaMappa>('oggi')
  const [chipSelezionato, setChipSelezionato] = useState<string | null>(null)
  const [ricerca, setRicerca] = useState('')
  const [ricercaAperta, setRicercaAperta] = useState(false)
  const [puntoRicerca, setPuntoRicerca] = useState<RisultatoGeocoding | null>(null)

  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})

  useRealtimeSync('tappe_viaggio', 'viaggio_id', viaggioId, [queryKeys.tappe.byViaggio(viaggioId ?? '')])

  const ricercaDebounced = useDebouncedValue(ricerca, 450)
  const { data: risultatiRicerca = [], isFetching: cercando } = useLuogoSearch(ricercaDebounced)

  const tappeConPosizione = tappe.filter((t) => t.lat != null && t.lng != null)
  const tappeNascostePersonali = tappeConPosizione.filter((t) => idNascosti.has(t.id))
  const tappeBase = tappeConPosizione.filter((t) => !idNascosti.has(t.id))

  // Giorni distinti tra le tappe posizionate E visibili — alimenta
  // sia la palette colori (indice = colore) sia i chip filtro.
  // Solo per la modalità "Oggi".
  const giorniOrdinati = useMemo(
    () => Array.from(new Set(
      tappeBase.filter((t) => t.giorno).map((t) => t.giorno as string)
    )).sort(),
    [tappeBase]
  )
  const haSenzaGiorno = tappeBase.some((t) => !t.giorno)
  const mostraFiltri = modalita === 'oggi' && giorniOrdinati.length + (haSenzaGiorno ? 1 : 0) > 1

  function chiaveGiorno(t: TappaViaggio): string {
    return t.giorno ?? SENZA_GIORNO
  }
  function coloreTappa(t: TappaViaggio): string {
    if (!t.giorno) return COLORE_SENZA_GIORNO
    const indice = giorniOrdinati.indexOf(t.giorno)
    return indice >= 0 ? coloreGiorno(indice) : COLORE_SENZA_GIORNO
  }

  function toggleGiorno(chiave: string) {
    setGiorniNascosti((prev) => {
      const next = new Set(prev)
      if (next.has(chiave)) next.delete(chiave)
      else next.add(chiave)
      return next
    })
  }

  const tappeVisibili = tappeBase.filter((t) => !giorniNascosti.has(chiaveGiorno(t)))

  // Centro di fallback quando il viaggio non ha ancora nessuna tappa
  // posizionata — priorità: coordinate della destinazione già salvate
  // sul viaggio (nessuna chiamata di rete), poi geocodifica testuale
  // "al volo" per i viaggi senza coordinate salvate (creati prima di
  // questa colonna, o destinazione digitata senza selezionare un
  // suggerimento), poi posizione GPS attuale, poi il default fisso (Roma).
  // Ha senso partire dalla destinazione perché un diario di viaggio
  // si pianifica spesso da casa, prima di partire — vedere la propria
  // posizione attuale non aiuterebbe a piazzare le tappe.
  const haCoordinateSalvate = viaggio?.destinazione_lat != null && viaggio?.destinazione_lng != null
  const queryDestinazione = (viaggio?.destinazione || viaggio?.paese || '').trim()

  const { data: risultatiDestinazione } = useQuery({
    queryKey: queryKeys.geocoding.search(queryDestinazione.toLowerCase()),
    queryFn: ({ signal }) => cercaLuoghi(queryDestinazione, signal),
    enabled: tappeConPosizione.length === 0 && !haCoordinateSalvate && queryDestinazione.length >= 3,
    staleTime: 1000 * 60 * 60, // 1h — la destinazione di un viaggio non cambia in sessione
    retry: false,
  })
  const centroDestinazione: [number, number] | null = haCoordinateSalvate
    ? [viaggio!.destinazione_lat as number, viaggio!.destinazione_lng as number]
    : risultatiDestinazione?.[0]
      ? [risultatiDestinazione[0].lat, risultatiDestinazione[0].lng]
      : null

  // Se non ci sono ancora tappe posizionate, prova anche a leggere la
  // posizione GPS attuale come ulteriore fallback (richiede permesso,
  // nessun tracciamento) — usata solo se la destinazione non è nota
  // o non è geocodificabile.
  if (tappeConPosizione.length === 0 && !geoloc && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoloc([pos.coords.latitude, pos.coords.longitude]),
      () => { /* permesso negato o non disponibile — resta sul default */ },
      { timeout: 5000 }
    )
  }

  // In modalità "Vicino a me" la posizione GPS serve sempre, non solo
  // quando non ci sono tappe — richiesta separata, sempre con garbo
  // (nessun tracciamento continuo, un solo tentativo).
  useEffect(() => {
    if (modalita === 'vicino' && !geoloc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoloc([pos.coords.latitude, pos.coords.longitude]),
        () => { /* permesso negato o non disponibile */ },
        { timeout: 5000 }
      )
    }
  }, [modalita, geoloc])

  const centroFallback = centroDestinazione ?? geoloc

  // Punti della modalità corrente — unifica tappe e luoghi salvati
  // sotto un'unica forma, per marker, bottom sheet e fit-bounds.
  const puntiModalita: PuntoMappa[] = useMemo(() => {
    if (modalita === 'oggi') {
      return tappeVisibili.map((t) => ({
        id: t.id,
        lat: t.lat as number,
        lng: t.lng as number,
        nome: t.nome,
        meta: t.ora ? t.ora.slice(0, 5) : t.categoria,
        colore: coloreTappa(t),
        tipo: 'tappa' as const,
      }))
    }
    if (modalita === 'salvati') {
      return luoghiSalvati.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        nome: l.nome,
        meta: l.categoria ?? l.indirizzo ?? '',
        colore: COLORE_SALVATO,
        tipo: 'luogo' as const,
      }))
    }
    // 'vicino' — tappe + salvati insieme, ordinati per distanza dal
    // centro corrente (GPS se disponibile, altrimenti il fallback).
    const base = centroFallback ?? CENTRO_DEFAULT
    const unione: PuntoMappa[] = [
      ...tappeBase.map((t) => ({
        id: t.id, lat: t.lat as number, lng: t.lng as number, nome: t.nome,
        meta: t.ora ? t.ora.slice(0, 5) : t.categoria, colore: coloreTappa(t), tipo: 'tappa' as const,
      })),
      ...luoghiSalvati.map((l) => ({
        id: l.id, lat: l.lat, lng: l.lng, nome: l.nome,
        meta: l.categoria ?? l.indirizzo ?? '', colore: COLORE_SALVATO, tipo: 'luogo' as const,
      })),
    ]
    return unione
      .map((p) => ({ ...p, distanza: distanzaKm(base, [p.lat, p.lng]) }))
      .sort((a, b) => a.distanza - b.distanza)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalita, tappeVisibili, tappeBase, luoghiSalvati, centroFallback])

  const punti: [number, number][] = puntiModalita.map((p) => [p.lat, p.lng])
  const centro = punti.length > 0 ? punti[0] : (centroFallback ?? CENTRO_DEFAULT)
  const zoomIniziale = punti.length > 0 ? 13 : (centroFallback ? 12 : 5)

  function handleMapClick(lat: number, lng: number) {
    navigate(`/viaggi/${viaggioId}/tappe/nuova?from=attivita&lat=${lat}&lng=${lng}`)
  }

  function ciclaModalita() {
    setModalita((m) => MODALITA_SUCCESSIVA[m])
    setChipSelezionato(null)
    setPuntoRicerca(null)
  }

  function selezionaChip(id: string) {
    setChipSelezionato(id)
    const p = puntiModalita.find((x) => x.id === id)
    if (p) mapRef.current?.flyTo([p.lat, p.lng], 15)
    markerRefs.current[id]?.openPopup()
  }

  function selezionaRicerca(r: RisultatoGeocoding) {
    setPuntoRicerca(r)
    setRicercaAperta(false)
    mapRef.current?.flyTo([r.lat, r.lng], 15)
  }

  function salvaRisultatoRicerca() {
    if (!puntoRicerca || !viaggioId) return
    salvaLuogo({
      nome: puntoRicerca.label.split(',')[0],
      lat: puntoRicerca.lat,
      lng: puntoRicerca.lng,
      indirizzo: puntoRicerca.label,
      viaggio_id: viaggioId,
    })
    setPuntoRicerca(null)
    setRicerca('')
  }

  return (
    <PageLayout withBottomNav={false}>
      <AnimatedPage>
      <div className="flex flex-col h-screen">
        <PageHeader title="Attività" subtitle={viaggio?.nome} variant="withBack" className="pb-3" />

        {isLoading ? (
          <div className="flex-1 mx-5 mb-5 rounded-2xl bg-roamly-g6 animate-pulse" />
        ) : (
          <>
            {mostraFiltri && (
              <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
                {giorniOrdinati.map((giorno, i) => {
                  const attivo = !giorniNascosti.has(giorno)
                  const colore = coloreGiorno(i)
                  return (
                    <button
                      key={giorno}
                      onClick={() => toggleGiorno(giorno)}
                      className={`
                        shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        border font-dm-sans text-xs font-medium
                        transition-all duration-150
                        ${attivo
                          ? 'bg-white border-roamly-g5 text-roamly-text shadow-roamly'
                          : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/35'
                        }
                      `}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: attivo ? colore : '#CBD5E1' }}
                      />
                      {formatGiornoBreve(giorno)}
                    </button>
                  )
                })}
                {haSenzaGiorno && (
                  <button
                    onClick={() => toggleGiorno(SENZA_GIORNO)}
                    className={`
                      shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      border font-dm-sans text-xs font-medium
                      transition-all duration-150
                      ${!giorniNascosti.has(SENZA_GIORNO)
                        ? 'bg-white border-roamly-g5 text-roamly-text shadow-roamly'
                        : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/35'
                      }
                    `}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: !giorniNascosti.has(SENZA_GIORNO) ? COLORE_SENZA_GIORNO : '#CBD5E1' }}
                    />
                    Senza giorno
                  </button>
                )}
              </div>
            )}

            {tappeNascostePersonali.length > 0 && modalita === 'oggi' && (
              <div className="px-5 pb-3">
                <button
                  onClick={() => setMostraElencoNascoste((v) => !v)}
                  className="
                    flex items-center gap-1.5 font-dm-sans text-xs font-medium
                    text-roamly-text/40 hover:text-roamly-text/60
                  "
                >
                  <EyeOff size={12} />
                  {tappeNascostePersonali.length} nascoste per te
                </button>
                {mostraElencoNascoste && (
                  <div className="mt-2 flex flex-col gap-1.5 bg-white rounded-2xl shadow-roamly p-3">
                    {tappeNascostePersonali.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <span className="font-dm-sans text-xs text-roamly-text/70 truncate">
                          {t.nome}
                        </span>
                        <button
                          onClick={() => mostraTappa(t.id)}
                          className="
                            shrink-0 flex items-center gap-1
                            font-dm-sans text-xs font-medium text-roamly-g2
                            hover:text-roamly-g1
                          "
                        >
                          <Eye size={11} />
                          Mostra
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 mx-5 mb-5 rounded-2xl overflow-hidden shadow-roamly relative">
              <MapContainer
                center={centro}
                zoom={zoomIniziale}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CatturaMappa mapRef={mapRef} />
                <PosizionaMappa punti={punti} centroFallback={centroFallback} zoomFallback={12} />
                <GestoreClick onClick={handleMapClick} />

                {puntiModalita.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={iconaPerColore(p.colore)}
                    ref={(m) => { markerRefs.current[p.id] = m }}
                  >
                    <Popup>
                      {p.tipo === 'tappa' ? (
                        <div className="p-3.5 flex flex-col gap-1.5">
                          <p className="font-dm-sans text-sm font-semibold text-roamly-g0">{p.nome}</p>
                          {p.meta && (
                            <p className="font-dm-sans text-xs text-roamly-text/50 flex items-center gap-1">
                              <Clock size={10} />
                              {p.meta}
                            </p>
                          )}
                          <button
                            onClick={() => navigate(`/viaggi/${viaggioId}/tappe/${p.id}?from=attivita`)}
                            className="flex items-center gap-1 mt-1.5 font-dm-sans text-xs font-medium text-roamly-g2 hover:text-roamly-g1"
                          >
                            <Pencil size={11} />
                            Modifica
                          </button>
                          <a
                            href={urlMaps(p.nome, p.lat, p.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1 font-dm-sans text-xs font-medium text-roamly-g2 hover:text-roamly-g1"
                          >
                            <ExternalLink size={11} />
                            Apri in Maps
                          </a>
                          <button
                            onClick={() => nascondiTappa(p.id)}
                            className="flex items-center gap-1 mt-1 font-dm-sans text-xs font-medium text-roamly-text/40 hover:text-roamly-text/60"
                          >
                            <EyeOff size={11} />
                            Nascondi per me
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 flex flex-col gap-1.5">
                          <p className="font-dm-sans text-sm font-semibold text-roamly-g0">{p.nome}</p>
                          {p.meta && (
                            <p className="font-dm-sans text-xs text-roamly-text/50">{p.meta}</p>
                          )}
                          <a
                            href={urlMaps(p.nome, p.lat, p.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1.5 font-dm-sans text-xs font-medium text-roamly-g2 hover:text-roamly-g1"
                          >
                            <ExternalLink size={11} />
                            Apri in Maps
                          </a>
                          <button
                            onClick={() => rimuoviLuogoSalvato(p.id)}
                            className="flex items-center gap-1 mt-1 font-dm-sans text-xs font-medium text-roamly-text/40 hover:text-roamly-text/60"
                          >
                            <Heart size={11} fill="currentColor" />
                            Rimuovi dai salvati
                          </button>
                        </div>
                      )}
                    </Popup>
                  </Marker>
                ))}

                {puntoRicerca && (
                  <Marker position={[puntoRicerca.lat, puntoRicerca.lng]} icon={iconaRicerca}>
                    <Popup>
                      <div className="p-3.5 flex flex-col gap-1.5 max-w-[200px]">
                        <p className="font-dm-sans text-sm font-semibold text-roamly-g0 line-clamp-2">
                          {puntoRicerca.label}
                        </p>
                        <button
                          onClick={() => handleMapClick(puntoRicerca.lat, puntoRicerca.lng)}
                          className="flex items-center gap-1 mt-1.5 font-dm-sans text-xs font-medium text-roamly-g2 hover:text-roamly-g1"
                        >
                          <MapPin size={11} />
                          Aggiungi come tappa
                        </button>
                        <button
                          onClick={salvaRisultatoRicerca}
                          className="flex items-center gap-1 mt-1 font-dm-sans text-xs font-medium text-roamly-coral hover:text-roamly-coral-dark"
                        >
                          <Heart size={11} />
                          Salva nei preferiti
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Ricerca "nella zona" + ciclo modalità — overlay sopra la mappa */}
              <div className="absolute left-4 right-4 top-4 z-[400] flex gap-2">
                <div className="relative flex-1">
                  <div className="flex items-center gap-2 h-11 px-3.5 rounded-full bg-white shadow-roamly-lg">
                    <Search size={15} className="text-roamly-text/40 shrink-0" />
                    <input
                      value={ricerca}
                      onChange={(e) => { setRicerca(e.target.value); setRicercaAperta(true) }}
                      onFocus={() => setRicercaAperta(true)}
                      onBlur={() => setTimeout(() => setRicercaAperta(false), 150)}
                      placeholder="Cerca nella zona"
                      autoComplete="off"
                      className="flex-1 min-w-0 bg-transparent outline-none font-dm-sans text-sm text-roamly-text placeholder:text-roamly-text/35"
                    />
                    {ricerca && (
                      <button onClick={() => setRicerca('')} className="shrink-0 text-roamly-text/30">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {ricercaAperta && ricercaDebounced.trim().length >= 3 && !cercando && risultatiRicerca.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-[400] bg-white rounded-2xl shadow-roamly-lg border border-roamly-g6 overflow-hidden max-h-52 overflow-y-auto">
                      {risultatiRicerca.map((r, i) => (
                        <button
                          key={`${r.lat}-${r.lng}-${i}`}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selezionaRicerca(r) }}
                          className="w-full flex items-start gap-2 px-3.5 py-2.5 text-left hover:bg-roamly-g7"
                        >
                          <MapPin size={13} className="text-roamly-g3 mt-0.5 shrink-0" />
                          <span className="font-dm-sans text-xs text-roamly-text leading-snug">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={ciclaModalita}
                  className="shrink-0 w-11 h-11 rounded-full bg-white shadow-roamly-lg font-dm-mono text-[9px] font-medium text-roamly-g2 leading-tight"
                  title={MODALITA_LABEL[modalita]}
                >
                  {MODALITA_SHORT[modalita]}
                </button>
              </div>

              {modalita !== 'oggi' && (
                <div className="absolute left-4 top-16 z-[400]">
                  <span className="px-3 py-1.5 rounded-full bg-roamly-g0/90 backdrop-blur-sm font-dm-sans text-xs font-medium text-white">
                    {MODALITA_LABEL[modalita]}
                  </span>
                </div>
              )}

              {tappeConPosizione.length === 0 && modalita === 'oggi' && (
                <div className="
                  absolute bottom-4 left-1/2 -translate-x-1/2
                  flex items-center gap-2 px-4 py-2.5
                  bg-white/95 backdrop-blur-sm rounded-full shadow-roamly-lg
                  pointer-events-none
                ">
                  <MapPin size={14} className="text-roamly-g3" />
                  <span className="font-dm-sans text-xs font-medium text-roamly-text/70">
                    Tocca la mappa per aggiungere una tappa
                  </span>
                </div>
              )}

              {tappeBase.length > 0 && tappeVisibili.length === 0 && modalita === 'oggi' && (
                <div className="
                  absolute bottom-4 left-1/2 -translate-x-1/2
                  flex items-center gap-2 px-4 py-2.5
                  bg-white/95 backdrop-blur-sm rounded-full shadow-roamly-lg
                  pointer-events-none
                ">
                  <MapPin size={14} className="text-roamly-g3" />
                  <span className="font-dm-sans text-xs font-medium text-roamly-text/70">
                    Tutti i giorni sono nascosti — riattivane uno dai filtri
                  </span>
                </div>
              )}

              {tappeConPosizione.length > 0 && tappeBase.length === 0 && modalita === 'oggi' && (
                <div className="
                  absolute bottom-4 left-1/2 -translate-x-1/2
                  flex items-center gap-2 px-4 py-2.5
                  bg-white/95 backdrop-blur-sm rounded-full shadow-roamly-lg
                  pointer-events-none
                ">
                  <EyeOff size={14} className="text-roamly-g3" />
                  <span className="font-dm-sans text-xs font-medium text-roamly-text/70">
                    Hai nascosto tutte le tappe — ripristinale qui sopra
                  </span>
                </div>
              )}

              {/* Bottom sheet — solo per "Salvati" e "Vicino a me" */}
              {modalita !== 'oggi' && (
                <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-[0_-8px_30px_-4px_rgba(12,42,61,0.18)] px-5 pt-2.5 pb-5 z-[400]">
                  <span className="block w-9 h-1 rounded-full bg-roamly-text/10 mx-auto mb-3" />

                  {puntiModalita.length === 0 ? (
                    <p className="font-dm-sans text-xs text-roamly-text/45 text-center py-2">
                      {modalita === 'salvati'
                        ? 'Nessun luogo salvato per questo viaggio — cercalo qui sopra e salvalo.'
                        : geoloc
                          ? 'Niente nelle vicinanze — allontana lo zoom o esplora la mappa.'
                          : 'Attivando la posizione ti mostro cosa hai vicino.'}
                    </p>
                  ) : (
                    <>
                      {chipSelezionato && (
                        <div className="flex items-center justify-between mb-2.5">
                          <p className="font-dm-sans text-sm font-semibold text-roamly-g0 truncate">
                            {puntiModalita.find((p) => p.id === chipSelezionato)?.nome}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {puntiModalita.map((p) => {
                          const attivo = p.id === chipSelezionato
                          return (
                            <button
                              key={p.id}
                              onClick={() => selezionaChip(p.id)}
                              className={`
                                shrink-0 flex flex-col items-start gap-0.5 px-3 py-2 rounded-2xl border
                                font-dm-sans text-xs font-medium transition-all duration-150
                                ${attivo
                                  ? 'bg-roamly-g0 border-roamly-g0 text-white'
                                  : 'bg-roamly-g7 border-roamly-g6 text-roamly-text'
                                }
                              `}
                            >
                              {p.meta && (
                                <span className={`font-dm-mono text-[10px] ${attivo ? 'text-white/55' : 'text-roamly-text/40'}`}>
                                  {p.meta}
                                </span>
                              )}
                              <span>{p.nome}</span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
