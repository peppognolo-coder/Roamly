import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { PageLayout }            from '@/components/layout/PageLayout'
import { BottomNav }             from '@/components/layout/BottomNav'
import { FiltriBar }             from './FiltriBar'
import { VolumeViaggioCard }     from './VolumeViaggioCard'
import { RicordoCardDiario }     from './RicordoCardDiario'
import { DiarioVuoto, DiarioVuotoConFiltri } from './TimelineVuota'
import { useDiario }             from '@/hooks/useDiario'
import { useFiltriDiario }       from '@/hooks/useFiltriDiario'
import { useRicordoDelGiorno }   from '@/hooks/useRicordoDelGiorno'
import { haFiltriAttivi }        from '@/lib/diario-utils'
import type { Ricordo }          from '@/types'

// ============================================================
// DiarioPage — /diario
// Due livelli, per non perdersi quando i viaggi crescono:
//   1. questa pagina: i viaggi come "volumi" (copertina, ricordi,
//      miniature), raggruppati per anno, più una card "Da riscoprire";
//      la lente apre ricerca e filtri.
//   2. /diario/:id: il diario del singolo viaggio (DiarioViaggioPage).
// Con ricerca/filtri attivi si vede un elenco unico di ricordi, ognuno
// con l'etichetta del suo viaggio.
// ============================================================

export function DiarioPage() {
  const { filtri, ricercaInput, setRicercaInput, toggleMood, togglePreferiti, toggleAutore, resetFiltri } = useFiltriDiario()

  const {
    sezioni,
    ricordoInEvidenza,
    isLoading,
    isEmpty,
    isEmptyConFiltri,
    totaleFiltrati,
    totaleRicordi,
    haViaggi,
    autoriDisponibili,
  } = useDiario(filtri)

  const [cercaAperta, setCercaAperta] = useState(false)
  const filtriAttivi = haFiltriAttivi(filtri)
  const inRicerca = cercaAperta || filtriAttivi

  const { data: ricordoDelGiorno } = useRicordoDelGiorno()

  const nomeViaggio = (viaggioId: string) => sezioni.find((s) => s.viaggio.id === viaggioId)?.viaggio.nome

  // "Da riscoprire": il ricordo del giorno se ci sono almeno 3 ricordi, altrimenti quello in evidenza
  const daRiscoprire: { ricordo: Ricordo; eyebrow: string } | null = useMemo(() => {
    if (totaleRicordi >= 3 && ricordoDelGiorno?.ricordo) {
      return { ricordo: ricordoDelGiorno.ricordo, eyebrow: ricordoDelGiorno.labelTempo ?? 'Da riscoprire' }
    }
    return ricordoInEvidenza ? { ricordo: ricordoInEvidenza, eyebrow: 'In evidenza' } : null
  }, [totaleRicordi, ricordoDelGiorno, ricordoInEvidenza])

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

            {daRiscoprire && (
              <motion.section
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-lora text-lg font-semibold text-roamly-g0">Da riscoprire</h2>
                <RicordoCardDiario
                  ricordo={daRiscoprire.ricordo}
                  eyebrow={daRiscoprire.eyebrow}
                  viaggioNome={nomeViaggio(daRiscoprire.ricordo.viaggio_id)}
                />
              </motion.section>
            )}

            <motion.section
              className="flex flex-col gap-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
            >
              <h2 className="font-lora text-lg font-semibold text-roamly-g0 -mb-3">I tuoi viaggi</h2>
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
      <BottomNav />
    </PageLayout>
  )
}
