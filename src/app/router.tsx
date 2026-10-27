import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AuthGuard }  from '@/components/auth/AuthGuard'
import { GuestGuard } from '@/components/auth/GuestGuard'
import { PageSkeleton } from '@/components/layout/PageSkeleton'
import { RouteError }   from '@/components/layout/RouteError'
import { AppShell }     from '@/components/layout/AppShell'
import { RootLayout }   from '@/components/layout/RootLayout'

// ============================================================
// Code splitting per route.
// Resta EAGER solo HomePage — lo schermo che quasi ogni sessione
// tocca subito. Il login è lazy: chi è già dentro non scarica
// nemmeno zod/react-hook-form. Tutto il resto è lazy: ogni pagina diventa un chunk
// separato scaricato solo quando l'utente ci naviga davvero,
// invece di pesare sul bundle iniziale per tutti.
// Stesso pattern già in uso per AttivitaPage (Leaflet) — qui
// esteso al resto del router.
// ============================================================

// Pages — eager (primo paint)
import { HomePage } from '@/features/home/HomePage'

// Pages — lazy
const PrivacyPage            = lazy(() => import('@/features/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const TerminiPage            = lazy(() => import('@/features/legal/TerminiPage').then((m) => ({ default: m.TerminiPage })))
const AuthPage               = lazy(() => import('@/features/auth/AuthPage').then((m) => ({ default: m.AuthPage })))
const ResetPasswordPage      = lazy(() => import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const DiarioPage             = lazy(() => import('@/features/diario/DiarioPage').then((m) => ({ default: m.DiarioPage })))
const DiarioViaggioPage      = lazy(() => import('@/features/diario/DiarioViaggioPage').then((m) => ({ default: m.DiarioViaggioPage })))
const NuovoRicordoPage       = lazy(() => import('@/features/momenti/NuovoRicordoPage').then((m) => ({ default: m.NuovoRicordoPage })))
const RicordoDetailPage      = lazy(() => import('@/features/momenti/RicordoDetailPage').then((m) => ({ default: m.RicordoDetailPage })))
const PianificaPage          = lazy(() => import('@/features/pianifica/PianificaPage').then((m) => ({ default: m.PianificaPage })))
const ProfiloPage            = lazy(() => import('@/features/profilo/ProfiloPage').then((m) => ({ default: m.ProfiloPage })))
const ImpostazioniAccountPage = lazy(() => import('@/features/profilo/ImpostazioniAccountPage').then((m) => ({ default: m.ImpostazioniAccountPage })))
const NotificheSettingsPage  = lazy(() => import('@/features/profilo/NotificheSettingsPage').then((m) => ({ default: m.NotificheSettingsPage })))
const CreditiPage            = lazy(() => import('@/features/profilo/CreditiPage').then((m) => ({ default: m.CreditiPage })))
const TraguardiPage          = lazy(() => import('@/features/profilo/TraguardiPage').then((m) => ({ default: m.TraguardiPage })))
const StatistichePage        = lazy(() => import('@/features/profilo/StatistichePage').then((m) => ({ default: m.StatistichePage })))
const LuogoSalvatoPage       = lazy(() => import('@/features/profilo/LuogoSalvatoPage').then((m) => ({ default: m.LuogoSalvatoPage })))
const LuoghiSalvatiPage      = lazy(() => import('@/features/profilo/LuoghiSalvatiPage').then((m) => ({ default: m.LuoghiSalvatiPage })))
const NotifichePage          = lazy(() => import('@/features/profilo/NotifichePage').then((m) => ({ default: m.NotifichePage })))
const WalletPage              = lazy(() => import('@/features/profilo/WalletPage').then((m) => ({ default: m.WalletPage })))
const NuovoDocumentoWalletPage = lazy(() => import('@/features/profilo/NuovoDocumentoWalletPage').then((m) => ({ default: m.NuovoDocumentoWalletPage })))
const DocumentoWalletDetailPage = lazy(() => import('@/features/profilo/DocumentoWalletDetailPage').then((m) => ({ default: m.DocumentoWalletDetailPage })))
const OfflinePage            = lazy(() => import('@/features/offline/OfflinePage').then((m) => ({ default: m.OfflinePage })))
const ViaggiPage             = lazy(() => import('@/features/viaggi/ViaggiPage').then((m) => ({ default: m.ViaggiPage })))
const ViaggioDetailPage      = lazy(() => import('@/features/viaggi/ViaggioDetailPage').then((m) => ({ default: m.ViaggioDetailPage })))
// Il vecchio Riepilogo è stato assorbito dal Racconto: i link esistenti
// (/viaggi/:id/recap) portano lì.
function RecapRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/viaggi/${id}/racconto`} replace />
}
const RaccontoPage           = lazy(() => import('@/features/viaggi/RaccontoPage').then((m) => ({ default: m.RaccontoPage })))
const GiornoPage             = lazy(() => import('@/features/viaggi/GiornoPage').then((m) => ({ default: m.GiornoPage })))
const WrappedPage            = lazy(() => import('@/features/wrapped/WrappedPage').then((m) => ({ default: m.WrappedPage })))
const ViaggioPubblicoPage    = lazy(() => import('@/features/viaggi/ViaggioPubblicoPage').then((m) => ({ default: m.ViaggioPubblicoPage })))
const NuovoViaggioPage       = lazy(() => import('@/features/viaggi/NuovoViaggioPage').then((m) => ({ default: m.NuovoViaggioPage })))
const ValigiaPage            = lazy(() => import('@/features/pianifica/ValigiaPage').then((m) => ({ default: m.ValigiaPage })))
const PrenotazioniPage       = lazy(() => import('@/features/pianifica/PrenotazioniPage').then((m) => ({ default: m.PrenotazioniPage })))
const PrenotazionePage       = lazy(() => import('@/features/pianifica/PrenotazionePage').then((m) => ({ default: m.PrenotazionePage })))
const BudgetPage             = lazy(() => import('@/features/pianifica/BudgetPage').then((m) => ({ default: m.BudgetPage })))
const BudgetVocePage         = lazy(() => import('@/features/pianifica/BudgetVocePage').then((m) => ({ default: m.BudgetVocePage })))
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

// Fallback di Suspense: sagoma della pagina (header + card) invece dello spinner
const PageLoadingFallback = PageSkeleton

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
    </AuthGuard>
  )
}

function Public({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
    </GuestGuard>
  )
}

const routes: RouteObject[] = [
  // ── Libera (funziona sia autenticati che no) ──────────────
  {
    path: '/invito/:token',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <InvitoPage />
      </Suspense>
    ),
  },

  {
    path: '/v/:token',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <ViaggioPubblicoPage />
      </Suspense>
    ),
  },

  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },

  // ── Legali: pubbliche, aperte a tutti (anche senza login) ─
  {
    path: '/privacy',
    element: <Suspense fallback={<PageLoadingFallback />}><PrivacyPage /></Suspense>,
  },
  {
    path: '/termini',
    element: <Suspense fallback={<PageLoadingFallback />}><TerminiPage /></Suspense>,
  },

  // ── Pubbliche (solo per utenti NON autenticati) ──────────
  {
    path: '/login',
    element: <Public><AuthPage /></Public>,
  },

  // ── Protette (solo per utenti autenticati) ───────────────
  {
    path: '/nuovo-ricordo',
    element: <Protected><NuovoRicordoPage /></Protected>,
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
    path: '/profilo/wallet',
    element: <Protected><WalletPage /></Protected>,
  },
  // NOTA: /profilo/wallet/nuovo deve precedere /profilo/wallet/:documentoId
  {
    path: '/profilo/wallet/nuovo',
    element: <Protected><NuovoDocumentoWalletPage /></Protected>,
  },
  {
    path: '/profilo/wallet/:documentoId',
    element: <Protected><DocumentoWalletDetailPage /></Protected>,
  },
  {
    path: '/offline',
    element: <Protected><OfflinePage /></Protected>,
  },
  // NOTA: /viaggi/nuovo deve precedere /viaggi/:id
  // altrimenti React Router interpreta "nuovo" come un ID
  {
    path: '/viaggi/nuovo',
    element: <Protected><NuovoViaggioPage /></Protected>,
  },
  {
    path: '/viaggi/:id/recap',
    element: <Protected><RecapRedirect /></Protected>,
  },
  {
    path: '/viaggi/:id/giorno/:data',
    element: <Protected><GiornoPage /></Protected>,
  },
  {
    path: '/viaggi/:id/wrapped',
    element: <Protected><WrappedPage /></Protected>,
  },
  {
    path: '/viaggi/:id/racconto',
    element: <Protected><RaccontoPage /></Protected>,
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
    path: '/viaggi/:id/budget',
    element: <Protected><BudgetPage /></Protected>,
  },
  // NOTA: /budget/nuova deve precedere /budget/:voceId
  {
    path: '/viaggi/:id/budget/nuova',
    element: <Protected><BudgetVocePage /></Protected>,
  },
  {
    path: '/viaggi/:id/budget/:voceId',
    element: <Protected><BudgetVocePage /></Protected>,
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

  // ── Protette, con barra in basso persistente (AppShell) ───
  // Home, Diario, Pianifica, Profilo, lista/dettaglio viaggio, dettaglio
  // ricordo e le pagine profilo con barra. AppShell monta AuthGuard,
  // Suspense e BottomNav una volta sola per tutto il gruppo.
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/diario', element: <DiarioPage /> },
      { path: '/diario/:id', element: <DiarioViaggioPage /> },
      { path: '/ricordi/:id', element: <RicordoDetailPage /> },
      { path: '/pianifica', element: <PianificaPage /> },
      { path: '/profilo', element: <ProfiloPage /> },
      { path: '/profilo/crediti', element: <CreditiPage /> },
      { path: '/profilo/traguardi', element: <TraguardiPage /> },
      { path: '/profilo/salvati', element: <LuoghiSalvatiPage /> },
      { path: '/profilo/salvati/:id', element: <LuogoSalvatoPage /> },
      { path: '/profilo/feed', element: <NotifichePage /> },
      { path: '/profilo/notifiche', element: <NotificheSettingsPage /> },
      { path: '/viaggi', element: <ViaggiPage /> },
      { path: '/viaggi/:id', element: <ViaggioDetailPage /> },
    ],
  },
]

// errorElement su ogni rotta (anche dentro la shell, così un errore in una
// pagina lascia visibile la barra): un errore nel render di una pagina, o un
// chunk lazy non più valido dopo un deploy, mostra RouteError invece di una
// schermata bianca. La rotta "*" cattura gli indirizzi inesistenti (404).
function conErrore(r: RouteObject): RouteObject {
  const base = { ...r, errorElement: <RouteError /> } as RouteObject
  if (r.children) (base as { children?: RouteObject[] }).children = r.children.map(conErrore)
  return base
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...routes.map(conErrore),
      { path: '*', element: <RouteError notFound /> },
    ],
  },
])

// ------------------------------------------------------------
// Transizioni di pagina (View Transitions API).
// Ogni navigate() che porta a un'altra PAGINA parte con
// viewTransition: true, senza toccare i ~230 punti di chiamata:
// react-router avvolge l'aggiornamento in document.startViewTransition
// e il CSS (globals.css) decide come dissolvere. Non si applica a:
//  - cambi di sola query/hash (es. ?tab=), che non sono cambi pagina
//  - "indietro" (navigate(-1) / gesto di sistema), gestito dal browser
//  - chiamate che passano già viewTransition esplicitamente
// Nei browser senza l'API (Safari < 18) react-router aggiorna e basta:
// nessuna transizione, nessun errore.
// ------------------------------------------------------------
type OpzioniNavigate = Parameters<typeof router.navigate>[1]

function eCambioPagina(to: unknown): boolean {
  let nuovo: string | undefined
  if (typeof to === 'string') nuovo = to.split(/[?#]/)[0]
  else if (to && typeof to === 'object') nuovo = (to as { pathname?: string }).pathname
  else return false
  if (!nuovo) return false
  return nuovo !== router.state.location.pathname
}

const navigateOriginale = router.navigate.bind(router)
router.navigate = ((to: never, opts?: OpzioniNavigate) => {
  if (opts?.viewTransition === undefined && eCambioPagina(to)) {
    opts = { ...opts, viewTransition: true }
  }
  return navigateOriginale(to, opts)
}) as typeof router.navigate
