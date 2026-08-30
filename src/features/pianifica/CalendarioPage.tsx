import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Clock, CalendarDays,
  Landmark, UtensilsCrossed, Car, PartyPopper, MapPin,
  Plane, BedDouble, Ticket, Stamp, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useViaggio }   from '@/hooks/useViaggi'
import { useTappe }     from '@/hooks/useTappe'
import { usePrenotazioni } from '@/hooks/usePrenotazioni'
import type { CategoriaTappa, TipoPrenotazione, TappaViaggio, Prenotazione } from '@/types'

// ============================================================
// CalendarioPage — /viaggi/:id/calendario
// Vista mensile con indicatori + agenda combinata di
// Tappe (tappe_viaggio) e Prenotazioni (wallet), ordinata per data.
// Nessuna tabella dedicata — è solo un'aggregazione lato client.
// ============================================================

const ICONE_TAPPA: Record<CategoriaTappa, LucideIcon> = {
  visita: Landmark, ristorante: UtensilsCrossed, trasporto: Car, svago: PartyPopper, altro: MapPin,
}
const ICONE_PRENOTAZIONE: Record<TipoPrenotazione, LucideIcon> = {
  trasporto: Plane, alloggio: BedDouble, museo: Landmark, evento: Ticket,
  food: UtensilsCrossed, visto: Stamp, altro: MoreHorizontal,
}

type EventoGiorno =
  | { kind: 'tappa'; data: TappaViaggio }
  | { kind: 'prenotazione'; data: Prenotazione }

const GIORNI_SETTIMANA = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function inizioSettimana(d: Date): Date {
  const giorno = (d.getDay() + 6) % 7 // 0 = lunedì
  const r = new Date(d)
  r.setDate(d.getDate() - giorno)
  return r
}

// Griglia 6x7 che copre sempre il mese intero + giorni di contorno
function generaGriglia(meseRiferimento: Date): Date[] {
  const primoDelMese = new Date(meseRiferimento.getFullYear(), meseRiferimento.getMonth(), 1)
  const inizio = inizioSettimana(primoDelMese)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inizio)
    d.setDate(inizio.getDate() + i)
    return d
  })
}

