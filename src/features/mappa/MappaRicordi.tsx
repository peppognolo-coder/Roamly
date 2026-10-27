import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@/styles/leaflet-overrides.css'
import type { RicordoMappa } from '@/services/ricordiService'

// ============================================================
// ROAMLY — MappaRicordi
// Mappa con un segnaposto per luogo e il numero dei ricordi. Luoghi
// vicini si fondono in uno solo quando si allontana la mappa (griglia
// che dipende dallo zoom, senza librerie esterne). Importata solo in
// modo lazy: Leaflet pesa.
// ============================================================

export interface GruppoLuogo {
  key: string
  nome: string
  lat: number
  lng: number
  ricordi: RicordoMappa[]
}

/** Raggruppa per celle di ~50 px: più si allontana la mappa, più i luoghi si fondono. */
export function raggruppa(ricordi: RicordoMappa[], zoom: number): GruppoLuogo[] {
  const cella = (360 / Math.pow(2, zoom)) * 0.2
  const celle = new Map<string, RicordoMappa[]>()
  for (const r of ricordi) {
    if (r.lat == null || r.lng == null) continue
    const k = `${Math.floor(Number(r.lat) / cella)}_${Math.floor(Number(r.lng) / cella)}`
    const a = celle.get(k)
    if (a) a.push(r)
    else celle.set(k, [r])
  }
  return [...celle.entries()].map(([key, rs]) => {
    const lat = rs.reduce((s, r) => s + Number(r.lat), 0) / rs.length
    const lng = rs.reduce((s, r) => s + Number(r.lng), 0) / rs.length
    // Nome: il luogo scritto più spesso, breve (prima della prima virgola)
    const conta = new Map<string, number>()
    for (const r of rs) {
      const n = r.luogo?.split(',')[0]?.trim()
      if (n) conta.set(n, (conta.get(n) ?? 0) + 1)
    }
    const nome = [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Luogo senza nome'
    return { key, nome, lat, lng, ricordi: rs }
  })
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function icona(n: number, nome: string, selezionato: boolean): L.DivIcon {
  const d = 28 + Math.min(n, 12) * 1.6
  const colore = selezionato ? '#0C2A3D' : '#FF6B4A'
  return L.divIcon({
    className: 'roamly-marker',
    html: `<div style="position:relative;width:${d}px;height:${d}px">
      <div style="width:${d}px;height:${d}px;border-radius:50%;background:${colore};border:2.5px solid #fff;
        box-shadow:0 2px 8px rgba(12,42,61,.35);display:flex;align-items:center;justify-content:center;
        color:#fff;font:700 12px 'DM Sans',sans-serif">${n}</div>
      <div style="position:absolute;top:${d + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;max-width:110px;
        overflow:hidden;text-overflow:ellipsis;font:600 10.5px 'DM Sans',sans-serif;color:#0C2A3D;
        text-shadow:0 0 3px #F4F9FC,0 0 3px #F4F9FC,0 0 3px #F4F9FC">${esc(nome)}</div></div>`,
    iconSize: [d, d],
    iconAnchor: [d / 2, d / 2],
  })
}

function Adatta({ ricordi }: { ricordi: RicordoMappa[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = ricordi.filter((r) => r.lat != null && r.lng != null).map((r) => [Number(r.lat), Number(r.lng)] as [number, number])
    if (pts.length === 0) return
    if (pts.length === 1) map.setView(pts[0], 13)
    else map.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 13 })
  }, [ricordi, map])
  return null
}

function Zoom({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
  useEffect(() => { onZoom(map.getZoom()) }, [map, onZoom])
  return null
}

function ChiudiAlTocco({ onTocco }: { onTocco: () => void }) {
  useMapEvents({ click: onTocco })
  return null
}

interface Props {
  ricordi: RicordoMappa[]
  selezionati: Set<string>
  onSeleziona: (g: GruppoLuogo | null) => void
}

export default function MappaRicordi({ ricordi, selezionati, onSeleziona }: Props) {
  const [zoom, setZoom] = useState(5)
  const gruppi = useMemo(() => raggruppa(ricordi, zoom), [ricordi, zoom])
  const primo = ricordi.find((r) => r.lat != null && r.lng != null)
  const centro: [number, number] = primo ? [Number(primo.lat), Number(primo.lng)] : [45.46, 9.19]

  return (
    <MapContainer
      center={centro}
      zoom={5}
      minZoom={2}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Adatta ricordi={ricordi} />
      <Zoom onZoom={setZoom} />
      <ChiudiAlTocco onTocco={() => onSeleziona(null)} />
      {gruppi.map((g) => (
        <Marker
          key={g.key}
          position={[g.lat, g.lng]}
          icon={icona(g.ricordi.length, g.nome, g.ricordi.some((r) => selezionati.has(r.id)))}
          eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onSeleziona(g) } }}
        />
      ))}
    </MapContainer>
  )
}
