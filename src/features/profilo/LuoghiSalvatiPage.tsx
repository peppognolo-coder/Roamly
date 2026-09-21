import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MapPin, Sparkles } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useLuoghiSalvati } from '@/hooks/useLuoghiSalvati'
import { trovaClusterVicini } from '@/lib/luoghi-clustering'
import type { LuogoSalvato } from '@/types'

// ============================================================
// LuoghiSalvatiPage — /profilo/salvati
// Vista autonoma della wishlist ("Salvati" nel mockup — lì la
// destinazione della ricerca Scopri, che non esiste ancora nella
// nostra app). Qui riusa i dati già salvati da Mappa (modalità
// "Salvati"): stessa tabella, stesso hook, nessuna nuova query.
// Aggiunge solo la possibilità di rimuovere un luogo da qui, e un
// suggerimento quando 3+ luoghi salvati sono geograficamente
// vicini (clustering su lat/lng reali — non un nome di città
// inventato dall'indirizzo libero).
// ============================================================

export function LuoghiSalvatiPage() {
  const navigate = useNavigate()
  const { luoghi, isLoading, rimuoviLuogoSalvato } = useLuoghiSalvati()

  const clusterPrincipale = useMemo(() => {
    const clusters = trovaClusterVicini(luoghi)
    return clusters[0] ?? null
  }, [luoghi])

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title="Voglio andarci"
          subtitle={
            !isLoading
              ? `${luoghi.length} ${luoghi.length === 1 ? 'posto salvato' : 'posti salvati'}. Nessuna fretta — restano qui.`
              : undefined
          }
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[150px] bg-white rounded-[18px] shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : luoghi.length === 0 ? (
            <div className="
              flex flex-col items-center gap-3 py-12 px-8 text-center
              rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7
            ">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-roamly flex items-center justify-center">
                <Bookmark size={24} className="text-roamly-g3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-lora text-base font-semibold text-roamly-g0">
                  Ancora nessun luogo salvato
                </p>
                <p className="font-dm-sans text-sm text-roamly-text/50 leading-relaxed max-w-[240px]">
                  Dalla mappa di un viaggio, tocca un luogo e salvalo — lo ritrovi qui.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {clusterPrincipale && (
                <div className="p-4 rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-roamly-g3 shrink-0" />
                    <p className="font-lora text-sm font-semibold text-roamly-g0">
                      {clusterPrincipale.length} luoghi salvati sono vicini tra loro
                    </p>
                  </div>
                  <p className="font-dm-sans text-xs text-roamly-text/50 leading-relaxed">
                    Potrebbero stare bene nello stesso viaggio — dai un'occhiata prima di pianificare.
                  </p>
                  <button
                    onClick={() => navigate('/viaggi/nuovo')}
                    className="
                      self-start h-9 px-4 rounded-full
                      bg-roamly-g0 text-white
                      font-dm-sans text-xs font-medium
                      hover:bg-roamly-g1 active:scale-[0.98]
                      transition-all duration-150
                    "
                  >
                    Pianifica un viaggio
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {luoghi.map((luogo) => (
                  <LuogoCard
                    key={luogo.id}
                    luogo={luogo}
                    onRimuovi={() => rimuoviLuogoSalvato(luogo.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// LuogoCard
// ------------------------------------------------------------

function LuogoCard({
  luogo,
  onRimuovi,
}: {
  luogo: LuogoSalvato
  onRimuovi: () => void
}) {
  return (
    <div className="rounded-[18px] overflow-hidden bg-white shadow-roamly">
      {/* Placeholder visivo — nessuna foto in questo dato, solo
          posizione e categoria libera inserita dall'utente */}
      <div
        className="relative h-[104px] flex items-center justify-center"
        style={{
          background: '#DFF3FA',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(11,111,153,.13) 0 3px, transparent 3px 9px)',
        }}
      >
        {luogo.categoria && (
          <span className="
            absolute left-[9px] top-[9px] px-2 py-1 rounded-full
            bg-white/85 font-dm-mono text-[8.5px] font-medium
            uppercase tracking-wider text-roamly-g2 truncate max-w-[80%]
          ">
            {luogo.categoria}
          </span>
        )}

        <MapPin size={20} className="text-roamly-g3/50" />

        <button
          onClick={onRimuovi}
          aria-label="Rimuovi dai salvati"
          className="
            absolute right-[9px] top-[9px] w-7 h-7 rounded-full
            bg-roamly-coral/90 backdrop-blur-sm
            flex items-center justify-center text-white
            hover:bg-roamly-coral-dark active:scale-95
            transition-all duration-150
          "
        >
          <Bookmark size={12} fill="currentColor" />
        </button>
      </div>

      <div className="px-3 pt-2.5 pb-3.5">
        <p className="font-dm-sans text-[13px] font-medium text-roamly-g0 truncate">
          {luogo.nome}
        </p>
        {luogo.indirizzo && (
          <p className="font-dm-sans text-[11px] text-roamly-text/42 truncate mt-1">
            {luogo.indirizzo}
          </p>
        )}
      </div>
    </div>
  )
}
