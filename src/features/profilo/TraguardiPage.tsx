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
  const percentuale = traguardi.length > 0 ? Math.round((numPosseduti / traguardi.length) * 100) : 0

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="I tuoi traguardi" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {!isLoading && (
            <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl shadow-roamly">
              <div className="flex items-center justify-between">
                <p className="font-dm-sans text-sm font-medium text-roamly-g0">
                  {numPosseduti} su {traguardi.length} sbloccati
                </p>
                <span className="font-dm-mono text-sm font-medium text-roamly-g2">
                  {percentuale}%
                </span>
              </div>
              <div className="h-1.5 bg-roamly-g6 rounded-full overflow-hidden">
                <div
                  className="h-full bg-roamly-g3 rounded-full transition-all duration-300"
                  style={{ width: `${percentuale}%` }}
                />
              </div>
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

// Sbloccati = card scura in evidenza; da sbloccare = card chiara e
// discreta — stessa gerarchia del mockup (il traguardo raggiunto è
// "in vetrina", quello ancora da fare resta sullo sfondo). Niente
// barra di progresso per i non sbloccati: lo schema badge non porta
// una soglia/percentuale, quindi mostrarla vorrebbe dire inventarla.
function BadgeTile({ badge }: { badge: BadgeConStato }) {
  const Icon = (badge.icona && ICONE[badge.icona]) || Award

  return (
    <div
      className={`
        flex flex-col items-start text-left gap-2.5 p-4 rounded-2xl
        ${badge.posseduto
          ? 'bg-roamly-g0 shadow-roamly-lg'
          : 'bg-white shadow-roamly'
        }
      `}
    >
      <div
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center relative
          ${badge.posseduto ? 'bg-white/15' : 'bg-roamly-g6'}
        `}
      >
        <Icon size={18} className={badge.posseduto ? 'text-white' : 'text-roamly-text/35'} />
        {!badge.posseduto && (
          <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-roamly-g5 flex items-center justify-center">
            <Lock size={9} className="text-roamly-text/50" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className={`font-dm-sans text-sm font-semibold ${badge.posseduto ? 'text-white' : 'text-roamly-g0'}`}>
          {badge.nome}
        </p>
        <p className={`font-dm-sans text-xs leading-snug ${badge.posseduto ? 'text-white/55' : 'text-roamly-text/40'}`}>
          {badge.descrizione}
        </p>
      </div>

      {badge.posseduto && badge.earned_at && (
        <p className="font-dm-mono text-[10px] text-white/40 mt-0.5">
          {new Date(badge.earned_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}
