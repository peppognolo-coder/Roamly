import { Badge } from '@/components/ui/Badge'
import type { StatoViaggio } from '@/types'

// ============================================================
// StatoBadge — chip visivo per lo stato di un viaggio
// Non conosce la logica di derivazione — riceve solo stato_effettivo
// Wrapper sottile su Badge generico (src/components/ui/Badge.tsx)
// ============================================================

interface StatoBadgeProps {
  stato: StatoViaggio
  size?: 'sm' | 'md'
}

const CONFIG: Record<StatoViaggio, { label: string; variant: 'success' | 'info' | 'neutral' }> = {
  in_corso:    { label: 'In corso',    variant: 'success' },
  pianificato: { label: 'Pianificato', variant: 'info' },
  concluso:    { label: 'Concluso',    variant: 'neutral' },
}

export function StatoBadge({ stato, size = 'sm' }: StatoBadgeProps) {
  const { label, variant } = CONFIG[stato]

  return (
    <Badge variant={variant} size={size} dot={stato === 'in_corso'}>
      {label}
    </Badge>
  )
}
