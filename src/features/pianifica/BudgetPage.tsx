import { useParams, useNavigate } from 'react-router-dom'
import {
  Wallet, Plus, Plane, BedDouble, UtensilsCrossed, Ticket, ShoppingBag, MoreHorizontal,
  ArrowRight, CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useBudgetVoci, useBudgetPagamenti, useCreateBudgetPagamento } from '@/hooks/useBudget'
import { useMembriViaggio } from '@/hooks/useMembri'
import { useAuth } from '@/hooks/useAuth'
import { coloreIniziale } from '@/lib/avatar-utils'
import { calcolaSaldi, calcolaGiroConti } from '@/lib/budget-utils'
import type { CategoriaBudget } from '@/types'
import { CATEGORIA_BUDGET_OPTIONS } from '@/types'

// ============================================================
// BudgetPage — /viaggi/:id/budget
// Totale speso · Bilanci per persona (pagato + saldo, split sempre
// equo tra i membri) · Per pareggiare (settle-up, numero minimo di
// trasferimenti — vedi src/lib/budget-utils.ts) · Lista voci.
// ============================================================

const ICONE_CATEGORIA: Record<CategoriaBudget, LucideIcon> = {
  trasporto: Plane,
  alloggio:  BedDouble,
  food:      UtensilsCrossed,
  attivita:  Ticket,
  shopping:  ShoppingBag,
  altro:     MoreHorizontal,
}

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export function BudgetPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: voci = [], isLoading } = useBudgetVoci(viaggioId)
  const { data: membri = [] } = useMembriViaggio(viaggioId)
  const { data: pagamenti = [] } = useBudgetPagamenti(viaggioId)
  const { creaPagamento, isLoading: isSaldando } = useCreateBudgetPagamento(viaggioId ?? '')

  const totale = voci.reduce((sum, v) => sum + v.importo, 0)
  const condiviso = membri.length > 1

  const saldi = calcolaSaldi(
    voci,
    pagamenti,
    membri.map((m) => ({ userId: m.user_id, nome: m.display_name ?? 'Utente' }))
  ).sort((a, b) => b.pagato - a.pagato)

  const giroConti = condiviso ? calcolaGiroConti(saldi) : []

  const membroDi = (userId: string) => membri.find((m) => m.user_id === userId)
  const avatarDi = (userId: string, nome: string) => {
    const m = membroDi(userId)
    return m?.avatar_url ? (
      <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
    ) : (
      <span
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-dm-sans font-semibold text-white text-xs"
        style={{ background: coloreIniziale(nome) }}
      >
        {nome.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Budget" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {isLoading ? (
            <div className="h-20 bg-white rounded-2xl shadow-roamly animate-pulse" />
          ) : (
            <>
              {/* Totale speso */}
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-roamly p-4">
                <div className="w-10 h-10 rounded-xl bg-roamly-g6 flex items-center justify-center text-roamly-g2 shrink-0">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="font-dm-sans text-xs text-roamly-text/45">Totale speso</p>
                  <p className="font-dm-mono text-lg font-medium text-roamly-g0">
                    {formatEuro(totale)}
                  </p>
                </div>
              </div>

              {/* Bilanci — solo per viaggi condivisi */}
              {condiviso && totale > 0 && (
                <div className="flex flex-col gap-2.5 bg-white rounded-2xl shadow-roamly p-4">
                  <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/45">
                    Bilanci
                  </p>
                  {saldi.map((s) => {
                    const percentuale = totale > 0 ? (s.pagato / totale) * 100 : 0
                    const inPareggio = Math.abs(s.saldo) < 0.01
                    return (
                      <div key={s.userId} className="flex items-center gap-3">
                        {avatarDi(s.userId, s.nome)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-dm-sans text-sm text-roamly-text truncate">
                              {s.userId === user?.id ? 'Tu' : s.nome}
                              <span className="text-roamly-text/40"> · ha pagato {formatEuro(s.pagato)}</span>
                            </p>
                            <p
                              className={`font-dm-mono text-sm font-medium shrink-0 ${
                                inPareggio
                                  ? 'text-roamly-text/40'
                                  : s.saldo > 0
                                    ? 'text-emerald-600'
                                    : 'text-red-500'
                              }`}
                            >
                              {inPareggio
                                ? 'In pari'
                                : s.saldo > 0
                                  ? `+${formatEuro(s.saldo)}`
                                  : `-${formatEuro(Math.abs(s.saldo))}`}
                            </p>
                          </div>
                          <div className="h-1.5 bg-roamly-g6 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-roamly-g3 rounded-full"
                              style={{ width: `${percentuale}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Per pareggiare — settle-up, numero minimo di trasferimenti */}
              {condiviso && giroConti.length > 0 && (
                <div className="flex flex-col gap-2.5 bg-roamly-g0 rounded-2xl p-4">
                  <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-white/50">
                    Per pareggiare
                  </p>
                  {giroConti.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2 font-dm-sans text-sm text-white">
                        <span className="truncate">{t.daUserId === user?.id ? 'Tu' : t.daNome}</span>
                        <ArrowRight size={14} className="text-white/40 shrink-0" />
                        <span className="truncate">{t.aUserId === user?.id ? 'te' : t.aNome}</span>
                        <span className="font-dm-mono text-white/70 shrink-0 ml-auto mr-2">
                          {formatEuro(t.importo)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isSaldando}
                        onClick={() =>
                          creaPagamento({
                            viaggio_id: viaggioId ?? '',
                            da_user_id: t.daUserId,
                            a_user_id: t.aUserId,
                            importo: t.importo,
                          })
                        }
                        className="
                          flex items-center gap-1.5 px-3 py-1.5 shrink-0
                          bg-white/10 hover:bg-white/20 rounded-full
                          font-dm-sans text-xs font-medium text-white
                          transition-all duration-150
                          disabled:opacity-50
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                        "
                      >
                        <CheckCircle2 size={13} />
                        Segna come saldato
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Aggiungi spesa */}
          <button
            onClick={() => navigate(`/viaggi/${viaggioId}/budget/nuova`)}
            className="
              flex items-center justify-center gap-2 p-3.5
              bg-roamly-g0 rounded-2xl
              hover:opacity-90 active:scale-[0.98]
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            <Plus size={16} className="text-white" />
            <span className="font-dm-sans text-sm font-semibold text-white">
              Aggiungi spesa
            </span>
          </button>

          {/* Lista voci */}
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
            <div className="flex flex-col gap-2">
              {voci.map((v) => {
                const Icon = ICONE_CATEGORIA[v.categoria]
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
                    <div className="w-9 h-9 rounded-xl bg-roamly-g7 flex items-center justify-center text-roamly-g2 shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                        {v.nota || categoriaLabel}
                      </p>
                      <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate">
                        {[
                          categoriaLabel,
                          membri.length > 1 ? (autore?.display_name ?? 'Utente') : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="font-dm-mono text-sm text-roamly-text/70 shrink-0">
                      {formatEuro(v.importo)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
