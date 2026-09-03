import { Bell, AlertTriangle, ShieldOff } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { Toggle }       from '@/components/ui/Toggle'
import { useProfilo, useAggiornaProfilo } from '@/hooks/useProfilo'
import { useNotifichePush } from '@/hooks/useNotifichePush'

// ============================================================
// NotificheSettingsPage — /profilo/notifiche
//
// N2 del blocco Notifiche: il toggle ora chiede davvero il
// permesso al browser e registra il dispositivo (subscription
// push) — non solo la preferenza come in N1. L'invio effettivo
// (N3, motore schedulato) resta ancora da costruire: attivare
// qui prepara tutto, ma finché N3 non esiste nessuna notifica
// arriva davvero — lo diciamo chiaramente in pagina.
// ============================================================

const OPZIONI_ANTICIPO = [
  { valore: 1, label: '1 giorno prima' },
  { valore: 3, label: '3 giorni prima' },
  { valore: 7, label: '1 settimana prima' },
]

export function NotificheSettingsPage() {
  const { data: profilo, isLoading } = useProfilo()
  const { mutate: aggiorna, isPending } = useAggiornaProfilo()
  const {
    stato, isLoading: isLoadingPush, error: pushError,
    supportato, chiaveConfigurata, attiva, disattiva,
  } = useNotifichePush()

  const abilitate      = profilo?.notifiche_prenotazioni ?? false
  const anticipoGiorni = profilo?.notifiche_anticipo_giorni ?? 3

  async function handleToggle(checked: boolean) {
    if (checked) {
      await attiva()
      // Solo se il permesso è stato davvero concesso salviamo la
      // preferenza attiva — altrimenti il toggle tornerebbe "acceso"
      // senza che il dispositivo sia realmente registrato.
      if (Notification.permission === 'granted') {
        aggiorna({ notifiche_prenotazioni: true })
      }
    } else {
      await disattiva()
      aggiorna({ notifiche_prenotazioni: false })
    }
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Notifiche" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {isLoading ? (
            <div className="h-32 bg-roamly-g6 rounded-2xl animate-pulse" />
          ) : (
            <>
              {/* Avviso: dispositivo registrato, ma l'invio arriva con N3 */}
              <div className="flex items-start gap-2.5 px-4 py-3 bg-roamly-g7 rounded-2xl">
                <Bell size={15} className="text-roamly-g3 mt-0.5 shrink-0" />
                <p className="font-dm-sans text-xs text-roamly-text/55 leading-relaxed">
                  Attivando, il tuo dispositivo viene registrato per ricevere notifiche —
                  ma l'invio vero e proprio arriverà in un secondo momento.
                  Per ora nulla verrà davvero recapitato.
                </p>
              </div>

              {/* Browser non supportato */}
              {!supportato && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="font-dm-sans text-xs text-amber-700 leading-relaxed">
                    Questo browser non supporta le notifiche push. Su iPhone, funziona
                    solo se hai aggiunto Roamly alla schermata Home (Safari → Condividi
                    → Aggiungi a Home).
                  </p>
                </div>
              )}

              {/* Permesso negato in precedenza dal browser/dispositivo */}
              {supportato && stato === 'denied' && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <ShieldOff size={15} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="font-dm-sans text-xs text-amber-700 leading-relaxed">
                    Hai negato il permesso di notifica in precedenza — per riattivarlo
                    devi cambiarlo dalle impostazioni del browser o del telefono per
                    questo sito, non da qui.
                  </p>
                </div>
              )}

              {pushError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-dm-sans text-xs text-red-600">{pushError}</p>
                </div>
              )}

              {/* Toggle principale */}
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-roamly">
                <div className="min-w-0 pr-4">
                  <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
                    Promemoria prenotazioni
                  </p>
                  <p className="font-dm-sans text-xs text-roamly-text/45 mt-0.5">
                    Un avviso quando una prenotazione si avvicina
                  </p>
                </div>
                <Toggle
                  checked={abilitate}
                  disabled={isPending || isLoadingPush || !supportato || !chiaveConfigurata || stato === 'denied'}
                  ariaLabel="Promemoria prenotazioni"
                  onChange={handleToggle}
                />
              </div>

              {/* Anticipo — solo se abilitato */}
              {abilitate && (
                <div className="flex flex-col gap-2">
                  <p className="font-dm-sans text-sm font-medium text-roamly-text/70 px-1">
                    Con quanto anticipo
                  </p>
                  <div className="flex flex-col gap-2">
                    {OPZIONI_ANTICIPO.map((opzione) => {
                      const selezionata = anticipoGiorni === opzione.valore
                      return (
                        <button
                          key={opzione.valore}
                          disabled={isPending}
                          onClick={() => aggiorna({ notifiche_anticipo_giorni: opzione.valore })}
                          className={`
                            flex items-center justify-between p-3.5 rounded-2xl
                            border text-left transition-all duration-150
                            disabled:opacity-60
                            ${selezionata
                              ? 'bg-roamly-g0 border-roamly-g0'
                              : 'bg-white border-roamly-g5 hover:border-roamly-g4'
                            }
                          `}
                        >
                          <span className={`
                            font-dm-sans text-sm font-medium
                            ${selezionata ? 'text-white' : 'text-roamly-text'}
                          `}>
                            {opzione.label}
                          </span>
                          {selezionata && (
                            <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-roamly-g0" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}
