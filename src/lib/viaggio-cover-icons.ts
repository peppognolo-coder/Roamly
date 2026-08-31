import {
  Plane, Globe, Palmtree, Mountain, Building2,
  TrainFront, Car, Backpack, Camera, Sunrise,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// ROAMLY — Icone copertina viaggio
// Sostituisce il vecchio picker a emoji (✈️🌍🏝️...) con icone
// Lucide, coerenti col resto dell'app.
//
// COMPATIBILITÀ: viaggi creati prima di questa modifica hanno
// ancora un'emoji letterale salvata in `cover_emoji` (es. '✈️').
// COVER_ICON_MAP contiene solo i nuovi id — il componente
// <ViaggioCoverIcon> gestisce il fallback per i dati vecchi.
// ============================================================

export const DEFAULT_COVER_ICON_ID = 'plane'

export interface CoverIconOption {
  value: string
  icon: LucideIcon
}

export const COVER_ICON_OPTIONS: CoverIconOption[] = [
  { value: 'plane',    icon: Plane },
  { value: 'globe',    icon: Globe },
  { value: 'palm',     icon: Palmtree },
  { value: 'mountain', icon: Mountain },
  { value: 'city',     icon: Building2 },
  { value: 'train',    icon: TrainFront },
  { value: 'car',      icon: Car },
  { value: 'backpack', icon: Backpack },
  { value: 'camera',   icon: Camera },
  { value: 'sunrise',  icon: Sunrise },
]

export const COVER_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  COVER_ICON_OPTIONS.map((o) => [o.value, o.icon])
)
