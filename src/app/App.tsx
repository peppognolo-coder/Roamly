import { useEffect, useRef } from 'react'
import { RouterProvider }       from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router }               from './router'
import { useAuthListener }      from '@/hooks/useAuth'
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

function AppInner() {
  useAuthListener()
  useScrollToTopOnNavigate()
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
