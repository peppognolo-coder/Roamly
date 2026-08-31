import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard }  from '@/components/auth/AuthGuard'
import { GuestGuard } from '@/components/auth/GuestGuard'

// Pages
import { AuthPage }           from '@/features/auth/AuthPage'
import { HomePage }           from '@/features/home/HomePage'
import { DiarioPage }         from '@/features/diario/DiarioPage'
import { NuovoRicordoPage }   from '@/features/momenti/NuovoRicordoPage'
import { RicordoDetailPage }  from '@/features/momenti/RicordoDetailPage'
import { PianificaPage }      from '@/features/pianifica/PianificaPage'
import { ProfiloPage }        from '@/features/profilo/ProfiloPage'
import { ImpostazioniAccountPage } from '@/features/profilo/ImpostazioniAccountPage'
import { StatistichePage }    from '@/features/profilo/StatistichePage'
import { ViaggiPage }         from '@/features/viaggi/ViaggiPage'
import { ViaggioDetailPage }  from '@/features/viaggi/ViaggioDetailPage'
import { NuovoViaggioPage }   from '@/features/viaggi/NuovoViaggioPage'
import { ValigiaPage }        from '@/features/pianifica/ValigiaPage'
import { PrenotazioniPage }   from '@/features/pianifica/PrenotazioniPage'
import { PrenotazionePage }   from '@/features/pianifica/PrenotazionePage'
import { ItinerarioPage }     from '@/features/pianifica/ItinerarioPage'
import { TappaPage }          from '@/features/pianifica/TappaPage'
import { CalendarioPage }     from '@/features/pianifica/CalendarioPage'
import { NoteViaggioPage }    from '@/features/pianifica/NoteViaggioPage'
import { InvitoPage }         from '@/features/inviti/InvitoPage'

// AttivitaPage carica Leaflet (~150 KB) — lazy, così pesa solo per
// chi apre davvero la mappa, non su ogni utente al primo avvio.
const AttivitaPage = lazy(() =>
  import('@/features/pianifica/AttivitaPage').then((m) => ({ default: m.AttivitaPage }))
)

function MapLoadingFallback() {
  return (
    <div className="min-h-screen bg-roamly-bg flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

function Public({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>
}

export const router = createBrowserRouter([
  // ── Libera (funziona sia autenticati che no) ──────────────
  {
    path: '/invito/:token',
    element: <InvitoPage />,
  },

  // ── Pubbliche (solo per utenti NON autenticati) ──────────
  {
    path: '/login',
    element: <Public><AuthPage /></Public>,
  },

  // ── Protette (solo per utenti autenticati) ───────────────
  {
    path: '/',
    element: <Protected><HomePage /></Protected>,
  },
  {
    path: '/diario',
    element: <Protected><DiarioPage /></Protected>,
  },
  {
    path: '/nuovo-ricordo',
    element: <Protected><NuovoRicordoPage /></Protected>,
  },
  {
    path: '/ricordi/:id',
    element: <Protected><RicordoDetailPage /></Protected>,
  },
  {
    path: '/pianifica',
    element: <Protected><PianificaPage /></Protected>,
  },
  {
    path: '/profilo',
    element: <Protected><ProfiloPage /></Protected>,
  },
  {
    path: '/profilo/impostazioni',
    element: <Protected><ImpostazioniAccountPage /></Protected>,
  },
  {
    path: '/profilo/statistiche',
    element: <Protected><StatistichePage /></Protected>,
  },
  {
    path: '/viaggi',
    element: <Protected><ViaggiPage /></Protected>,
  },
  // NOTA: /viaggi/nuovo deve precedere /viaggi/:id
  // altrimenti React Router interpreta "nuovo" come un ID
  {
    path: '/viaggi/nuovo',
    element: <Protected><NuovoViaggioPage /></Protected>,
  },
  {
    path: '/viaggi/:id',
    element: <Protected><ViaggioDetailPage /></Protected>,
  },
  {
    path: '/viaggi/:id/valigia',
    element: <Protected><ValigiaPage /></Protected>,
  },
  {
    path: '/viaggi/:id/prenotazioni',
    element: <Protected><PrenotazioniPage /></Protected>,
  },
  // NOTA: /prenotazioni/nuova deve precedere /prenotazioni/:prenotazioneId
  {
    path: '/viaggi/:id/prenotazioni/nuova',
    element: <Protected><PrenotazionePage /></Protected>,
  },
  {
    path: '/viaggi/:id/prenotazioni/:prenotazioneId',
    element: <Protected><PrenotazionePage /></Protected>,
  },
  {
    path: '/viaggi/:id/itinerario',
    element: <Protected><ItinerarioPage /></Protected>,
  },
  {
    path: '/viaggi/:id/attivita',
    element: (
      <Protected>
        <Suspense fallback={<MapLoadingFallback />}>
          <AttivitaPage />
        </Suspense>
      </Protected>
    ),
  },
  // NOTA: /tappe/nuova deve precedere /tappe/:tappaId
  {
    path: '/viaggi/:id/tappe/nuova',
    element: <Protected><TappaPage /></Protected>,
  },
  {
    path: '/viaggi/:id/tappe/:tappaId',
    element: <Protected><TappaPage /></Protected>,
  },
  {
    path: '/viaggi/:id/calendario',
    element: <Protected><CalendarioPage /></Protected>,
  },
  {
    path: '/viaggi/:id/note',
    element: <Protected><NoteViaggioPage /></Protected>,
  },
])
