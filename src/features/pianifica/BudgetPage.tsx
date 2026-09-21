import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useBudgetVoci } from '@/hooks/useBudget'
import { useMembriViaggio } from '@/hooks/useMembri'
import { SettleUpCard } from './SettleUpCard'
import type { CategoriaBudget } from '@/types'
import { CATEGORIA_BUDGET_OPTIONS } from '@/types'

// ============================================================
// BudgetPage — /viaggi/:id/budget
// Totale del viaggio + quota a testa · Bilanci per persona + Per
// pareggiare (SettleUpCard, condiviso solo se il viaggio ha più
// membri — vedi src/lib/budget-utils.ts) · Ogni spesa.
// ============================================================

const BADGE_CATEGORIA: Record<CategoriaBudget, string> = {
  trasporto: 'TRA',
  alloggio:  'ALL',
  food:      'FOO',
  attivita:  'ATT',
  shopping:  'SHP',
  altro:     'ALT',
}

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

const formatDataBreve = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

export function BudgetPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: voci = [], isLoading } = useBudgetVoci(viaggioId)
  const { data: membri = [] } = useMembriViaggio(viaggioId)

  const totale = voci.reduce((sum, v) => sum + v.importo, 0)
  const condiviso = membri.length > 1

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Budget" eyebrow={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-28 flex flex-col gap-5">

          {isLoading ? (
            <div className="h-32 bg-white rounded-2xl shadow-roamly animate-pulse" />
          ) : condiviso ? (
            <SettleUpCard viaggioId={viaggioId ?? ''} />
          ) : (
            <div className="bg-white rounded-2xl shadow-roamly p-5">
              <p className="font-dm-sans text-xs text-roamly-text/45">Totale del viaggio</p>
              <p className="font-dm-mono text-[1.75rem] leading-tight font-semibold text-roamly-g0">
                {formatEuro(totale)}
              </p>
            </div>
          )}

          {/* Ogni spesa */}
          <div className="flex flex-col gap-2">
            {!isLoading && voci.length > 0 && (
              <div className="flex items-baseline justify-between px-1">
                <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/45">
                  Ogni spesa
                </p>
                <p className="font-dm-sans text-xs text-roamly-text/35">
                  {voci.length} {voci.length === 1 ? 'voce' : 'voci'}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white rounded-2xl shadow-roamly animate-pulse" />
                ))}
              </div>
            ) : voci.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-dm-sans text-sm text-roamly-text/40">
                  Nessuna spesa registrata ancora
                </p>
              </div>
            ) : (
              voci.map((v) => {
                const categoriaLabel = CATEGORIA_BUDGET_OPTIONS.find((o) => o.value === v.categoria)?.label
                const autore = membri.find((m) => m.user_id === v.user_id)

                return (
                  <button
                    key={v.id}
                    onClick={() => navigate(`/viaggi/${viaggioId}/budget/${v.id}`)}
                    className="
                      flex items-center gap-3 p-3.5
                      bg-white rounded-2xl shadow-roamly text-left
                      active:scale-[0.98] hover:shadow-roamly-lg
                      transition-all duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                    "
                  >
                    <div className="w-9 h-9 rounded-xl bg-roamly-g7 flex items-center justify-center shrink-0">
                      <span className="font-dm-mono text-[10px] font-semibold tracking-wide text-roamly-g1">
                        {BADGE_CATEGORIA[v.categoria]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                        {v.nota || categoriaLabel}
                      </p>
                      <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate">
                        {[
                          categoriaLabel,
                          condiviso ? (autore?.display_name ?? 'Utente') : null,
                          formatDataBreve(v.created_at),
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="font-dm-mono text-sm text-roamly-text/70 shrink-0">
                      {formatEuro(v.importo)}
                    </span>
                  </button>
                )
              })
            )}
          </div>

        </div>
      </div>

      {/* Aggiungi spesa — CTA fissa in fondo, come nel mockup */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-5 pt-3 pb-6 bg-gradient-to-t from-roamly-bg via-roamly-bg to-transparent">
        <button
          onClick={() => navigate(`/viaggi/${viaggioId}/budget/nuova`)}
          className="
            w-full flex items-center justify-center gap-2 h-[50px]
            bg-roamly-coral rounded-full
            shadow-[0_8px_24px_-6px_rgba(229,86,58,0.5)]
            hover:bg-roamly-coral-dark active:scale-[0.98]
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-coral-dark
          "
        >
          <Plus size={16} className="text-white" />
          <span className="font-dm-sans text-sm font-semibold text-white">
            Aggiungi spesa
          </span>
        </button>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
