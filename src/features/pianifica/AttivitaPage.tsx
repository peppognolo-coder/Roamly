import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Clock, Pencil } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import 'leaflet/dist/leaflet.css'
import '@/styles/leaflet-overrides.css'

// ============================================================
// AttivitaPage — /viaggi/:id/attivita
// Mappa con pin delle tappe. Tap su un pin → dettagli.
// Tap su un punto vuoto → crea una nuova tappa lì.
// Stesso dato di Itinerario (tappe_viaggio), vista diversa.
// ============================================================

const CENTRO_DEFAULT: [number, number] = [41.9028, 12.4964] // Roma

// Marker personalizzato — evita il problema noto delle icone
// PNG di default di Leaflet che si rompono nei bundle Vite.
const markerIcon = L.divIcon({
  className: 'roamly-marker',
  html: `
    <div style="
      width: 30px; height: 30px;
      background: #0F7EA8;
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

function AdattaAiConfini({ punti }: { punti: [number, number][] }) {
  const map = useMap()
  useMemo(() => {
    if (punti.length === 0) return
    if (punti.length === 1) {
      map.setView(punti[0], 14)
    } else {
      map.fitBounds(L.latLngBounds(punti), { padding: [40, 40] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function GestoreClick({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
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

  const tappeConPosizione = tappe.filter((t) => t.lat != null && t.lng != null)
  const punti: [number, number][] = tappeConPosizione.map((t) => [t.lat as number, t.lng as number])

  // Se non ci sono ancora tappe posizionate, prova a centrare sulla
  // posizione dell'utente (richiede permesso, nessun tracciamento).
  if (punti.length === 0 && !geoloc && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoloc([pos.coords.latitude, pos.coords.longitude]),
      () => { /* permesso negato o non disponibile — resta sul default */ },
      { timeout: 5000 }
    )
  }

  const centro = punti.length > 0 ? punti[0] : (geoloc ?? CENTRO_DEFAULT)

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
          <div className="flex-1 mx-5 mb-5 rounded-2xl overflow-hidden shadow-roamly relative">
            <MapContainer
              center={centro}
              zoom={punti.length > 0 ? 13 : 5}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AdattaAiConfini punti={punti} />
              <GestoreClick onClick={handleMapClick} />

              {tappeConPosizione.map((t) => (
                <Marker key={t.id} position={[t.lat as number, t.lng as number]} icon={markerIcon}>
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
          </div>
        )}
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
