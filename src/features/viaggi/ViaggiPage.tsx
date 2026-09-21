import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Plus } from 'lucide-react'
import { PageLayout }  from '@/components/layout/PageLayout'
import { PageHeader }  from '@/components/layout/PageHeader'
import { AnimatedPage }       from '@/components/layout/AnimatedPage'
import { BottomNav }   from '@/components/layout/BottomNav'
import { Button }      from '@/components/ui/Button'
import { ViaggioCard } from './ViaggioCard'
import { useViaggiPerStato } from '@/hooks/useViaggi'

// ============================================================
// ViaggiPage — /viaggi
// Filtro a pillole (Tutti/In corso/Conclusi/In arrivo) sopra una
// lista unica — prima erano tre sezioni impilate (In corso/
// Pianificati/Conclusi) sempre tutte visibili, senza un modo per
// isolarne una. Ogni ViaggioCard porta già il proprio StatoBadge,
// quindi lo stato resta leggibile anche nella vista "Tutti".
// Empty state dedicato se non ci sono viaggi.
// ============================================================

type Filtro = 'tutti' | 'in_corso' | 'pianificato' | 'concluso'

const FILTRI: { id: Filtro; label: string }[] = [
  { id: 'tutti',       label: 'Tutti' },
  { id: 'in_corso',    label: 'In corso' },
  { id: 'concluso',    label: 'Conclusi' },
  { id: 'pianificato', label: 'In arrivo' },
]

export function ViaggiPage() {
  const navigate = useNavigate()
  const { grouped, isEmpty, isLoading } = useViaggiPerStato()
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const tutti = [...grouped.in_corso, ...grouped.pianificato, ...grouped.concluso]
  const viaggiFiltrati = filtro === 'tutti' ? tutti : grouped[filtro]

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <PageHeader title="I tuoi viaggi" variant="withBack" />

        {/* Content */}
        <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
          {isLoading ? (
            <SkeletonList />
          ) : isEmpty ? (
            <EmptyState onCrea={() => navigate('/viaggi/nuovo')} />
          ) : (
            <>
              {/* Filtro a pillole — scroll orizzontale */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {FILTRI.map((f) => {
                  const selezionato = f.id === filtro
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFiltro(f.id)}
                      className={`
                        shrink-0 px-3.5 py-1.5 rounded-full
                        font-dm-sans text-xs font-medium
                        border transition-colors duration-150
                        ${selezionato
                          ? 'bg-roamly-g0 border-roamly-g0 text-white'
                          : 'bg-white border-roamly-g5 text-roamly-g2 hover:border-roamly-g4'
                        }
                      `}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2">
                {viaggiFiltrati.map((v) => (
                  <ViaggioCard key={v.id} viaggio={v} />
                ))}
              </div>

              <button
                onClick={() => navigate('/viaggi/nuovo')}
                className="
                  flex items-center justify-center gap-1.5 py-3.5 rounded-2xl
                  border border-dashed border-roamly-g5
                  font-dm-sans text-sm font-medium text-roamly-g2
                  hover:bg-roamly-g7 transition-colors duration-150
                "
              >
                <Plus size={14} />
                Nuovo viaggio
              </button>
            </>
          )}
        </div>

      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
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
