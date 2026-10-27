import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, MapPin } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useRicordiMappa } from '@/hooks/useRicordi'
import { useViaggi } from '@/hooks/useViaggi'
import type { GruppoLuogo } from './MappaRicordi'

// Leaflet pesa: la mappa si scarica solo quando si apre questa pagina.
const MappaRicordi = lazy(() => import('./MappaRicordi'))

// ============================================================
// MappaRicordiPage — /mappa  (e /mappa?viaggio=ID)
// Tutti i ricordi con una posizione su una mappa sola. Si filtra per
// viaggio; toccando un luogo si apre l'elenco dei suoi ricordi.
// ============================================================

function formattaData(iso: string): { giorno: string; mese: string; esteso: string } {
  const d = new Date(iso + 'T00:00:00')
  return {
    giorno: String(d.getDate()),
    mese: d.toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''),
    esteso: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export function MappaRicordiPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filtro = params.get('viaggio') ?? 'tutti'
  const [selezione, setSelezione] = useState<GruppoLuogo | null>(null)

  const { data: ricordi = [], isLoading, isError } = useRicordiMappa()
  const { data: viaggi = [] } = useViaggi()

  // Solo i viaggi che hanno almeno un ricordo con posizione
  const viaggiConMappa = useMemo(() => {
    const ids = new Set(ricordi.map((r) => r.viaggio_id))
    return viaggi.filter((v) => ids.has(v.id))
  }, [ricordi, viaggi])

  const visibili = useMemo(
    () => (filtro === 'tutti' ? ricordi : ricordi.filter((r) => r.viaggio_id === filtro)),
    [ricordi, filtro],
  )

  const luoghi = useMemo(
    () => new Set(visibili.map((r) => `${Number(r.lat).toFixed(2)}_${Number(r.lng).toFixed(2)}`)).size,
    [visibili],
  )
  const nViaggi = useMemo(() => new Set(visibili.map((r) => r.viaggio_id)).size, [visibili])
  const selezionati = useMemo(() => new Set(selezione?.ricordi.map((r) => r.id) ?? []), [selezione])

  function scegli(id: string) {
    setSelezione(null)
    setParams(id === 'tutti' ? {} : { viaggio: id }, { replace: true })
  }

  const nomeViaggio = (id: string) => viaggi.find((v) => v.id === id)?.nome ?? ''

  return (
    <PageLayout>
      <AnimatedPage>
        <div className="flex flex-col min-h-screen">
          <PageHeader
            title="Mappa dei ricordi"
            variant="withBack"
            subtitle={
              isLoading
                ? undefined
                : `${visibili.length} ${visibili.length === 1 ? 'ricordo' : 'ricordi'} · ${luoghi} ${luoghi === 1 ? 'luogo' : 'luoghi'} · ${nViaggi} ${nViaggi === 1 ? 'viaggio' : 'viaggi'}`
            }
          />

          {viaggiConMappa.length > 1 && (
            <div className="px-5 pb-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Filtra per viaggio">
              {[{ id: 'tutti', nome: 'Tutti' }, ...viaggiConMappa].map((v) => {
                const attivo = filtro === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => scegli(v.id)}
                    aria-pressed={attivo}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full border font-dm-sans text-xs font-medium transition-colors
                      ${attivo ? 'bg-roamly-g0 border-roamly-g0 text-white' : 'bg-white border-roamly-g5 text-roamly-g0'}`}
                  >
                    {v.nome}
                  </button>
                )
              })}
            </div>
          )}

          <div className="px-5 pb-6">
            {isLoading && <div className="h-[60dvh] rounded-2xl bg-roamly-g6 animate-pulse" role="status" aria-label="Caricamento" />}

            {isError && (
              <p className="font-dm-sans text-sm text-red-500 text-center py-10">
                Impossibile caricare i ricordi. Riprova tra poco.
              </p>
            )}

            {!isLoading && !isError && visibili.length === 0 && (
              <div className="flex flex-col items-center text-center gap-3 py-14">
                <span className="w-12 h-12 rounded-full bg-roamly-g6 flex items-center justify-center text-roamly-g1">
                  <MapPin size={22} />
                </span>
                <p className="font-lora text-lg text-roamly-g0">Ancora nessun luogo sulla mappa</p>
                <p className="font-dm-sans text-sm text-roamly-muted max-w-[28ch]">
                  I ricordi compaiono qui quando gli aggiungi un luogo. Prova la prossima volta che ne scrivi uno.
                </p>
              </div>
            )}

            {!isLoading && !isError && visibili.length > 0 && (
              <div
                className="relative rounded-2xl overflow-hidden shadow-roamly bg-roamly-g6"
                style={{ height: 'max(380px, calc(100dvh - 330px))' }}
              >
                <Suspense fallback={<div className="w-full h-full animate-pulse" role="status" aria-label="Caricamento mappa" />}>
                  <MappaRicordi ricordi={visibili} selezionati={selezionati} onSeleziona={setSelezione} />
                </Suspense>

                <AnimatePresence>
                  {selezione && (
                    <motion.div
                      key="sheet"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                      role="dialog"
                      aria-label={`Ricordi a ${selezione.nome}`}
                      className="absolute left-0 right-0 bottom-0 z-[1000] bg-white rounded-t-3xl shadow-[0_-10px_30px_rgba(12,42,61,0.18)] flex flex-col max-h-[62%]"
                    >
                      <div className="w-9 h-1 rounded-full bg-roamly-g5 mx-auto mt-2" />
                      <div className="flex items-start justify-between gap-3 px-4 pt-2 pb-2">
                        <div className="min-w-0">
                          <h2 className="font-lora text-lg font-semibold text-roamly-g0 truncate">{selezione.nome}</h2>
                          <p className="font-dm-sans text-xs text-roamly-muted">
                            {selezione.ricordi.length} {selezione.ricordi.length === 1 ? 'ricordo' : 'ricordi'}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelezione(null)}
                          aria-label="Chiudi"
                          className="shrink-0 w-8 h-8 rounded-full bg-roamly-g7 text-roamly-g0 flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <ul className="overflow-y-auto px-4 pb-4 flex flex-col gap-1">
                        {selezione.ricordi.map((r) => {
                          const d = formattaData(r.data)
                          return (
                            <li key={r.id}>
                              <button
                                onClick={() => navigate(`/ricordi/${r.id}`)}
                                className="w-full flex items-center gap-3 py-2 text-left rounded-xl active:bg-roamly-g7"
                              >
                                <span className="shrink-0 w-12 h-12 rounded-xl bg-roamly-g6 text-roamly-g0 flex flex-col items-center justify-center leading-none">
                                  <span className="font-dm-sans text-base font-semibold">{d.giorno}</span>
                                  <span className="font-dm-mono text-[10px] uppercase mt-0.5">{d.mese}</span>
                                </span>
                                <span className="min-w-0">
                                  <span className="block font-dm-sans text-sm font-semibold text-roamly-g0 break-words">{r.titolo}</span>
                                  <span className="block font-dm-sans text-xs text-roamly-muted truncate">
                                    {d.esteso}{filtro === 'tutti' && nomeViaggio(r.viaggio_id) ? ` · ${nomeViaggio(r.viaggio_id)}` : ''}
                                  </span>
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </AnimatedPage>
    </PageLayout>
  )
}
