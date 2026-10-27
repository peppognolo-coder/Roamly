import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MapPin, Search, X } from 'lucide-react'
import { PageLayout }            from '@/components/layout/PageLayout'
import { FiltriBar }             from './FiltriBar'
import { VolumeViaggioCard }     from './VolumeViaggioCard'
import { RicordoCardDiario }     from './RicordoCardDiario'
import { DiarioVuoto, DiarioVuotoConFiltri } from './TimelineVuota'
import { useDiario }             from '@/hooks/useDiario'
import { useFiltriDiario }       from '@/hooks/useFiltriDiario'
import { haFiltriAttivi }        from '@/lib/diario-utils'

// ============================================================
// DiarioPage — /diario
// Due livelli, per non perdersi quando i viaggi crescono:
//   1. questa pagina: i viaggi come "volumi" (copertina, ricordi,
//      miniature), raggruppati per anno; la lente apre ricerca e filtri.
//      (Il "Ricordo del giorno" vive solo in Home.)
//   2. /diario/:id: il diario del singolo viaggio (DiarioViaggioPage).
// Con ricerca/filtri attivi si vede un elenco unico di ricordi, ognuno
// con l'etichetta del suo viaggio.
// ============================================================

export function DiarioPage() {
  const { filtri, ricercaInput, setRicercaInput, toggleMood, togglePreferiti, toggleAutore, resetFiltri } = useFiltriDiario()

  const {
    sezioni,
    isLoading,
    isEmpty,
    isEmptyConFiltri,
    totaleFiltrati,
    totaleRicordi,
    haViaggi,
    autoriDisponibili,
  } = useDiario(filtri)

  const navigate = useNavigate()
  const [cercaAperta, setCercaAperta] = useState(false)
  const filtriAttivi = haFiltriAttivi(filtri)
  const inRicerca = cercaAperta || filtriAttivi

  const nomeViaggio = (viaggioId: string) => sezioni.find((s) => s.viaggio.id === viaggioId)?.viaggio.nome

  // Elenco unico (ricerca/filtri): tutti i ricordi filtrati, più recenti prima
  const risultati = useMemo(() => {
    if (!inRicerca) return []
    return sezioni
      .flatMap((s) => s.giorni.flatMap((g) => g.ricordi))
      .sort((a, b) => b.data.localeCompare(a.data) || b.created_at.localeCompare(a.created_at))
  }, [sezioni, inRicerca])

  // Viaggi raggruppati per anno (già ordinati dal più recente)
  const perAnno = useMemo(() => {
    const mappa = new Map<string, typeof sezioni>()
    for (const s of sezioni) {
      const anno = s.viaggio.data_inizio?.slice(0, 4) ?? 'Senza data'
      mappa.set(anno, [...(mappa.get(anno) ?? []), s])
    }
    return Array.from(mappa.entries())
  }, [sezioni])

  function chiudiRicerca() {
    resetFiltri()
    setRicercaInput('')
    setCercaAperta(false)
  }

  return (
    <PageLayout>
      <div className="flex flex-col min-h-screen">

        {/* ── Header ── */}
        <header className="sticky top-0 z-30 bg-roamly-bg/95 backdrop-blur-sm px-5 pt-14 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-lora text-h1 text-roamly-g0">Il tuo diario</h1>
            {!isLoading && !isEmpty && (
              <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/mappa')}
                aria-label="Mappa dei ricordi"
                className="w-10 h-10 rounded-full bg-roamly-g7 text-roamly-g1 flex items-center justify-center
                  active:scale-95 transition-transform
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
              >
                <MapPin size={18} />
              </button>
              <button
                type="button"
                onClick={() => (inRicerca ? chiudiRicerca() : setCercaAperta(true))}
                aria-label={inRicerca ? 'Chiudi la ricerca' : 'Cerca nei ricordi'}
                className="w-10 h-10 rounded-full bg-roamly-g7 text-roamly-g1 flex items-center justify-center
                  active:scale-95 transition-transform
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
              >
                {inRicerca ? <X size={18} /> : <Search size={18} />}
              </button>
              </div>
            )}
          </div>

          {inRicerca && (
            <div className="mt-3">
              <FiltriBar
                filtri={filtri}
                ricercaInput={ricercaInput}
                onRicercaChange={setRicercaInput}
                onToggleMood={toggleMood}
                onTogglePreferiti={togglePreferiti}
                onToggleAutore={toggleAutore}
                onReset={resetFiltri}
                totaleFiltrati={totaleFiltrati}
                totaleRicordi={totaleRicordi}
                autoriDisponibili={autoriDisponibili}
              />
            </div>
          )}
        </header>

        {/* ── Caricamento ── */}
        {isLoading && (
          <div className="flex-1 px-5 pt-2 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-white shadow-roamly">
                <div className="h-[150px] bg-roamly-g6 animate-pulse" />
                <div className="h-16 p-4"><div className="h-4 w-1/3 bg-roamly-g6 rounded animate-pulse" /></div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && isEmpty && <DiarioVuoto haViaggi={haViaggi} />}

        {/* ── Ricerca / filtri: elenco unico con etichetta del viaggio ── */}
        {!isLoading && !isEmpty && inRicerca && (
          isEmptyConFiltri || (filtriAttivi && risultati.length === 0) ? (
            <DiarioVuotoConFiltri onReset={chiudiRicerca} />
          ) : (
            <div className="flex-1 px-5 pt-2 pb-8 flex flex-col gap-3">
              {risultati.map((r) => (
                <RicordoCardDiario key={r.id} ricordo={r} viaggioNome={nomeViaggio(r.viaggio_id)} />
              ))}
            </div>
          )
        )}

        {/* ── Vista normale: da riscoprire + viaggi per anno ── */}
        {!isLoading && !isEmpty && !inRicerca && (
          <div className="flex-1 px-5 pt-2 pb-8 flex flex-col gap-7">

            <motion.section
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
            >
              <div className="flex items-center justify-between -mb-3">
                <h2 className="font-lora text-lg font-semibold text-roamly-g0">I tuoi viaggi</h2>
                <button
                  type="button"
                  onClick={() => navigate('/viaggi')}
                  className="flex items-center gap-0.5 font-dm-sans text-xs font-medium text-roamly-g2 active:opacity-60"
                >
                  Tutti i viaggi
                  <ChevronRight size={14} />
                </button>
              </div>
              {perAnno.map(([anno, lista]) => (
                <div key={anno} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-dm-mono text-xs font-medium tracking-widest text-roamly-g2">{anno}</span>
                    <div className="flex-1 h-px bg-roamly-g6" />
                  </div>
                  {lista.map((s) => (
                    <VolumeViaggioCard key={s.viaggio.id} sezione={s} />
                  ))}
                </div>
              ))}
            </motion.section>

          </div>
        )}
      </div>
    </PageLayout>
  )
}
