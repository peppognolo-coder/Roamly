import type { StatoViaggio } from '@/types'

// ============================================================
// StatoBadge — chip visivo per lo stato di un viaggio
// Non conosce la logica di derivazione — riceve solo stato_effettivo
// ============================================================

interface StatoBadgeProps {
  stato: StatoViaggio
  size?: 'sm' | 'md'
}

const CONFIG: Record<StatoViaggio, { label: string; classes: string }> = {
  in_corso: {
    label: 'In corso',
    classes: 'bg-roamly-g3/15 text-roamly-g1 border-roamly-g3/30',
  },
  pianificato: {
    label: 'Pianificato',
    classes: 'bg-roamly-g6 text-roamly-g2 border-roamly-g5',
  },
  concluso: {
    label: 'Concluso',
    classes: 'bg-roamly-text/5 text-roamly-text/40 border-roamly-text/10',
  },
}

export function StatoBadge({ stato, size = 'sm' }: StatoBadgeProps) {
  const { label, classes } = CONFIG[stato]

  return (
    <span
      className={`
        inline-flex items-center
        border rounded-full font-dm-sans font-medium
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
        ${classes}
      `}
    >
      {stato === 'in_corso' && (
        <span className="w-1.5 h-1.5 rounded-full bg-roamly-g3 mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  )
}
