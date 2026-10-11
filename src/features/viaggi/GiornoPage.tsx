import { lazy, Suspense, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Clock, Route } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { RicordoCard } from '@/features/momenti/RicordoCard'
import { METEO_ICONE } from '@/features/momenti/ContestoRicordo'
import { useViaggio } from '@/hooks/useViaggi'
import { useRicordi } from '@/hooks/useRicordi'
import { useTappe } from '@/hooks/useTappe'
import { useCoversByViaggio } from '@/hooks/useFoto'
import { METEO_OPTIONS, MOOD_OPTIONS } from '@/types'
import { buildGiorno, dateDelViaggio, formatKm, parseISO } from '@/lib/giorno-utils'

// ============================================================
// GiornoPage — /viaggi/:id/giorno/:data
// Un giorno del viaggio in una schermata: com'è andata (umore,
// meteo, km), dove sei stato (mappa), cosa avevi in programma
// (tappe) e cosa ricordi (ricordi). Tutti i dati arrivano dalle
// query già in cache del viaggio — nessuna tabella nuova.
// ============================================================

const MappaPercorso = lazy(() => import('./MappaPercorso'))

export function GiornoPage() {
  const { id: viaggioId, data } = useParams<{ id: string; data: string }>()
  const navigate = useNavigate()

  const { data: viaggio } = useViaggio(viaggioId)
  const { data: ricordi = [], isLoading } = useRicordi(viaggioId)
  const { data: tappe = [] } = useTappe(viaggioId)
  const { data: covers } = useCoversByViaggio(viaggioId)

  const giorno = useMemo(
    () => (viaggio && data ? buildGiorno(viaggio, ricordi, tappe, data) : null),
    [viaggio, ricordi, tappe, data]
  )
  const date = useMemo(
    () => (viaggio ? dateDelViaggio(viaggio, ricordi, tappe) : []),
    [viaggio, ricordi, tappe]
  )

  if (!viaggio || !giorno || !data || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
        </div>
      </PageLayout>
    )
  }

  const idx = date.indexOf(data)
  const prec = idx > 0 ? date[idx - 1] : null
  const succ = idx >= 0 && idx < date.length - 1 ? date[idx + 1] : null
  const vai = (d: string) => navigate(`/viaggi/${viaggioId}/giorno/${d}`, { replace: true })

  const titolo = parseISO(data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  const moodLabel = MOOD_OPTIONS.find((m) => m.value === giorno.moodDominante)?.label
  const MeteoIcona = giorno.meteo ? METEO_ICONE[giorno.meteo] : null
  const meteoLabel = METEO_OPTIONS.find((m) => m.value === giorno.meteo)?.label
  const vuoto = giorno.ricordi.length === 0 && giorno.tappe.length === 0

  const stats: { val: string; label: string }[] = [
    { val: String(giorno.ricordi.length), label: giorno.ricordi.length === 1 ? 'ricordo' : 'ricordi' },
    ...(giorno.km > 0.05 ? [{ val: formatKm(giorno.km), label: 'percorsi' }] : []),
    ...(giorno.tappe.length ? [{ val: String(giorno.tappe.length), label: giorno.tappe.length === 1 ? 'tappa' : 'tappe' }] : []),
  ]

  return (
    <PageLayout>
      <AnimatedPage>
        <PageHeader
          variant="withBack"
          eyebrow={giorno.numeroGiorno ? `${viaggio.nome} · Giorno ${giorno.numeroGiorno}` : viaggio.nome}
          title={titolo.charAt(0).toUpperCase() + titolo.slice(1)}
          onBack={() => navigate(`/viaggi/${viaggioId}`)}
        />

        <div className="px-5 flex flex-col gap-6">

          {/* ── Com'è andata ── */}
          {(giorno.mood.length > 0 || MeteoIcona) && (
            <section className="bg-white rounded-3xl shadow-roamly p-4 flex items-center gap-4">
              {giorno.mood.length > 0 && (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex -space-x-2">
                    {giorno.mood.slice(0, 4).map((m) => (
                      <span key={m} className="rounded-full ring-2 ring-white">
                        <MoodIcon mood={m} size={40} title={MOOD_OPTIONS.find((o) => o.value === m)?.label} />
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="font-dm-sans text-[11px] uppercase tracking-wider text-roamly-muted">Umore del giorno</p>
                    <p className="font-lora text-base font-semibold text-roamly-g0 truncate">{moodLabel}</p>
                  </div>
                </div>
              )}
              {MeteoIcona && (
                <div className="ml-auto flex flex-col items-center gap-0.5 shrink-0 text-roamly-ink-soft">
                  <MeteoIcona size={22} strokeWidth={1.7} />
                  <span className="font-dm-sans text-[11px]">
                    {meteoLabel}{giorno.temperatura != null && <span className="font-dm-mono"> {giorno.temperatura}°</span>}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* ── Numeri ── */}
          {!vuoto && (
            <div className="flex gap-7 px-1">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="font-dm-mono text-xl font-bold text-roamly-g0 leading-none">{s.val}</span>
                  <span className="font-dm-sans text-xs text-roamly-muted">{s.label}</span>
                </div>
              ))}
              {giorno.compagni.length > 0 && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-dm-sans text-sm text-roamly-g0 truncate">{giorno.compagni.join(', ')}</span>
                  <span className="font-dm-sans text-xs text-roamly-muted">con te</span>
                </div>
              )}
            </div>
          )}

          {/* ── Mappa ── */}
          {giorno.punti.length > 0 && (
            <section className="flex flex-col gap-2">
              <Suspense fallback={<div className="h-[220px] rounded-2xl bg-roamly-g6 animate-pulse" />}>
                <MappaPercorso punti={giorno.punti} />
              </Suspense>
              <p className="font-dm-sans text-xs text-roamly-muted flex items-center gap-1.5">
                <Route size={12} />
                <span className="inline-block w-2 h-2 rounded-full bg-[#0F7EA8]" /> tappe
                <span className="inline-block w-2 h-2 rounded-full bg-roamly-coral ml-2" /> ricordi
              </p>
            </section>
          )}

          {/* ── In programma ── */}
          {giorno.tappe.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-ink-soft">In programma</h2>
              <div className="bg-white rounded-2xl shadow-roamly divide-y divide-roamly-g6">
                {giorno.tappe.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/viaggi/${viaggioId}/tappe/${t.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="font-dm-mono text-xs text-roamly-muted w-11 shrink-0 flex items-center gap-1">
                      {t.ora ? t.ora.slice(0, 5) : <Clock size={12} />}
                    </span>
                    <span className="font-dm-sans text-sm text-roamly-text flex-1 truncate">{t.nome}</span>
                    <ChevronRight size={16} className="text-roamly-g4 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Ricordi ── */}
          <section className="flex flex-col gap-2">
            <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-ink-soft">Ricordi</h2>
            {giorno.ricordi.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-roamly p-6 text-center flex flex-col gap-1.5">
                <p className="font-lora text-base font-semibold text-roamly-g0">Nessun ricordo, per ora</p>
                <p className="font-dm-sans text-sm text-roamly-muted">Cosa è successo in questo giorno? Anche una riga basta.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {giorno.ricordi.map((r) => (
                  <RicordoCard key={r.id} ricordo={r} coverUrl={covers?.get(r.id)} />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate(`/nuovo-ricordo?viaggioId=${viaggioId}&data=${data}`)}
              className="mt-1 h-12 rounded-2xl bg-roamly-coral text-white font-dm-sans font-semibold text-sm
                shadow-roamly-coral inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus size={18} /> Aggiungi un ricordo di questo giorno
            </button>
          </section>

          {/* ── Giorno prima / dopo ── */}
          <nav className="grid grid-cols-2 gap-3 pb-4" aria-label="Cambia giorno">
            <button
              type="button"
              disabled={!prec}
              onClick={() => prec && vai(prec)}
              className="h-11 rounded-2xl bg-white border border-roamly-g5 font-dm-sans text-sm text-roamly-ink-soft
                inline-flex items-center justify-center gap-1 disabled:opacity-35"
            >
              <ChevronLeft size={16} /> Giorno prima
            </button>
            <button
              type="button"
              disabled={!succ}
              onClick={() => succ && vai(succ)}
              className="h-11 rounded-2xl bg-white border border-roamly-g5 font-dm-sans text-sm text-roamly-ink-soft
                inline-flex items-center justify-center gap-1 disabled:opacity-35"
            >
              Giorno dopo <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </AnimatedPage>
    </PageLayout>
  )
}
