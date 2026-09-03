import { useParams, useNavigate } from 'react-router-dom'
import { Landmark, Trees, UtensilsCrossed, Car, PartyPopper, Sparkles, MapPin, Plus, Clock, ExternalLink } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys }    from '@/lib/queryKeys'
import { isoDateLocale } from '@/lib/viaggi-utils'
import type { CategoriaTappa, TappaViaggio } from '@/types'

// ============================================================
// ItinerarioPage — /viaggi/:id/itinerario
// Le tappe raggruppate per giorno, in ordine — "il percorso".
// Una tappa con giorno_fine diverso da giorno (multi-giorno)
// compare in ogni sezione dei giorni che copre.
// Stesso dato di Attività (mappa), vista diversa.
// ============================================================

const ICONE_CATEGORIA: Record<CategoriaTappa, LucideIcon> = {
  cultura:   Landmark,
  natura:    Trees,
  food:      UtensilsCrossed,
  svago:     PartyPopper,
  relax:     Sparkles,
  trasporto: Car,
  altro:     MapPin,
}

function formatGiorno(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const label = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatGiornoBreve(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

/** Tutti i giorni ISO coperti da una tappa: da `giorno` a `giorno_fine`
 *  incluso (o solo `giorno` se `giorno_fine` è assente/uguale). */
function giorniCoperti(t: TappaViaggio): string[] {
  if (!t.giorno) return []
  const fine = t.giorno_fine && t.giorno_fine > t.giorno ? t.giorno_fine : t.giorno
  const giorni: string[] = []
  const cursore = new Date(t.giorno + 'T00:00:00')
  const ultimo = new Date(fine + 'T00:00:00')
  while (cursore <= ultimo) {
    giorni.push(isoDateLocale(cursore))
    cursore.setDate(cursore.getDate() + 1)
  }
  return giorni
}

function urlMaps(indirizzo: string, lat?: number | null, lng?: number | null): string {
  const query = lat != null && lng != null ? `${lat},${lng}` : indirizzo
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function ItinerarioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: tappe = [], isLoading } = useTappe(viaggioId)

  useRealtimeSync('tappe_viaggio', 'viaggio_id', viaggioId, [queryKeys.tappe.byViaggio(viaggioId ?? '')])

  const giorniConTappe = Array.from(
    new Set(tappe.flatMap((t) => giorniCoperti(t)))
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
                  tappe={tappe.filter((t) => giorniCoperti(t).includes(giorno))}
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
          const multiGiorno = !!(t.giorno && t.giorno_fine && t.giorno_fine > t.giorno)
          return (
            <div
              key={t.id}
              className="
                flex items-center gap-3 p-3.5
                bg-white rounded-2xl shadow-roamly
                hover:shadow-roamly-lg transition-all duration-150
              "
            >
              <button
                onClick={() => onTap(t)}
                className="
                  flex items-center gap-3 flex-1 min-w-0 text-left
                  active:scale-[0.98] transition-transform duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-xl
                "
              >
                <div className="w-9 h-9 rounded-xl bg-roamly-g6 flex items-center justify-center text-roamly-g2 shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                    {t.nome}
                  </p>
                  {(t.ora || t.indirizzo || multiGiorno) && (
                    <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 truncate flex items-center gap-1">
                      {t.ora && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <Clock size={10} />
                          {t.ora.slice(0, 5)}
                        </span>
                      )}
                      {t.ora && multiGiorno && <span>·</span>}
                      {multiGiorno && (
                        <span className="shrink-0">
                          {formatGiornoBreve(t.giorno as string)} – {formatGiornoBreve(t.giorno_fine as string)}
                        </span>
                      )}
                      {(t.ora || multiGiorno) && t.indirizzo && <span>·</span>}
                      {t.indirizzo && <span className="truncate">{t.indirizzo}</span>}
                    </p>
                  )}
                </div>
              </button>

              {(t.indirizzo || (t.lat != null && t.lng != null)) && (
                <a
                  href={urlMaps(t.indirizzo ?? '', t.lat, t.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Apri in Maps"
                  className="
                    shrink-0 w-8 h-8 rounded-full
                    flex items-center justify-center
                    text-roamly-g3 hover:bg-roamly-g6
                    transition-colors duration-150
                  "
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
