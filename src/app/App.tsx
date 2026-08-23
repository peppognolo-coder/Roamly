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

function AppInner() {
  useAuthListener()
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
