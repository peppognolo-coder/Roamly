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
import { ViaggiPage }         from '@/features/viaggi/ViaggiPage'
import { ViaggioDetailPage }  from '@/features/viaggi/ViaggioDetailPage'
import { NuovoViaggioPage }   from '@/features/viaggi/NuovoViaggioPage'
import { ValigiaPage }        from '@/features/pianifica/ValigiaPage'

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

function Public({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>
}

export const router = createBrowserRouter([
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
])
