import {
  Plane, Luggage, Users, NotebookPen, Globe, Camera, Award, Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useTraguardi } from '@/hooks/useBadges'
import type { BadgeConStato } from '@/types'

// ============================================================
// TraguardiPage — /profilo/traguardi
// Griglia di badge: posseduti a colori, da sbloccare in grigio.
// ============================================================

const ICONE: Record<string, LucideIcon> = {
  Plane, Luggage, Users, NotebookPen, Globe, Camera,
}

export function TraguardiPage() {
  const { data: traguardi, isLoading } = useTraguardi()

  const numPosseduti = traguardi.filter((t) => t.posseduto).length

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="I tuoi traguardi" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {!isLoading && (
            <div className="flex items-center gap-2 px-1">
              <Award size={16} className="text-roamly-g3" />
              <p className="font-dm-sans text-sm text-roamly-text/60">
                {numPosseduti} di {traguardi.length} sbloccati
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {traguardi.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} />
              ))}
            </div>
          )}

        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

function BadgeTile({ badge }: { badge: BadgeConStato }) {
  const Icon = (badge.icona && ICONE[badge.icona]) || Award

  return (
    <div
      className={`
        flex flex-col items-center text-center gap-2 p-4 rounded-2xl
        ${badge.posseduto
          ? 'bg-white shadow-roamly'
          : 'bg-roamly-g7 shadow-none'
        }
      `}
    >
      <div
        className={`
          w-12 h-12 rounded-2xl flex items-center justify-center relative
          ${badge.posseduto ? 'bg-roamly-g0' : 'bg-roamly-g6'}
        `}
      >
        <Icon size={22} className={badge.posseduto ? 'text-white' : 'text-roamly-text/25'} />
        {!badge.posseduto && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-roamly-g5 flex items-center justify-center">
            <Lock size={10} className="text-roamly-text/50" />
          </div>
        )}
      </div>

      <p className={`font-dm-sans text-sm font-semibold ${badge.posseduto ? 'text-roamly-g0' : 'text-roamly-text/40'}`}>
        {badge.nome}
      </p>
      <p className={`font-dm-sans text-xs leading-snug ${badge.posseduto ? 'text-roamly-text/50' : 'text-roamly-text/30'}`}>
        {badge.descrizione}
      </p>

      {badge.posseduto && badge.earned_at && (
        <p className="font-dm-mono text-[10px] text-roamly-text/30 mt-0.5">
          {new Date(badge.earned_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}
