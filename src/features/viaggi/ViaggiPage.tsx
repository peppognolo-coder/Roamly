import { useNavigate } from 'react-router-dom'
import { Plane } from 'lucide-react'
import { PageLayout }  from '@/components/layout/PageLayout'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }   from '@/components/layout/BottomNav'
import { Button }      from '@/components/ui/Button'
import { ViaggioCard } from './ViaggioCard'
import { useViaggiPerStato } from '@/hooks/useViaggi'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ViaggiPage — /viaggi
// Lista completa raggruppata per stato:
//   1. In corso
//   2. Pianificati
//   3. Conclusi
// Empty state dedicato se non ci sono viaggi.
// ============================================================

export function ViaggiPage() {
  const navigate = useNavigate()
  const { grouped, isEmpty, isLoading } = useViaggiPerStato()

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-14 pb-4">
          <h1 className="font-lora text-2xl font-semibold text-roamly-g0">
            I miei viaggi
          </h1>
          <button
            onClick={() => navigate('/viaggi/nuovo')}
            className="
              flex items-center gap-1.5 px-3 py-2
              bg-roamly-g0 rounded-xl
              font-dm-sans text-sm font-medium text-white
              hover:bg-roamly-g1 active:scale-95
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuovo
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 px-5 pb-6">
          {isLoading ? (
            <SkeletonList />
          ) : isEmpty ? (
            <EmptyState onCrea={() => navigate('/viaggi/nuovo')} />
          ) : (
            <div className="flex flex-col gap-6">
              <SezioneStato
                titolo="In corso"
                viaggi={grouped.in_corso}
                accentClass="text-roamly-g1"
              />
              <SezioneStato
                titolo="Pianificati"
                viaggi={grouped.pianificato}
                accentClass="text-roamly-g2"
              />
              <SezioneStato
                titolo="Conclusi"
                viaggi={grouped.concluso}
                accentClass="text-roamly-text/40"
              />
            </div>
          )}
        </div>

      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// SezioneStato — sezione con titolo e lista viaggi
// Non renderizza nulla se la sezione è vuota
// ------------------------------------------------------------

function SezioneStato({
  titolo,
  viaggi,
  accentClass,
}: {
  titolo: string
  viaggi: ViaggioConStato[]
  accentClass: string
}) {
  if (viaggi.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className={`font-dm-sans text-xs font-semibold uppercase tracking-wider ${accentClass}`}>
        {titolo} · {viaggi.length}
      </h2>
      <div className="flex flex-col gap-2">
        {viaggi.map((v) => (
          <ViaggioCard key={v.id} viaggio={v} />
        ))}
      </div>
    </section>
  )
}

// ------------------------------------------------------------
// EmptyState — primo accesso o zero viaggi
// ------------------------------------------------------------

function EmptyState({ onCrea }: { onCrea: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-roamly-g7 shadow-roamly flex items-center justify-center">
        <Plane size={32} className="text-roamly-g3" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-lora text-xl font-semibold text-roamly-g0">
          Ogni grande avventura
        </h2>
        <p className="font-lora text-xl font-semibold text-roamly-g0">
          inizia con un primo passo.
        </p>
        <p className="font-dm-sans text-sm text-roamly-text/50 mt-1 leading-relaxed">
          Cerca la tua prossima meta,
          <br />
          pianificala, raccontala dopo.
        </p>
      </div>
      <Button onClick={onCrea} size="lg">
        Crea il tuo primo viaggio
      </Button>
    </div>
  )
}

// ------------------------------------------------------------
// SkeletonList — loading state
// ------------------------------------------------------------

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-roamly"
        >
          <div className="w-12 h-12 rounded-xl bg-roamly-g6 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 bg-roamly-g6 rounded animate-pulse w-2/3" />
            <div className="h-3 bg-roamly-g6 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
