import { useEffect, useRef } from 'react'
import { RouterProvider }       from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router }               from './router'
import { useAuthListener }      from '@/hooks/useAuth'
import { useAuthStore }         from '@/store/authStore'
import { useToastStore }        from '@/store/toastStore'
import { getInvitoInSospeso, clearInvitoInSospeso, accettaInvito } from '@/services/invitiService'
import { ToastContainer }       from '@/components/ui/ToastContainer'
import { OfflineBanner }        from '@/components/layout/OfflineBanner'
import { InstallBanner }        from '@/components/pwa/InstallBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 minuti
      retry: 1,
    },
  },
})

// ------------------------------------------------------------
// Fix: nelle SPA il browser mantiene lo scroll offset della
// pagina precedente quando si naviga via client-side routing —
// ogni nuova schermata si apriva quindi "scrollata" invece che
// dall'inizio. router.subscribe() non richiede contesto React
// (a differenza di useLocation), utilizzabile qui fuori dalle route.
// ------------------------------------------------------------
function useScrollToTopOnNavigate() {
  const pathnameRef = useRef(window.location.pathname)

  useEffect(() => {
    return router.subscribe((state) => {
      if (state.location.pathname !== pathnameRef.current) {
        pathnameRef.current = state.location.pathname
        window.scrollTo(0, 0)
      }
    })
  }, [])
}

// ------------------------------------------------------------
// Gestore invito in sospeso — quando qualcuno apre un link di
// invito senza avere ancora un account, il token viene messo da
// parte (InvitoPage) prima di mandarlo a login/registrazione.
// Appena la sessione diventa attiva (login diretto, o ritorno da
// email di conferma), questo hook lo riprende automaticamente e
// lo fa entrare nel viaggio — senza che debba ripassare dal link.
//
// Fuori dal router (usa router.navigate() imperativo, non
// useNavigate) perché deve reagire a QUALSIASI transizione della
// sessione, non solo a un componente montato su una route precisa.
// ------------------------------------------------------------
function usePendingInviteHandler() {
  useEffect(() => {
    return useAuthStore.subscribe((state, prevState) => {
      const appenaAutenticato = !prevState.user && !!state.user
      if (!appenaAutenticato) return

      const token = getInvitoInSospeso()
      if (!token) return

      clearInvitoInSospeso()
      accettaInvito(token).then(({ viaggioId, error }) => {
        if (error || !viaggioId) {
          useToastStore.getState().addToast('Invito non valido o scaduto.', 'error')
          return
        }
        useToastStore.getState().addToast('Ti sei unito al viaggio!', 'success')
        router.navigate(`/viaggi/${viaggioId}`)
      })
    })
  }, [])
}

function AppInner() {
  useAuthListener()
  useScrollToTopOnNavigate()
  usePendingInviteHandler()
  return (
    <>
      <RouterProvider router={router} />
      {/* Infrastruttura globale — fuori dal router, sopravvive alle navigazioni */}
      <ToastContainer />
      <OfflineBanner />
      <InstallBanner />
    </>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
