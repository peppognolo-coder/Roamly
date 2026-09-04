import { Coins, Gift, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useProfilo }   from '@/hooks/useProfilo'
import { useStoricoCrediti, useCodiceReferral } from '@/hooks/useCrediti'

// ============================================================
// CreditiPage — /profilo/crediti
// Saldo + storico movimenti + codice referral da condividere.
// ============================================================

export function CreditiPage() {
  const { data: profilo, isLoading: isLoadingProfilo } = useProfilo()
  const { data: storico, isLoading: isLoadingStorico } = useStoricoCrediti()
  const { data: codice, isLoading: isLoadingCodice } = useCodiceReferral()

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="I tuoi crediti" variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-6">

          {/* Saldo */}
          <div className="
            flex flex-col items-center gap-1 py-8
            bg-roamly-g0 rounded-3xl shadow-roamly-lg
          ">
            <div className="flex items-center gap-2 text-white/60">
              <Coins size={16} />
              <span className="font-dm-sans text-xs uppercase tracking-wider">Saldo</span>
            </div>
            {isLoadingProfilo ? (
              <div className="h-10 w-20 bg-white/10 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="font-lora text-4xl font-semibold text-white mt-1">
                {profilo?.crediti ?? 0}
              </p>
            )}
          </div>

          {/* Codice referral */}
          <ReferralCard codice={codice} isLoading={isLoadingCodice} />

          {/* Storico */}
          <div className="flex flex-col gap-2">
            <h2 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-text/50 px-1">
              Storico
            </h2>

            {isLoadingStorico && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-roamly-g6 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {!isLoadingStorico && (!storico || storico.length === 0) && (
              <div className="py-8 text-center">
                <p className="font-dm-sans text-sm text-roamly-text/40">
                  Nessun movimento ancora — completa qualche missione per iniziare
                </p>
              </div>
            )}

            {!isLoadingStorico && storico && storico.length > 0 && (
              <div className="flex flex-col gap-2">
                {storico.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-roamly"
                  >
                    <div className="min-w-0">
                      <p className="font-dm-sans text-sm font-medium text-roamly-text truncate">
                        {descrizioneMovimento(mov.motivo)}
                      </p>
                      <p className="font-dm-mono text-xs text-roamly-text/35 mt-0.5">
                        {new Date(mov.created_at).toLocaleDateString('it-IT', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="font-dm-sans text-sm font-semibold text-emerald-600 shrink-0">
                      +{mov.importo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// ReferralCard — mostra il codice e lo condivide (Web Share API
// se disponibile, altrimenti copia negli appunti — stesso pattern
// già usato per l'invito ai viaggi)
// ------------------------------------------------------------

function ReferralCard({ codice, isLoading }: { codice: string | null | undefined; isLoading: boolean }) {
  const [copiato, setCopiato] = useState(false)

  async function condividi() {
    if (!codice) return
    const testo = `Unisciti a me su Roamly! Usa il mio codice invito "${codice}" in fase di registrazione e riceviamo entrambi dei crediti.`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invito a Roamly', text: testo })
        return
      } catch {
        // utente ha annullato la condivisione — nessuna azione
        return
      }
    }

    try {
      await navigator.clipboard.writeText(codice)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 2000)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-roamly">
      <div className="flex items-center gap-2">
        <Gift size={16} className="text-roamly-g3" />
        <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
          Invita un amico
        </p>
      </div>
      <p className="font-dm-sans text-xs text-roamly-text/50 leading-relaxed">
        Condividi il tuo codice: quando qualcuno si registra usandolo, ricevete
        entrambi dei crediti.
      </p>

      {isLoading ? (
        <div className="h-11 bg-roamly-g6 rounded-xl animate-pulse" />
      ) : (
        <button
          onClick={condividi}
          className="
            flex items-center justify-between px-4 py-3
            bg-roamly-g7 rounded-xl
            hover:bg-roamly-g6 active:scale-[0.98]
            transition-all duration-150
          "
        >
          <span className="font-dm-mono text-sm font-semibold text-roamly-g0 tracking-wider">
            {codice ?? '—'}
          </span>
          {copiato ? (
            <Check size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <Copy size={16} className="text-roamly-text/40 shrink-0" />
          )}
        </button>
      )}
    </div>
  )
}

// ------------------------------------------------------------
// descrizioneMovimento — testo leggibile per il codice azione
// salvato in transazioni_crediti.motivo
// ------------------------------------------------------------

function descrizioneMovimento(motivo: string): string {
  const MAPPA: Record<string, string> = {
    foto_profilo: 'Foto profilo aggiunta',
    primo_viaggio: 'Primo viaggio creato',
    referral_invito_riuscito: 'Un amico si è registrato con il tuo codice',
    referral_ricevuto: 'Registrazione con codice invito',
  }
  return MAPPA[motivo] ?? motivo
}
