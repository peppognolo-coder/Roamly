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
        emoji="✈️"
        isLoading={isLoading}
      />
      <StatCard
        label="Ricordi"
        value={ricordi}
        emoji="📝"
        isLoading={isLoading}
      />
      <StatCard
        label="Paesi"
        value={paesi}
        emoji="🌍"
        isLoading={isLoading}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  emoji,
  isLoading,
}: {
  label: string
  value: number
  emoji: string
  isLoading: boolean
}) {
  return (
    <div className="
      flex flex-col items-center gap-1.5 py-3 px-2
      bg-white rounded-2xl border border-roamly-g6
      shadow-sm shadow-roamly-g0/5
    ">
      <span className="text-xl">{emoji}</span>
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
