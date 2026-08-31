import { Plane, NotebookPen, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useStatisticheUtente } from '@/hooks/useRicordi'

// ============================================================
// StatistichePage — /profilo/statistiche
// Riepilogo complessivo dell'utente — stessi dati di
// QuickStatsSection (Home), qui in formato più ampio e dedicato.
// ============================================================

export function StatistichePage() {
  const { data: stats, isLoading } = useStatisticheUtente()

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <PageHeader title="Le tue statistiche" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-3">
          <StatRow
            icon={Plane}
            label="Viaggi pianificati o completati"
            value={stats?.viaggi}
            isLoading={isLoading}
          />
          <StatRow
            icon={NotebookPen}
            label="Ricordi scritti"
            value={stats?.ricordi}
            isLoading={isLoading}
          />
          <StatRow
            icon={Globe}
            label="Paesi visitati"
            value={stats?.paesi}
            isLoading={isLoading}
          />
        </div>

      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

function StatRow({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: LucideIcon
  label: string
  value: number | undefined
  isLoading: boolean
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow-roamly p-5">
      <div className="w-14 h-14 rounded-2xl bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g2">
        <Icon size={26} />
      </div>
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="h-8 w-12 bg-roamly-g6 rounded animate-pulse mb-1" />
        ) : (
          <p className="font-dm-mono text-3xl font-medium text-roamly-g0">
            {value ?? 0}
          </p>
        )}
        <p className="font-dm-sans text-sm text-roamly-text/50">
          {label}
        </p>
      </div>
    </div>
  )
}
