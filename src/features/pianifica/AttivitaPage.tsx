import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Clock, Pencil, ExternalLink } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys }    from '@/lib/queryKeys'
import { cercaLuoghi }  from '@/lib/geocoding'
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
// ============================================================

const CENTRO_DEFAULT: [number, number] = [41.9028, 12.4964] // Roma

const SENZA_GIORNO = '__senza_giorno__'
const COLORE_SENZA_GIORNO = '#94A3B8'

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

function formatGiornoBreve(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const label = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
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
  // Priorità: tappe posizionate (adatta ai confini) > centro di
  // fallback (destinazione geocodificata, poi GPS) quando arriva in
  // modo asincrono > resta sul default iniziale se nessuno dei due
  // è ancora disponibile. Reagisce ai cambi perché — a differenza
  // dei props center/zoom di MapContainer, validi solo al mount —
  // qui usiamo l'API imperativa di Leaflet per spostare la mappa
  // anche dopo il primo render (es. quando risolve la geocodifica).
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
  const [geoloc, setGeoloc] = useState<[number, number] | null>(null)
  const [giorniNascosti, setGiorniNascosti] = useState<Set<string>>(new Set())

  useRealtimeSync('tappe_viaggio', 'viaggio_id', viaggioId, [queryKeys.tappe.byViaggio(viaggioId ?? '')])

  const tappeConPosizione = tappe.filter((t) => t.lat != null && t.lng != null)

  // Giorni distinti tra le tappe posizionate, in ordine — alimenta
  // sia la palette colori (indice = colore) sia i chip filtro.
  const giorniOrdinati = useMemo(
    () => Array.from(new Set(
      tappeConPosizione.filter((t) => t.giorno).map((t) => t.giorno as string)
    )).sort(),
    [tappeConPosizione]
  )
  const haSenzaGiorno = tappeConPosizione.some((t) => !t.giorno)
  const mostraFiltri = giorniOrdinati.length + (haSenzaGiorno ? 1 : 0) > 1

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

  const tappeVisibili = tappeConPosizione.filter((t) => !giorniNascosti.has(chiaveGiorno(t)))
  const punti: [number, number][] = tappeVisibili.map((t) => [t.lat as number, t.lng as number])

  // Centro di fallback quando il viaggio non ha ancora nessuna tappa
  // posizionata — priorità: destinazione del viaggio (geocodificata),
  // poi posizione GPS attuale, poi il default fisso (Roma).
  // Ha senso partire dalla destinazione perché un diario di viaggio
  // si pianifica spesso da casa, prima di partire — vedere la propria
  // posizione attuale non aiuterebbe a piazzare le tappe.
  const queryDestinazione = (viaggio?.destinazione || viaggio?.paese || '').trim()

  const { data: risultatiDestinazione } = useQuery({
    queryKey: queryKeys.geocoding.search(queryDestinazione.toLowerCase()),
    queryFn: ({ signal }) => cercaLuoghi(queryDestinazione, signal),
    enabled: tappeConPosizione.length === 0 && queryDestinazione.length >= 3,
    staleTime: 1000 * 60 * 60, // 1h — la destinazione di un viaggio non cambia in sessione
    retry: false,
  })
  const centroDestinazione: [number, number] | null = risultatiDestinazione?.[0]
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

  const centroFallback = centroDestinazione ?? geoloc
  const centro = punti.length > 0 ? punti[0] : (centroFallback ?? CENTRO_DEFAULT)
  const zoomIniziale = punti.length > 0 ? 13 : (centroFallback ? 12 : 5)

  function handleMapClick(lat: number, lng: number) {
    navigate(`/viaggi/${viaggioId}/tappe/nuova?from=attivita&lat=${lat}&lng=${lng}`)
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
                <PosizionaMappa punti={punti} centroFallback={centroFallback} zoomFallback={12} />
                <GestoreClick onClick={handleMapClick} />

                {tappeVisibili.map((t) => (
                  <Marker
                    key={t.id}
                    position={[t.lat as number, t.lng as number]}
                    icon={iconaPerColore(coloreTappa(t))}
                  >
                    <Popup>
                      <div className="p-3.5 flex flex-col gap-1.5">
                        <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
                          {t.nome}
                        </p>
                        {(t.ora || t.indirizzo) && (
                          <p className="font-dm-sans text-xs text-roamly-text/50 flex items-center gap-1">
                            {t.ora && (
                              <span className="flex items-center gap-0.5">
                                <Clock size={10} />
                                {t.ora.slice(0, 5)}
                              </span>
                            )}
                            {t.indirizzo}
                          </p>
                        )}
                        <button
                          onClick={() => navigate(`/viaggi/${viaggioId}/tappe/${t.id}?from=attivita`)}
                          className="
                            flex items-center gap-1 mt-1.5
                            font-dm-sans text-xs font-medium text-roamly-g2
                            hover:text-roamly-g1
                          "
                        >
                          <Pencil size={11} />
                          Modifica
                        </button>
                        <a
                          href={urlMaps(t.indirizzo ?? '', t.lat, t.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            flex items-center gap-1 mt-1
                            font-dm-sans text-xs font-medium text-roamly-g2
                            hover:text-roamly-g1
                          "
                        >
                          <ExternalLink size={11} />
                          Apri in Maps
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {tappeConPosizione.length === 0 && (
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

              {tappeConPosizione.length > 0 && tappeVisibili.length === 0 && (
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
            </div>
          </>
        )}
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
