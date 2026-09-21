import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Plus, ExternalLink } from 'lucide-react'
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
// Selettore giorni orizzontale + timeline verticale del giorno
// selezionato (schermata "Itinerario" del mockup) — prima si
// mostravano tutti i giorni impilati uno sotto l'altro, senza
// un giorno "a fuoco" e senza il linguaggio a timeline.
// Stesso dato di Attività (mappa), vista diversa.
// ============================================================

const LABEL_CATEGORIA: Record<CategoriaTappa, string> = {
  cultura:   'Cultura',
  natura:    'Natura',
  food:      'Food',
  svago:     'Svago',
  relax:     'Relax',
  trasporto: 'Trasporto',
  altro:     'Altro',
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

/** Etichetta per la pillola giorno: "gio" / "12" */
function labelPillola(iso: string): { dow: string; num: string } {
  const d = new Date(iso + 'T00:00:00')
  return {
    dow: d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', ''),
    num: String(d.getDate()),
  }
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
  const [giornoSelezionato, setGiornoSelezionato] = useState<string | null>(null)

  useRealtimeSync('tappe_viaggio', 'viaggio_id', viaggioId, [queryKeys.tappe.byViaggio(viaggioId ?? '')])

  const oggi = isoDateLocale(new Date())

  const giorniConTappe = Array.from(
    new Set(tappe.flatMap((t) => giorniCoperti(t)))
  ).sort()

  const tappeSenzaGiorno = tappe.filter((t) => !t.giorno)

  // Giorno "a fuoco": quello scelto dall'utente, altrimenti oggi se il
  // viaggio lo copre, altrimenti il primo giorno con tappe.
  const giornoAttivo = giornoSelezionato ?? (giorniConTappe.includes(oggi) ? oggi : giorniConTappe[0]) ?? null

  const tappeGiorno = giornoAttivo
    ? tappe
        .filter((t) => giorniCoperti(t).includes(giornoAttivo))
        .sort((a, b) => (a.ora ?? '99:99').localeCompare(b.ora ?? '99:99'))
    : []

  function handleAggiungi(giorno?: string) {
    const q = giorno ? `?giorno=${giorno}` : ''
    navigate(`/viaggi/${viaggioId}/tappe/nuova${q}`)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Itinerario" eyebrow={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

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
              {/* Selettore giorni — scroll orizzontale */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {giorniConTappe.map((giorno) => {
                  const label = labelPillola(giorno)
                  const selezionato = giorno === giornoAttivo
                  return (
                    <button
                      key={giorno}
                      onClick={() => setGiornoSelezionato(giorno)}
                      className={`
                        shrink-0 w-12 h-14 rounded-xl
                        flex flex-col items-center justify-center gap-0.5
                        border transition-colors duration-150
                        ${selezionato
                          ? 'bg-roamly-g0 border-roamly-g0 text-white'
                          : 'bg-white border-roamly-g5 text-roamly-g2 hover:border-roamly-g4'
                        }
                      `}
                    >
                      <span className={`font-dm-mono text-[9px] uppercase tracking-wide ${selezionato ? 'text-white/60' : 'text-roamly-text/40'}`}>
                        {label.dow}
                      </span>
                      <span className="font-dm-sans text-sm font-semibold">{label.num}</span>
                    </button>
                  )
                })}
              </div>

              {/* Giorno selezionato — intestazione + timeline */}
              {giornoAttivo && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="font-dm-sans text-sm font-semibold text-roamly-g0">
                      {formatGiorno(giornoAttivo)}
                    </h2>
                    <span className="font-dm-sans text-xs text-roamly-text/40">
                      {tappeGiorno.length} {tappeGiorno.length === 1 ? 'tappa' : 'tappe'}
                      {giornoAttivo === oggi ? ' · oggi' : ''}
                    </span>
                  </div>

                  {tappeGiorno.length === 0 ? (
                    <p className="font-dm-sans text-sm text-roamly-text/40 py-4 text-center">
                      Nessuna tappa per questo giorno.
                    </p>
                  ) : (
                    <TimelineTappe
                      tappe={tappeGiorno}
                      onTap={(t) => navigate(`/viaggi/${viaggioId}/tappe/${t.id}`)}
                    />
                  )}

                  <button
                    onClick={() => handleAggiungi(giornoAttivo)}
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
                </div>
              )}

              {/* Tappe senza giorno assegnato — fuori dal selettore */}
              {tappeSenzaGiorno.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-dm-sans text-sm font-semibold text-roamly-g0">
                      Senza giorno assegnato
                    </span>
                    <button
                      onClick={() => handleAggiungi()}
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
                    {tappeSenzaGiorno.map((t) => (
                      <TappaCard
                        key={t.id}
                        tappa={t}
                        onTap={() => navigate(`/viaggi/${viaggioId}/tappe/${t.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

// ------------------------------------------------------------
// TimelineTappe — linea verticale + pallino per tappa, come nel
// mockup: la prima tappa del giorno è "in evidenza" (pallino
// pieno), le altre sono ancora da vivere (pallino vuoto).
// ------------------------------------------------------------

function TimelineTappe({
  tappe,
  onTap,
}: {
  tappe: TappaViaggio[]
  onTap: (t: TappaViaggio) => void
}) {
  return (
    <div className="flex flex-col">
      {tappe.map((t, i) => (
        <div key={t.id} className="flex gap-3">
          {/* Linea + pallino */}
          <div className="flex flex-col items-center w-2.5 shrink-0 pt-4">
            <span
              className={`
                w-[9px] h-[9px] rounded-full shrink-0
                ${i === 0 ? 'bg-roamly-coral' : 'bg-white border-2 border-roamly-g4'}
              `}
            />
            {i < tappe.length - 1 && (
              <span className="w-px flex-1 bg-roamly-g5 mt-1" />
            )}
          </div>

          <div className="flex-1 min-w-0 pb-3">
            <TappaCard tappa={t} onTap={() => onTap(t)} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------
// TappaCard — riga singola tappa (ora · categoria, nome, dettaglio)
// ------------------------------------------------------------

function TappaCard({ tappa: t, onTap }: { tappa: TappaViaggio; onTap: () => void }) {
  const multiGiorno = !!(t.giorno && t.giorno_fine && t.giorno_fine > t.giorno)
  const dettaglio = [
    multiGiorno ? `${formatGiornoBreve(t.giorno as string)} – ${formatGiornoBreve(t.giorno_fine as string)}` : null,
    t.indirizzo,
  ].filter(Boolean).join(' · ')

  return (
    <div className="
      flex items-center gap-3 p-3.5
      bg-white rounded-2xl shadow-roamly
      hover:shadow-roamly-lg transition-all duration-150
    ">
      <button
        onClick={onTap}
        className="
          flex-1 min-w-0 text-left
          active:scale-[0.98] transition-transform duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-xl
        "
      >
        <p className="font-dm-mono text-[10.5px] font-medium uppercase tracking-wide">
          {t.ora && <span className="text-roamly-coral-dark">{t.ora.slice(0, 5)}</span>}
          {t.ora && <span className="text-roamly-text/25"> · </span>}
          <span className="text-roamly-text/40">{LABEL_CATEGORIA[t.categoria]}</span>
        </p>
        <p className="font-dm-sans text-sm font-semibold text-roamly-g0 mt-1 truncate">
          {t.nome}
        </p>
        {dettaglio && (
          <p className="font-dm-sans text-xs text-roamly-text/45 mt-0.5 truncate">
            {dettaglio}
          </p>
        )}
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
}
