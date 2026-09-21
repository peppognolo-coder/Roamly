import { useNavigate } from 'react-router-dom'
import { WifiOff, Wifi } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// ============================================================
// OfflinePage — /offline
// Versione onesta della schermata "Senza rete" del mockup: lì
// mostrava anche una lista di contenuti "disponibili offline" con
// pesi in MB e una coda di sincronizzazione — dati che oggi non
// tracciamo davvero (il service worker fa caching silenzioso, e
// una scrittura fatta offline semplicemente fallisce, non viene
// messa in coda). Meglio dire solo cose vere: da quando sei
// offline, e cosa aspettarti, senza inventare numeri.
// ============================================================

function formatOra(d: Date): string {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

export function OfflinePage() {
  const navigate = useNavigate()
  const { isOffline, offlineDal } = useOnlineStatus()

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <div className="px-5 pt-14 pb-3">
          <p className="font-dm-mono text-[10px] uppercase tracking-widest text-roamly-text/30">
            Connessione
          </p>
          <h1 className="font-lora text-h1 text-roamly-g0 mt-1.5">
            {isOffline ? 'Senza rete' : 'Sei di nuovo online'}
          </h1>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col gap-3.5">

          {isOffline ? (
            <>
              <div className="p-4 rounded-[18px] bg-roamly-g0 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <p className="font-lora text-sm font-semibold text-white">
                    {offlineDal ? `Offline dalle ${formatOra(offlineDal)}` : 'Offline'}
                  </p>
                </div>
                <p className="font-dm-sans text-xs text-white/60 leading-relaxed">
                  Le pagine che hai già aperto restano visibili con gli ultimi dati scaricati.
                  Se provi a salvare qualcosa ora, potrebbe non andare a buon fine — riprova
                  quando torna la rete.
                </p>
              </div>

              <div className="p-4 rounded-[18px] bg-white shadow-roamly flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-roamly-g7 flex items-center justify-center shrink-0 text-roamly-g3">
                  <WifiOff size={16} />
                </div>
                <p className="font-dm-sans text-xs text-roamly-text/50 leading-relaxed pt-1.5">
                  Quando la connessione torna, Roamly si aggiorna automaticamente — non serve
                  ricaricare la pagina o fare nulla di particolare.
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-[18px] bg-white shadow-roamly flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-roamly-g7 flex items-center justify-center shrink-0 text-roamly-g3">
                <Wifi size={16} />
              </div>
              <p className="font-dm-sans text-xs text-roamly-text/50 leading-relaxed pt-1.5">
                La connessione è tornata — tutto è di nuovo aggiornato.
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="
              mt-1 h-[50px] rounded-full
              border border-roamly-g5 bg-roamly-g7
              font-dm-sans text-sm font-medium text-roamly-g1
              hover:bg-roamly-g6
              transition-colors duration-150
            "
          >
            {isOffline ? 'Continua offline' : 'Torna alla home'}
          </button>
        </div>

      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
