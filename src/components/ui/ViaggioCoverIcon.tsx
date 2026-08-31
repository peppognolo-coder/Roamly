import { COVER_ICON_MAP, DEFAULT_COVER_ICON_ID } from '@/lib/viaggio-cover-icons'

// ============================================================
// ViaggioCoverIcon — mostra l'icona copertina di un viaggio.
// Centralizza il fallback: se `value` è uno dei nuovi id icona
// (es. 'plane') renderizza l'icona Lucide; se è un'emoji letterale
// (viaggi creati prima di questa modifica) la mostra come testo,
// così i dati vecchi restano visivamente corretti senza migrazione.
// ============================================================

interface ViaggioCoverIconProps {
  value: string | null | undefined
  size?: number
  className?: string
}

export function ViaggioCoverIcon({ value, size = 20, className = '' }: ViaggioCoverIconProps) {
  const id = value ?? DEFAULT_COVER_ICON_ID
  const Icon = COVER_ICON_MAP[id]

  if (Icon) {
    return <Icon size={size} className={className} />
  }

  // Dato legacy: emoji letterale salvata prima di questa modifica
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }} className={className}>
      {value || '✈️'}
    </span>
  )
}
