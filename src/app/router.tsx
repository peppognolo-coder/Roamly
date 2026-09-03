import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard }  from '@/components/auth/AuthGuard'
import { GuestGuard } from '@/components/auth/GuestGuard'

// ============================================================
// Code splitting per route.
// Restano EAGER solo AuthPage e HomePage — i due schermi che
// praticamente ogni sessione tocca subito (gate di login, poi
// home). Tutto il resto è lazy: ogni pagina diventa un chunk
// separato scaricato solo quando l'utente ci naviga davvero,
// invece di pesare sul bundle iniziale per tutti.
// Stesso pattern già in uso per AttivitaPage (Leaflet) — qui
// esteso al resto del router.
// ============================================================

// Pages — eager (primo paint)
import { AuthPage } from '@/features/auth/AuthPage'
import { HomePage } from '@/features/home/HomePage'

// Pages — lazy
const DiarioPage             = lazy(() => import('@/features/diario/DiarioPage').then((m) => ({ default: m.DiarioPage })))
const NuovoRicordoPage       = lazy(() => import('@/features/momenti/NuovoRicordoPage').then((m) => ({ default: m.NuovoRicordoPage })))
const RicordoDetailPage      = lazy(() => import('@/features/momenti/RicordoDetailPage').then((m) => ({ default: m.RicordoDetailPage })))
const PianificaPage          = lazy(() => import('@/features/pianifica/PianificaPage').then((m) => ({ default: m.PianificaPage })))
const ProfiloPage            = lazy(() => import('@/features/profilo/ProfiloPage').then((m) => ({ default: m.ProfiloPage })))
const ImpostazioniAccountPage = lazy(() => import('@/features/profilo/ImpostazioniAccountPage').then((m) => ({ default: m.ImpostazioniAccountPage })))
const NotificheSettingsPage  = lazy(() => import('@/features/profilo/NotificheSettingsPage').then((m) => ({ default: m.NotificheSettingsPage })))
const StatistichePage        = lazy(() => import('@/features/profilo/StatistichePage').then((m) => ({ default: m.StatistichePage })))
const ViaggiPage             = lazy(() => import('@/features/viaggi/ViaggiPage').then((m) => ({ default: m.ViaggiPage })))
const ViaggioDetailPage      = lazy(() => import('@/features/viaggi/ViaggioDetailPage').then((m) => ({ default: m.ViaggioDetailPage })))
const NuovoViaggioPage       = lazy(() => import('@/features/viaggi/NuovoViaggioPage').then((m) => ({ default: m.NuovoViaggioPage })))
const ValigiaPage            = lazy(() => import('@/features/pianifica/ValigiaPage').then((m) => ({ default: m.ValigiaPage })))
const PrenotazioniPage       = lazy(() => import('@/features/pianifica/PrenotazioniPage').then((m) => ({ default: m.PrenotazioniPage })))
const PrenotazionePage       = lazy(() => import('@/features/pianifica/PrenotazionePage').then((m) => ({ default: m.PrenotazionePage })))
const ItinerarioPage         = lazy(() => import('@/features/pianifica/ItinerarioPage').then((m) => ({ default: m.ItinerarioPage })))
const TappaPage              = lazy(() => import('@/features/pianifica/TappaPage').then((m) => ({ default: m.TappaPage })))
const CalendarioPage         = lazy(() => import('@/features/pianifica/CalendarioPage').then((m) => ({ default: m.CalendarioPage })))
const NoteViaggioPage        = lazy(() => import('@/features/pianifica/NoteViaggioPage').then((m) => ({ default: m.NoteViaggioPage })))
const InvitoPage             = lazy(() => import('@/features/inviti/InvitoPage').then((m) => ({ default: m.InvitoPage })))
const MembriPage             = lazy(() => import('@/features/inviti/MembriPage').then((m) => ({ default: m.MembriPage })))

// AttivitaPage carica Leaflet (~150 KB) — lazy, così pesa solo per
// chi apre davvero la mappa, non su ogni utente al primo avvio.
const AttivitaPage = lazy(() =>
  import('@/features/pianifica/AttivitaPage').then((m) => ({ default: m.AttivitaPage }))
)

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-roamly-bg flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
    </div>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
    </AuthGuard>
  )
}

function Public({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>
}

export const router = createBrowserRouter([
  // ── Libera (funziona sia autenticati che no) ──────────────
  {
    path: '/invito/:token',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <InvitoPage />
      </Suspense>
    ),
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
    path: '/profilo/notifiche',
    element: <Protected><NotificheSettingsPage /></Protected>,
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
    path: '/viaggi/:id/membri',
    element: <Protected><MembriPage /></Protected>,
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
    element: <Protected><AttivitaPage /></Protected>,
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
