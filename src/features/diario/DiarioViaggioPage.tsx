import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChevronRight, Plus, Map as MapIcon } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { StatoBadge } from '@/features/viaggi/StatoBadge'
import { RicordoCardDiario } from './RicordoCardDiario'
import { useViaggio } from '@/hooks/useViaggi'
import { useRicordi } from '@/hooks/useRicordi'
import { useCoverViaggio, useCoversByViaggio } from '@/hooks/useFoto'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys } from '@/lib/queryKeys'
import { raggruppaPeData } from '@/lib/diario-utils'
import { formatDataViaggio, gradienteCopertinaViaggio } from '@/lib/viaggi-utils'
import { useIndietro } from '@/hooks/useIndietro'

// ============================================================
// DiarioViaggioPage — /diario/:id
// Il diario di UN viaggio: copertina in alto (si sa sempre dove si
// è), poi i giorni in ordine cronologico con i ricordi in card
// grandi con foto.
// ============================================================

function numeroGiorno(dataISO: string, inizioISO: string | null): number | null {
  if (!inizioISO) return null
  const [y, m, d] = dataISO.split('-').map(Number)
  const [iy, im, id] = inizioISO.split('-').map(Number)
  const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(iy, im - 1, id).getTime()) / 86_400_000) + 1
  return diff >= 1 ? diff : null
}

export function DiarioViaggioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const indietro = useIndietro()

  const { data: viaggio, isLoading } = useViaggio(id)
  const { data: ricordi = [] } = useRicordi(id)
  const { data: coverUrl } = useCoverViaggio(id)
  const { data: covers, isLoading: caricoFoto } = useCoversByViaggio(id, 'card')

  useRealtimeSync('ricordi', 'viaggio_id', id, [queryKeys.ricordi.byViaggio(id ?? '')])

  // Cronologico: giorno 1 in alto, come si legge un diario
  const giorni = useMemo(() => [...raggruppaPeData(ricordi)].reverse(), [ricordi])

  if (isLoading || !viaggio) {
    return (
      <PageLayout>
        <div className="h-[260px] bg-roamly-g6 animate-pulse" />
      </PageLayout>
    )
  }

  const [chiaro, scuro] = gradienteCopertinaViaggio(viaggio.id)
  const luogo = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')

  return (
    <PageLayout>
      <AnimatedPage>
        <div className="flex flex-col">

          {/* Copertina */}
          <div className="relative h-[280px]" style={{ background: `linear-gradient(135deg, ${chiaro}, ${scuro})` }}>
            {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />

            <button
              type="button"
              onClick={indietro}
              aria-label="Torna al diario"
              className="absolute left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white
                flex items-center justify-center active:scale-95 transition-transform
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-white"><ViaggioCoverIcon value={viaggio.cover_emoji} size={20} /></span>
                <span className="rounded-full bg-white/90 backdrop-blur-sm"><StatoBadge stato={viaggio.stato_effettivo} size="sm" /></span>
              </div>
              <h1 className="font-lora text-[28px] leading-tight font-semibold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
                {viaggio.nome}
              </h1>
              <p className="font-dm-sans text-sm text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
                {[luogo, formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)].filter(Boolean).join(' · ')}
              </p>
              <p className="font-dm-mono text-[11px] text-white/70">
                {ricordi.length} {ricordi.length === 1 ? 'ricordo' : 'ricordi'}
                {giorni.length > 0 && ` · ${giorni.length} ${giorni.length === 1 ? 'giorno' : 'giorni'}`}
              </p>
            </div>
          </div>

          <div className="px-5 pt-4 pb-8 flex flex-col gap-6">

            {/* Azioni */}
            <div className="flex gap-2.5">
              {ricordi.length > 0 && (
                <button type="button" onClick={() => navigate(`/viaggi/${viaggio.id}/racconto`)}
                  className="flex-1 h-11 rounded-2xl bg-roamly-g0 text-white inline-flex items-center justify-center gap-1.5
                    font-dm-sans text-[13px] font-semibold active:scale-[0.98] transition-transform">
                  <BookOpen size={16} />
                  Racconto
                </button>
              )}
              <button type="button" onClick={() => navigate(`/viaggi/${viaggio.id}`)}
                className="flex-1 h-11 rounded-2xl bg-white border border-roamly-g5 text-roamly-g1 inline-flex items-center justify-center gap-1.5
                  font-dm-sans text-[13px] font-semibold active:scale-[0.98] transition-transform">
                <MapIcon size={16} />
                Il viaggio
              </button>
              <button type="button" onClick={() => navigate(`/nuovo-ricordo?viaggioId=${viaggio.id}`)}
                aria-label="Aggiungi un ricordo"
                className="w-11 h-11 rounded-2xl bg-roamly-coral text-white inline-flex items-center justify-center
                  active:scale-95 transition-transform">
                <Plus size={20} />
              </button>
            </div>

            {giorni.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="font-lora text-lg font-semibold text-roamly-g0">Nessun ricordo in questo viaggio</p>
                <p className="font-dm-sans text-sm text-roamly-text/50">Aggiungi il primo e inizia a raccontarlo.</p>
              </div>
            )}

            {/* Giorni */}
            {giorni.map((g) => {
              const n = numeroGiorno(g.data, viaggio.data_inizio)
              return (
                <section key={g.data} className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/viaggi/${viaggio.id}/giorno/${g.data}`)}
                    className="flex items-center gap-3 text-left group"
                    aria-label={`Apri il giorno ${g.dataFormattata}`}
                  >
                    {n && (
                      <span className="shrink-0 h-8 px-3 rounded-full bg-roamly-g0 text-white inline-flex items-center
                        font-dm-mono text-[11px] font-medium uppercase tracking-wide">
                        Giorno {n}
                      </span>
                    )}
                    <span className="flex-1 min-w-0 font-dm-mono text-[10px] uppercase tracking-widest text-roamly-g2 truncate">
                      {g.dataFormattata}
                    </span>
                    <ChevronRight size={16} className="text-roamly-text/25 shrink-0" />
                  </button>
                  <div className="flex flex-col gap-3">
                    {g.ricordi.map((r) =>
                      caricoFoto ? (
                        <div key={r.id} className="h-64 rounded-3xl bg-roamly-g6 animate-pulse" />
                      ) : (
                        <RicordoCardDiario key={r.id} ricordo={r} coverUrl={covers?.get(r.id) ?? null} />
                      )
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </AnimatedPage>
    </PageLayout>
  )
}
