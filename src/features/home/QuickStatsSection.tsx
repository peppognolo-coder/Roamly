import { Plane, NotebookPen, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// QuickStatsSection — tre statistiche rapide in Home
// Viaggi · Ricordi · Paesi
// ============================================================

interface QuickStatsSectionProps {
  viaggi: number
  ricordi: number
  paesi: number
  isLoading: boolean
}

export function QuickStatsSection({
  viaggi,
  ricordi,
  paesi,
  isLoading,
}: QuickStatsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="Viaggi"
        value={viaggi}
        icon={Plane}
        isLoading={isLoading}
      />
      <StatCard
        label="Ricordi"
        value={ricordi}
        icon={NotebookPen}
        isLoading={isLoading}
      />
      <StatCard
        label="Paesi"
        value={paesi}
        icon={Globe}
        isLoading={isLoading}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string
  value: number
  icon: LucideIcon
  isLoading: boolean
}) {
  return (
    <div className="
      flex flex-col items-center gap-1.5 py-3 px-2
      bg-white rounded-2xl
      shadow-roamly
    ">
      <Icon size={20} className="text-roamly-g3" />
      {isLoading ? (
        <div className="h-6 w-8 bg-roamly-g6 rounded animate-pulse" />
      ) : (
        <span className="font-dm-mono text-xl font-medium text-roamly-g0">
          {value}
        </span>
      )}
      <span className="font-dm-sans text-xs text-roamly-text/50">{label}</span>
    </div>
  )
}
