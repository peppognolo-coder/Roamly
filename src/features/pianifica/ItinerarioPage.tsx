import { useParams, useNavigate } from 'react-router-dom'
import { Landmark, UtensilsCrossed, Car, PartyPopper, MapPin, Plus, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys }    from '@/lib/queryKeys'
import type { CategoriaTappa, TappaViaggio } from '@/types'

// ============================================================
// ItinerarioPage — /viaggi/:id/itinerario
// Le tappe raggruppate per giorno, in ordine — "il percorso".
// Stesso dato di Attività (mappa), vista diversa.
// ============================================================

const ICONE_CATEGORIA: Record<CategoriaTappa, LucideIcon> = {
  visita:     Landmark,
  ristorante: UtensilsCrossed,
  trasporto:  Car,
  svago:      PartyPopper,
  altro:      MapPin,
}

function formatGiorno(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const label = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function ItinerarioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: tappe = [], isLoading } = useTappe(viaggioId)

  useRealtimeSync('tappe_viaggio', 'viaggio_id', viaggioId, [queryKeys.tappe.byViaggio(viaggioId ?? '')])

  const giorniConTappe = Array.from(
    new Set(tappe.filter((t) => t.giorno).map((t) => t.giorno as string))
  ).sort()

  const tappeSenzaGiorno = tappe.filter((t) => !t.giorno)

  function handleAggiungi(giorno?: string) {
    const q = giorno ? `?giorno=${giorno}` : ''
    navigate(`/viaggi/${viaggioId}/tappe/nuova${q}`)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Itinerario" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-6">

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : tappe.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-roamly-g7 shadow-roamly flex items-center justify-center">
                <MapPin size={28} className="text-roamly-g3" />
              </div>
              <p className="font-dm-sans text-sm text-roamly-text/50 max-w-[240px]">
                Nessuna tappa ancora. Aggiungi la prima o segnala i posti sulla mappa in Attività.
              </p>
              <button
                onClick={() => handleAggiungi()}
                className="
                  flex items-center gap-1.5 px-4 py-2 rounded-full
                  bg-roamly-g0 text-white
                  font-dm-sans text-sm font-medium
                  hover:bg-roamly-g1 active:scale-[0.98] transition-all duration-150
                "
              >
                <Plus size={14} />
                Aggiungi tappa
              </button>
            </div>
          ) : (
            <>
              {giorniConTappe.map((giorno) => (
                <GiornoSezione
                  key={giorno}
                  titolo={formatGiorno(giorno)}
                  tappe={tappe.filter((t) => t.giorno === giorno)}
                  onAggiungi={() => handleAggiungi(giorno)}
                  onTap={(t) => navigate(`/viaggi/${viaggioId}/tappe/${t.id}`)}
                />
              ))}

              {tappeSenzaGiorno.length > 0 && (
                <GiornoSezione
                  titolo="Senza giorno assegnato"
                  tappe={tappeSenzaGiorno}
                  onAggiungi={() => handleAggiungi()}
                  onTap={(t) => navigate(`/viaggi/${viaggioId}/tappe/${t.id}`)}
                />
              )}

              <button
                onClick={() => handleAggiungi()}
                className="
                  flex items-center justify-center gap-1.5 py-3 rounded-2xl
                  border border-dashed border-roamly-g5
                  font-dm-sans text-sm font-medium text-roamly-g2
                  hover:bg-roamly-g7 transition-colors duration-150
                "
              >
                <Plus size={14} />
                Aggiungi tappa
              </button>
            </>
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

function GiornoSezione({
  titolo,
  tappe,
  onAggiungi,
  onTap,
}: {
  titolo: string
  tappe: TappaViaggio[]
  onAggiungi: () => void
  onTap: (t: TappaViaggio) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="font-dm-sans text-sm font-semibold text-roamly-g0">
          {titolo}
        </span>
        <button
          onClick={onAggiungi}
          className="
            flex items-center gap-1 px-2.5 py-1 rounded-full
            font-dm-sans text-xs font-medium text-roamly-g2
            hover:bg-roamly-g6 transition-colors duration-150
          "
        >
          <Plus size={12} />
          Aggiungi
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tappe.map((t) => {
          const Icon = ICONE_CATEGORIA[t.categoria]
          return (
            <button
              key={t.id}
              onClick={() => onTap(t)}
              className="
                flex items-center gap-3 p-3.5
                bg-white rounded-2xl shadow-roamly text-left
                active:scale-[0.98] hover:shadow-roamly-lg
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
              "
            >
              <div className="w-9 h-9 rounded-xl bg-roamly-g6 flex items-center justify-center text-roamly-g2 shrink-0">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                  {t.nome}
                </p>
                {(t.ora || t.indirizzo) && (
                  <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate flex items-center gap-1">
                    {t.ora && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {t.ora.slice(0, 5)}
                      </span>
                    )}
                    {t.ora && t.indirizzo && <span>·</span>}
                    {t.indirizzo}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
