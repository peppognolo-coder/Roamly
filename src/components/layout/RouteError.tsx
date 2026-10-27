import { useEffect } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'

// ============================================================
// RouteError — schermata per rotta inesistente (404) e per errori
// durante il render di una pagina.
//
// Caso tipico degli errori: dopo un nuovo deploy il browser ha ancora
// in cache l'indice vecchio e prova a scaricare un chunk lazy che non
// esiste più ("Failed to fetch dynamically imported module"). In quel
// caso si ricarica l'app una sola volta in automatico (flag in
// sessionStorage, per non finire in un ciclo); se non basta resta il
// bottone "Ricarica".
// ============================================================

const FLAG_RICARICA = 'roamly:chunk-reload'

function eErroreChunk(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(msg)
}

interface RouteErrorProps {
  /** Forza la schermata "pagina non trovata" (usato dalla rotta catch-all) */
  notFound?: boolean
}

export function RouteError({ notFound = false }: RouteErrorProps) {
  const error = useRouteError()
  const navigate = useNavigate()

  const non404 = !notFound && !(isRouteErrorResponse(error) && error.status === 404)
  const chunk = non404 && eErroreChunk(error)

  useEffect(() => {
    if (!chunk) return
    try {
      if (sessionStorage.getItem(FLAG_RICARICA)) return
      sessionStorage.setItem(FLAG_RICARICA, '1')
    } catch {
      return // storage non disponibile: niente ricarica automatica, resta il bottone
    }
    window.location.reload()
  }, [chunk])

  useEffect(() => {
    if (non404 && !chunk) console.error('Errore di rotta:', error)
  }, [non404, chunk, error])

  const titolo = non404
    ? (chunk ? 'Roamly si è aggiornata' : 'Qualcosa non ha funzionato')
    : 'Qui non c’è niente'
  const testo = non404
    ? (chunk
        ? 'È disponibile una versione nuova. Ricarica per continuare.'
        : 'Riprova tra un attimo. Se succede ancora, torna alla Home.')
    : 'Questa pagina non esiste, o è stata spostata. Il sentiero riparte dalla Home.'

  return (
    <PageLayout withBottomNav={false}>
      <div
        role={non404 ? 'alert' : undefined}
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-roamly-g7 shadow-roamly flex items-center justify-center">
          <Compass size={32} className="text-roamly-g3" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-lora text-xl font-semibold text-roamly-g0">{titolo}</h1>
          <p className="font-dm-sans text-sm text-roamly-text/55 leading-relaxed">{testo}</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[260px]">
          {non404 && (
            <Button onClick={() => window.location.reload()} size="lg">
              Ricarica
            </Button>
          )}
          <Button
            variant={non404 ? 'ghost' : 'primary'}
            size="lg"
            onClick={() => navigate('/', { replace: true })}
          >
            Vai alla Home
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
