import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useBudgetVoci, useBudgetPagamenti, useCreateBudgetPagamento } from '@/hooks/useBudget'
import { useMembriViaggio } from '@/hooks/useMembri'
import { useAuth } from '@/hooks/useAuth'
import { coloreIniziale } from '@/lib/avatar-utils'
import { calcolaSaldi, calcolaGiroConti } from '@/lib/budget-utils'

// ============================================================
// SettleUpCard — Totale + Bilanci per persona + Per pareggiare.
// Stesso blocco usato in BudgetPage (sezione Spese) e nel tab
// Persone di ViaggioDetailPage — un solo posto da mantenere per
// la logica di calcolaSaldi/calcolaGiroConti e il relativo markup.
// Non renderizza nulla per viaggi non condivisi o senza spese.
// ============================================================

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

interface SettleUpCardProps {
  viaggioId: string
  /** 'completa' (default): Totale+Bilanci + Per pareggiare.
   *  'solo-pareggiare': solo la card scura, per contesti dove il
   *  totale/bilanci sono già mostrati altrove (es. BudgetPage). */
  variante?: 'completa' | 'solo-pareggiare'
}

export function SettleUpCard({ viaggioId, variante = 'completa' }: SettleUpCardProps) {
  const { user } = useAuth()
  const { data: voci = [], isLoading } = useBudgetVoci(viaggioId)
  const { data: membri = [] } = useMembriViaggio(viaggioId)
  const { data: pagamenti = [] } = useBudgetPagamenti(viaggioId)
  const { creaPagamento, isLoading: isSaldando } = useCreateBudgetPagamento(viaggioId)

  const totale = voci.reduce((sum, v) => sum + v.importo, 0)
  const condiviso = membri.length > 1
  const quota = condiviso ? totale / membri.length : 0

  if (isLoading || !condiviso || totale === 0) return null

  const saldi = calcolaSaldi(
    voci,
    pagamenti,
    membri.map((m) => ({ userId: m.user_id, nome: m.display_name ?? 'Utente' }))
  ).sort((a, b) => b.pagato - a.pagato)

  const giroConti = calcolaGiroConti(saldi)

  const membroDi = (userId: string) => membri.find((m) => m.user_id === userId)
  const avatarDi = (userId: string, nome: string) => {
    const m = membroDi(userId)
    return m?.avatar_url ? (
      <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
    ) : (
      <span
        className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-dm-sans font-semibold text-white text-xs"
        style={{ background: coloreIniziale(nome) }}
      >
        {nome.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <>
      {variante === 'completa' && (
        <div className="bg-white rounded-2xl shadow-roamly p-5 flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-dm-sans text-xs text-roamly-text/45">Totale del viaggio</p>
              <p className="font-dm-mono text-[1.75rem] leading-tight font-semibold text-roamly-g0">
                {formatEuro(totale)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-dm-mono text-sm text-roamly-text/60">{formatEuro(quota)}</p>
              <p className="font-dm-sans text-xs text-roamly-text/40">a testa</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-roamly-g6">
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
                      </p>
                      <p
                        className={`font-dm-mono text-sm font-medium shrink-0 ${
                          inPareggio
                            ? 'text-roamly-text/40'
                            : s.saldo > 0
                              ? 'text-roamly-g3'
                              : 'text-roamly-coral-dark'
                        }`}
                      >
                        {inPareggio
                          ? 'In pari'
                          : s.saldo > 0
                            ? `+ ${formatEuro(s.saldo)}`
                            : `− ${formatEuro(Math.abs(s.saldo))}`}
                      </p>
                    </div>
                    <div className="h-1.5 bg-roamly-g6 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${inPareggio ? 'bg-roamly-g5' : s.saldo > 0 ? 'bg-roamly-g3' : 'bg-roamly-coral'}`}
                        style={{ width: `${percentuale}%` }}
                      />
                    </div>
                    <p className="font-dm-sans text-xs text-roamly-text/35 mt-1">
                      ha pagato {formatEuro(s.pagato)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per pareggiare — un bottone per trasferimento: si salda uno alla
          volta, quando avviene davvero, non tutto in blocco con un unico tap. */}
      {giroConti.length > 0 && (
        <div className="flex flex-col gap-2.5 bg-roamly-g0 rounded-2xl p-4">
          <p className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-white/50">
            Per pareggiare
          </p>
          {giroConti.map((t, i) => (
            <div key={i} className="flex flex-col gap-2.5 bg-white/5 rounded-xl px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 flex items-center gap-2 font-dm-sans text-sm font-medium text-white">
                  <span className="truncate">{t.daUserId === user?.id ? 'Tu' : t.daNome}</span>
                  <ArrowRight size={14} className="text-white/40 shrink-0" />
                  <span className="truncate">{t.aUserId === user?.id ? 'te' : t.aNome}</span>
                </div>
                <span className="font-dm-mono text-sm text-white/80 shrink-0">
                  {formatEuro(t.importo)}
                </span>
              </div>
              <button
                type="button"
                disabled={isSaldando}
                onClick={() =>
                  creaPagamento({
                    viaggio_id: viaggioId,
                    da_user_id: t.daUserId,
                    a_user_id: t.aUserId,
                    importo: t.importo,
                  })
                }
                className="
                  flex items-center justify-center gap-1.5 py-2.5
                  bg-roamly-g5 hover:bg-roamly-g4 rounded-full
                  font-dm-sans text-xs font-semibold text-roamly-g0
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
  )
}
