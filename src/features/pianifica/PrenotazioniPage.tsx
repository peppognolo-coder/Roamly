import { useParams, useNavigate } from 'react-router-dom'
import {
  Plane, BedDouble, Landmark, Ticket, UtensilsCrossed, Stamp, MoreHorizontal,
  Plus, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { usePrenotazioni } from '@/hooks/usePrenotazioni'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys } from '@/lib/queryKeys'
import { TIPO_PRENOTAZIONE_OPTIONS } from '@/types'
import type { TipoPrenotazione, Prenotazione } from '@/types'

// ============================================================
// PrenotazioniPage — /viaggi/:id/prenotazioni
// Lista raggruppata per categoria (7 fisse) + totale speso.
// ============================================================

const ICONE_TIPO: Record<TipoPrenotazione, LucideIcon> = {
  trasporto: Plane,
  alloggio:  BedDouble,
  museo:     Landmark,
  evento:    Ticket,
  food:      UtensilsCrossed,
  visto:     Stamp,
  altro:     MoreHorizontal,
}

const STATO_STYLE: Record<Prenotazione['stato'], string> = {
  confermato: 'bg-roamly-g6 text-roamly-g1',
  in_attesa:  'bg-amber-100 text-amber-700',
  annullato:  'bg-roamly-text/5 text-roamly-text/40 line-through',
}

export function PrenotazioniPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: prenotazioni = [], isLoading } = usePrenotazioni(viaggioId)

  useRealtimeSync('wallet', 'viaggio_id', viaggioId, [queryKeys.prenotazioni.byViaggio(viaggioId ?? '')])

  const totaleSpeso = prenotazioni
    .filter((p) => p.stato !== 'annullato' && p.prezzo != null)
    .reduce((sum, p) => sum + (p.prezzo ?? 0), 0)

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Prenotazioni" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {/* Totale speso */}
          {!isLoading && prenotazioni.length > 0 && (
            <div className="flex items-center gap-3 bg-white rounded-2xl shadow-roamly p-4">
              <div className="w-10 h-10 rounded-xl bg-roamly-g6 flex items-center justify-center text-roamly-g2 shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <p className="font-dm-sans text-xs text-roamly-text/45">Totale speso</p>
                <p className="font-dm-mono text-lg font-medium text-roamly-g0">
                  {totaleSpeso.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : (
            TIPO_PRENOTAZIONE_OPTIONS.map((opt) => {
              const Icon = ICONE_TIPO[opt.value]
              const items = prenotazioni.filter((p) => p.tipo === opt.value)

              return (
                <div key={opt.value} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className="text-roamly-g3" />
                      <span className="font-dm-sans text-sm font-semibold text-roamly-g0">
                        {opt.label}
                      </span>
                      {items.length > 0 && (
                        <span className="font-dm-sans text-xs text-roamly-text/35">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/viaggi/${viaggioId}/prenotazioni/nuova?tipo=${opt.value}`)}
                      className="
                        flex items-center gap-1 px-2.5 py-1 rounded-full
                        font-dm-sans text-xs font-medium text-roamly-g2
                        hover:bg-roamly-g6 transition-colors duration-150
                        focus:outline-none focus-visible:ring-1 focus-visible:ring-roamly-g3
                      "
                    >
                      <Plus size={12} />
                      Aggiungi
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {items.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/viaggi/${viaggioId}/prenotazioni/${p.id}`)}
                          className="
                            flex items-center justify-between gap-3 p-3.5
                            bg-white rounded-2xl shadow-roamly text-left
                            active:scale-[0.98] hover:shadow-roamly-lg
                            transition-all duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                          "
                        >
                          <div className="min-w-0">
                            <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                              {p.nome}
                            </p>
                            <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate">
                              {[
                                p.dettaglio?.numero,
                                p.dettaglio?.da && p.dettaglio?.a
                                  ? `${p.dettaglio.da} → ${p.dettaglio.a}`
                                  : null,
                                p.data
                                  ? new Date(p.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
                                  : null,
                              ].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {p.prezzo != null && (
                              <span className="font-dm-mono text-sm text-roamly-text/70">
                                {p.prezzo.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full font-dm-sans text-[10px] font-medium ${STATO_STYLE[p.stato]}`}>
                              {p.stato === 'confermato' ? 'OK' : p.stato === 'in_attesa' ? 'In attesa' : 'Annullato'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
