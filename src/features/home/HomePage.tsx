import { motion } from 'framer-motion'
import { PageLayout }        from '@/components/layout/PageLayout'
import { PageHeader }        from '@/components/layout/PageHeader'
import { BottomNav }         from '@/components/layout/BottomNav'
import { Button }            from '@/components/ui/Button'
import { ViaggioAttivoCard } from './ViaggioAttivoCard'
import { UltimiRicordiSection } from './UltimiRicordiSection'
import { QuickStatsSection }  from './QuickStatsSection'
import { RicordoDelGiornoCard, RicordoDelGiornoCardSkeleton } from '@/components/ricordi/RicordoDelGiornoCard'
import { useViaggioAttivo }  from '@/hooks/useViaggi'
import { useRicordiRecenti, useStatisticheUtente } from '@/hooks/useRicordi'
import { useRicordoDelGiorno } from '@/hooks/useRicordoDelGiorno'
import { useProfilo }        from '@/hooks/useProfilo'
import { useNavigate }       from 'react-router-dom'

// ============================================================
// HomePage — /
// Struttura:
//   Header (saluto + data)
//   Empty state unificato (first visit: nessun viaggio né ricordo)
//   --- oppure, se l'utente ha dati: ---
//   ViaggioAttivoCard
//   RicordoDelGiornoCard (B45)
//   UltimiRicordiSection
//   QuickStatsSection
// ============================================================

// Saluto in base all'ora del giorno
function getSaluto(): string {
  const ora = new Date().getHours()
  if (ora < 12) return 'Buongiorno'
  if (ora < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

// Data odierna formattata
function getDataOggi(): string {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function HomePage() {
  const navigate = useNavigate()

  const { data: profilo }                         = useProfilo()
  const { viaggio: viaggioAttivo, isLoading: isLoadingViaggio } = useViaggioAttivo()
  const { data: ricordiRecenti, isLoading: isLoadingRicordi }   = useRicordiRecenti(5)
  const { data: statistiche, isLoading: isLoadingStats }        = useStatisticheUtente()
  const { data: ricordoDelGiorno, isLoading: isLoadingB45 }     = useRicordoDelGiorno()

  const nomeUtente = profilo?.display_name?.split(' ')[0] ?? null
  const isLoadingGlobale = isLoadingViaggio && isLoadingRicordi

  // First visit: nessun dato ancora (primo accesso reale)
  const isFirstVisit = !isLoadingGlobale
    && !viaggioAttivo
    && (!ricordiRecenti || ricordiRecenti.length === 0)

  // Mostra il Ricordo del Giorno solo se l'utente ha almeno 3 ricordi
  const mostraB45 = (statistiche?.ricordi ?? 0) >= 3

  return (
    <PageLayout>
      <div className="flex flex-col min-h-screen">

        {/* ── Header ── */}
        <PageHeader
          eyebrow={getDataOggi()}
          title={nomeUtente ? `${getSaluto()}, ${nomeUtente}` : getSaluto()}
        />

        {/* ── First Visit Empty State ── */}
        {isFirstVisit && (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="
              w-20 h-20 rounded-3xl
              bg-roamly-g7 border border-roamly-g6
              flex items-center justify-center
            ">
              <span className="text-4xl">📖</span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-lora text-xl font-semibold text-roamly-g0">
                Benvenuto in Roamly
              </p>
              <p className="font-lora text-xl font-semibold text-roamly-g0">
                Ogni viaggio inizia da una storia.
              </p>
              <p className="font-dm-sans text-sm text-roamly-text/50 mt-1 leading-relaxed">
                Crea il tuo primo viaggio e inizia
                <br />a costruire il tuo diario.
              </p>
            </div>

            <Button onClick={() => navigate('/viaggi/nuovo')} size="lg">
              Pianifica il primo viaggio
            </Button>
          </motion.div>
        )}

        {/* ── Contenuto principale ── */}
        {!isFirstVisit && (
          <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

            {/* Viaggio attivo */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <ViaggioAttivoCard
                viaggio={viaggioAttivo}
                isLoading={isLoadingViaggio}
              />
            </motion.div>

            {/* B45 — Ricordo del Giorno */}
            {mostraB45 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {isLoadingB45 ? (
                  <RicordoDelGiornoCardSkeleton />
                ) : ricordoDelGiorno ? (
                  <RicordoDelGiornoCard
                    ricordo={ricordoDelGiorno.ricordo}
                    viaggio={ricordoDelGiorno.viaggio}
                    labelTempo={ricordoDelGiorno.labelTempo}
                  />
                ) : null}
              </motion.div>
            )}

            {/* Ultimi ricordi */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <UltimiRicordiSection
                ricordi={ricordiRecenti ?? []}
                isLoading={isLoadingRicordi}
              />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <QuickStatsSection
                viaggi={statistiche?.viaggi ?? 0}
                ricordi={statistiche?.ricordi ?? 0}
                paesi={statistiche?.paesi ?? 0}
                isLoading={isLoadingStats}
              />
            </motion.div>

          </div>
        )}

      </div>
      <BottomNav />
    </PageLayout>
  )
}
