import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/leaflet-overrides.css'
import type { PuntoMappa } from '@/lib/giorno-utils'

// ============================================================
// ROAMLY — MappaPercorso
// Mappa a sola lettura con i punti numerati di un giorno (o di
// tutto il viaggio) uniti da una linea tratteggiata. Corallo =
// ricordo, blu = tappa. Importata solo in modo lazy (Leaflet pesa).
// ============================================================

const cache = new Map<string, L.DivIcon>()

function icona(n: number, tipo: PuntoMappa['tipo']): L.DivIcon {
  const k = `${n}-${tipo}`
  const hit = cache.get(k)
  if (hit) return hit
  const colore = tipo === 'ricordo' ? '#FF6B4A' : '#0F7EA8'
  const i = L.divIcon({
    className: 'roamly-marker',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${colore};border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(12,42,61,.3);display:flex;align-items:center;justify-content:center;
      color:#fff;font:700 11px 'DM Sans',sans-serif">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
  cache.set(k, i)
  return i
}

function Adatta({ punti }: { punti: PuntoMappa[] }) {
  const map = useMap()
  useEffect(() => {
    if (punti.length === 1) map.setView([punti[0].lat, punti[0].lng], 14)
    else if (punti.length > 1) {
      map.fitBounds(L.latLngBounds(punti.map((p) => [p.lat, p.lng] as [number, number])), { padding: [36, 36] })
    }
  }, [punti, map])
  return null
}

interface Props {
  punti: PuntoMappa[]
  altezza?: number
  className?: string
}

export default function MappaPercorso({ punti, altezza = 220, className = '' }: Props) {
  if (punti.length === 0) return null
  const linea = punti.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <div className={`rounded-2xl overflow-hidden shadow-roamly ${className}`} style={{ height: altezza }}>
      <MapContainer
        center={linea[0]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
        dragging
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Adatta punti={punti} />
        {linea.length > 1 && (
          <Polyline positions={linea} pathOptions={{ color: '#2B8FB3', weight: 3, opacity: 0.8, dashArray: '2 8', lineCap: 'round' }} />
        )}
        {punti.map((p) => (
          <Marker key={`${p.tipo}-${p.id}`} position={[p.lat, p.lng]} icon={icona(p.ordine, p.tipo)} />
        ))}
      </MapContainer>
    </div>
  )
}
