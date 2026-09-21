// ============================================================
// QuickStatsSection — tre statistiche rapide in Home
// Viaggi · Ricordi · Paesi
// Tile semplici (numero + etichetta, nessuna icona) — come nel
// mockup, e coerenti con le NumeroTile di RecapViaggioPage.
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
    <div className="grid grid-cols-3 gap-2.5">
      <StatCard label="Viaggi" value={viaggi} isLoading={isLoading} />
      <StatCard label="Ricordi" value={ricordi} isLoading={isLoading} />
      <StatCard label="Paesi" value={paesi} isLoading={isLoading} />
    </div>
  )
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string
  value: number
  isLoading: boolean
}) {
  return (
    <div className="p-[15px] rounded-2xl bg-white shadow-roamly">
      {isLoading ? (
        <div className="h-[22px] w-8 bg-roamly-g6 rounded animate-pulse" />
      ) : (
        <p className="font-dm-mono text-[22px] font-semibold text-roamly-g0 leading-none">
          {value}
        </p>
      )}
      <p className="font-dm-sans text-[11.5px] leading-snug text-roamly-text/45 mt-1.5">
        {label}
      </p>
    </div>
  )
}
