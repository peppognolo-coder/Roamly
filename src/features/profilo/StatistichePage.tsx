import { useMemo } from 'react'
import { Plane, NotebookPen, Globe, Calendar, CalendarHeart, MapPinned } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useStatisticheUtente, useRicordiViaggioIds } from '@/hooks/useRicordi'
import { useViaggi } from '@/hooks/useViaggi'
import { calcolaStatistichePersonali } from '@/lib/statistiche-personali-utils'

// ============================================================
// StatistichePage — /profilo/statistiche
// Due sezioni:
//   1. Riepilogo complessivo (stessi dati di QuickStatsSection)
//   2. "I tuoi numeri" (Q2) — metriche derivate: viaggio più
//      lungo, mese con più partenze, meta con più ricordi
// ============================================================

export function StatistichePage() {
  const { data: stats, isLoading } = useStatisticheUtente()
  const { data: viaggi = [], isLoading: isLoadingViaggi } = useViaggi()
  const { data: ricordiViaggioIds = [], isLoading: isLoadingRicordi } = useRicordiViaggioIds()

  const isLoadingNumeri = isLoadingViaggi || isLoadingRicordi
  const numeri = useMemo(
    () => calcolaStatistichePersonali(viaggi, ricordiViaggioIds),
    [viaggi, ricordiViaggioIds]
  )

  const haNumeri = numeri.viaggioPiuLungo || numeri.mesePiuPartenze || numeri.metaPiuRicordi

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <PageHeader title="Le tue statistiche" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-6">

          <div className="flex flex-col gap-3">
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

          {/* I tuoi numeri — metriche derivate (Q2) */}
          {(isLoadingNumeri || haNumeri) && (
            <div className="flex flex-col gap-3">
              <p className="font-dm-sans text-xs font-semibold text-roamly-text/40 uppercase tracking-wider px-1">
                I tuoi numeri
              </p>

              {isLoadingNumeri ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white rounded-2xl shadow-roamly animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {numeri.viaggioPiuLungo && (
                    <NumeroCard
                      icon={Calendar}
                      titolo="Il tuo viaggio più lungo"
                      valore={`${numeri.viaggioPiuLungo.giorni} giorni`}
                      dettaglio={numeri.viaggioPiuLungo.nome}
                    />
                  )}
                  {numeri.mesePiuPartenze && (
                    <NumeroCard
                      icon={CalendarHeart}
                      titolo="Il tuo mese preferito per partire"
                      valore={numeri.mesePiuPartenze.mese}
                      dettaglio={`${numeri.mesePiuPartenze.count} ${numeri.mesePiuPartenze.count === 1 ? 'viaggio' : 'viaggi'}`}
                    />
                  )}
                  {numeri.metaPiuRicordi && (
                    <NumeroCard
                      icon={MapPinned}
                      titolo="La meta con più ricordi"
                      valore={numeri.metaPiuRicordi.nome}
                      dettaglio={`${numeri.metaPiuRicordi.count} ${numeri.metaPiuRicordi.count === 1 ? 'ricordo' : 'ricordi'}`}
                    />
                  )}
                </div>
              )}
            </div>
          )}

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

function NumeroCard({
  icon: Icon,
  titolo,
  valore,
  dettaglio,
}: {
  icon: LucideIcon
  titolo: string
  valore: string
  dettaglio: string
}) {
  return (
    <div className="flex items-center gap-3.5 bg-white rounded-2xl shadow-roamly p-4">
      <div className="w-11 h-11 rounded-xl bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g2">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-dm-sans text-xs text-roamly-text/45">{titolo}</p>
        <p className="font-lora text-base font-semibold text-roamly-g0 truncate">{valore}</p>
        <p className="font-dm-sans text-xs text-roamly-text/40">{dettaglio}</p>
      </div>
    </div>
  )
}
