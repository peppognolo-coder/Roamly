import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { useAuth } from '@/hooks/useAuth'
import { useAnteprimaInvito, useAccettaInvito } from '@/hooks/useInviti'
import { setInvitoInSospeso } from '@/services/invitiService'

// ============================================================
// InvitoPage — /invito/:token
// Pagina PUBBLICA (nessun guard) — deve funzionare sia per chi
// non ha ancora un account, sia per chi è già autenticato.
// ============================================================

function formatData(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function InvitoPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth()
  const { data: risultato, isLoading, error: errQuery } = useAnteprimaInvito(token)
  const { accetta, isLoading: isAccettando } = useAccettaInvito()

  const anteprima = risultato?.data

  function handlePartecipa() {
    if (!token) return

    if (!isAuthenticated) {
      // Non ha ancora un account — mette da parte il token e lo
      // manda a registrarsi/accedere. Il gestore in App.tsx lo
      // riprenderà in automatico appena la sessione sarà attiva.
      setInvitoInSospeso(token)
      navigate('/login')
      return
    }

    accetta(token)
  }

  const isLoadingTutto = isLoading || isLoadingAuth
  const nonValido = !isLoadingTutto && (errQuery || !anteprima)
  const scaduto = anteprima?.scaduto === true

  return (
    <div className="min-h-screen bg-roamly-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-mobile flex flex-col items-center text-center gap-6">

        {/* Logo/marchio */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-roamly-g0 shadow-roamly-lg flex items-center justify-center">
            <span className="font-lora text-2xl font-semibold text-white">R</span>
          </div>
          <span className="font-lora text-lg font-semibold text-roamly-g0">Roamly</span>
        </div>

        {isLoadingTutto ? (
          <div className="w-full bg-white rounded-3xl shadow-roamly p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-roamly-g6 animate-pulse" />
            <div className="h-6 w-40 bg-roamly-g6 rounded animate-pulse" />
            <div className="h-4 w-28 bg-roamly-g6 rounded animate-pulse" />
          </div>
        ) : nonValido ? (
          <div className="w-full bg-white rounded-3xl shadow-roamly p-8 flex flex-col items-center gap-3">
            <p className="font-lora text-lg font-semibold text-roamly-g0">
              Invito non trovato
            </p>
            <p className="font-dm-sans text-sm text-roamly-text/50">
              Il link potrebbe essere sbagliato o non più disponibile.
            </p>
            <Button variant="ghost" onClick={() => navigate('/')} className="mt-2">
              Vai a Roamly
            </Button>
          </div>
        ) : scaduto ? (
          <div className="w-full bg-white rounded-3xl shadow-roamly p-8 flex flex-col items-center gap-3">
            <Clock size={32} className="text-roamly-text/30" />
            <p className="font-lora text-lg font-semibold text-roamly-g0">
              Questo invito è scaduto
            </p>
            <p className="font-dm-sans text-sm text-roamly-text/50">
              Chiedi a chi te lo ha inviato di generarne uno nuovo.
            </p>
          </div>
        ) : anteprima ? (
          <div className="w-full bg-white rounded-3xl shadow-roamly-lg overflow-hidden">
            <div className="bg-roamly-g0 p-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                <ViaggioCoverIcon value={anteprima.cover_emoji} size={30} />
              </div>
              <div>
                <p className="font-dm-sans text-xs text-white/50 uppercase tracking-wider mb-1">
                  Sei stato invitato a organizzare
                </p>
                <p className="font-lora text-xl font-semibold text-white">
                  {anteprima.nome}
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {(anteprima.destinazione || anteprima.paese) && (
                <div className="flex items-center gap-2 justify-center">
                  <MapPin size={14} className="text-roamly-g3" />
                  <span className="font-dm-sans text-sm text-roamly-text/70">
                    {[anteprima.destinazione, anteprima.paese].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(anteprima.data_inizio || anteprima.data_fine) && (
                <div className="flex items-center gap-2 justify-center">
                  <Calendar size={14} className="text-roamly-g3" />
                  <span className="font-dm-sans text-sm text-roamly-text/70">
                    {formatData(anteprima.data_inizio)}
                    {anteprima.data_fine && ` – ${formatData(anteprima.data_fine)}`}
                  </span>
                </div>
              )}

              <Button
                onClick={handlePartecipa}
                isLoading={isAccettando}
                fullWidth
                size="lg"
                className="mt-3"
              >
                {isAuthenticated ? 'Partecipa al viaggio' : 'Accedi per partecipare'}
              </Button>

              {!isAuthenticated && (
                <p className="font-dm-sans text-xs text-roamly-text/35">
                  Non hai un account? Potrai registrarti nella schermata successiva.
                </p>
              )}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}