export function CalendarioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: tappe = [] } = useTappe(viaggioId)
  const { data: prenotazioni = [] } = usePrenotazioni(viaggioId)

  const eventiPerGiorno = useMemo(() => {
    const mappa = new Map<string, EventoGiorno[]>()
    for (const t of tappe) {
      if (!t.giorno) continue
      const lista = mappa.get(t.giorno) ?? []
      lista.push({ kind: 'tappa', data: t })
      mappa.set(t.giorno, lista)
    }
    for (const p of prenotazioni) {
      if (!p.data) continue
      const lista = mappa.get(p.data) ?? []
      lista.push({ kind: 'prenotazione', data: p })
      mappa.set(p.data, lista)
    }
    return mappa
  }, [tappe, prenotazioni])

  const meseIniziale = useMemo(() => {
    if (viaggio?.data_inizio) return new Date(viaggio.data_inizio + 'T00:00:00')
    const prime = [...eventiPerGiorno.keys()].sort()[0]
    return prime ? new Date(prime + 'T00:00:00') : new Date()
  }, [viaggio?.data_inizio, eventiPerGiorno])

  const [mese, setMese] = useState(meseIniziale)
  const [giornoSelezionato, setGiornoSelezionato] = useState<string | null>(null)

  const griglia = useMemo(() => generaGriglia(mese), [mese])

  const eventiVisibili: [string, EventoGiorno[]][] = giornoSelezionato
    ? [[giornoSelezionato, eventiPerGiorno.get(giornoSelezionato) ?? []]]
    : [...eventiPerGiorno.entries()].sort(([a], [b]) => a.localeCompare(b))

  function handleTapEvento(ev: EventoGiorno) {
    if (ev.kind === 'tappa') {
      navigate(`/viaggi/${viaggioId}/tappe/${ev.data.id}?from=itinerario`)
    } else {
      navigate(`/viaggi/${viaggioId}/prenotazioni/${ev.data.id}`)
    }
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Calendario" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {/* Navigazione mese */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth() - 1, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-roamly-g6 transition-colors"
            >
              <ChevronLeft size={18} className="text-roamly-text/60" />
            </button>
            <span className="font-lora text-base font-semibold text-roamly-g0 capitalize">
              {mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth() + 1, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-roamly-g6 transition-colors"
            >
              <ChevronRight size={18} className="text-roamly-text/60" />
            </button>
          </div>

          {/* Griglia mensile */}
          <div className="bg-white rounded-2xl shadow-roamly p-3">
            <div className="grid grid-cols-7 mb-1">
              {GIORNI_SETTIMANA.map((g, i) => (
                <div key={i} className="text-center font-dm-sans text-[10px] font-medium text-roamly-text/35 py-1">
                  {g}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {griglia.map((d, i) => {
                const iso = isoDate(d)
                const fuoriMese = d.getMonth() !== mese.getMonth()
                const haEventi = eventiPerGiorno.has(iso)
                const selezionato = giornoSelezionato === iso

                return (
                  <button
                    key={i}
                    onClick={() => setGiornoSelezionato(selezionato ? null : iso)}
                    disabled={fuoriMese}
                    className="flex flex-col items-center gap-0.5 py-1"
                  >
                    <span className={`
                      w-7 h-7 rounded-full flex items-center justify-center
                      font-dm-sans text-xs
                      transition-colors duration-150
                      ${fuoriMese ? 'text-roamly-text/15' : 'text-roamly-text/70'}
                      ${selezionato ? 'bg-roamly-g0 text-white font-medium' : ''}
                    `}>
                      {d.getDate()}
                    </span>
                    <span className={`w-1 h-1 rounded-full ${haEventi && !fuoriMese ? 'bg-roamly-g3' : 'bg-transparent'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agenda */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-dm-sans text-sm font-semibold text-roamly-g0">
                {giornoSelezionato
                  ? new Date(giornoSelezionato + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Tutto il viaggio'}
              </span>
              {giornoSelezionato && (
                <button
                  onClick={() => setGiornoSelezionato(null)}
                  className="font-dm-sans text-xs text-roamly-g2 hover:text-roamly-g1"
                >
                  Mostra tutti i giorni
                </button>
              )}
            </div>

            {eventiVisibili.every(([, evs]) => evs.length === 0) ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CalendarDays size={28} className="text-roamly-g3" />
                <p className="font-dm-sans text-sm text-roamly-text/45 max-w-[220px]">
                  {giornoSelezionato
                    ? 'Nessun evento in questo giorno.'
                    : 'Aggiungi tappe o prenotazioni con una data per vederle qui.'}
                </p>
              </div>
            ) : (
              eventiVisibili.map(([giorno, eventi]) => (
                eventi.length > 0 && (
                  <div key={giorno} className="flex flex-col gap-2">
                    {!giornoSelezionato && (
                      <p className="font-dm-sans text-xs font-medium text-roamly-text/40 px-1">
                        {new Date(giorno + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {eventi
                      .slice()
                      .sort((a, b) => {
                        const oraA = a.kind === 'tappa' ? a.data.ora : null
                        const oraB = b.kind === 'tappa' ? b.data.ora : null
                        return (oraA ?? '99:99').localeCompare(oraB ?? '99:99')
                      })
                      .map((ev) => {
                        const Icon = ev.kind === 'tappa'
                          ? ICONE_TAPPA[ev.data.categoria]
                          : ICONE_PRENOTAZIONE[ev.data.tipo]
                        const ora = ev.kind === 'tappa' ? ev.data.ora : null

                        return (
                          <button
                            key={`${ev.kind}-${ev.data.id}`}
                            onClick={() => handleTapEvento(ev)}
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
                                {ev.data.nome}
                              </p>
                              <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5 flex items-center gap-1">
                                {ora && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock size={10} />
                                    {ora.slice(0, 5)}
                                  </span>
                                )}
                                <span>{ev.kind === 'tappa' ? 'Tappa' : 'Prenotazione'}</span>
                              </p>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                )
              ))
            )}
          </div>

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
