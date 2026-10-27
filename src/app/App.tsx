import { useEffect, useRef } from 'react'
import { RouterProvider }       from 'react-router-dom'
import { MotionConfig }         from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router }               from './router'
import { useAuthListener, useAuth } from '@/hooks/useAuth'
import { useAuthStore }         from '@/store/authStore'
import { useToastStore }        from '@/store/toastStore'
import { getInvitoInSospeso, clearInvitoInSospeso, accettaInvito } from '@/services/invitiService'
import { ToastContainer }       from '@/components/ui/ToastContainer'
import { OfflineBanner }        from '@/components/layout/OfflineBanner'
import { InstallBanner }        from '@/components/pwa/InstallBanner'
import { BannerOffsetProvider } from '@/contexts/BannerOffsetContext'

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
  const keyRef = useRef(router.state.location.key)

  // Disattiva il ripristino automatico dello scroll del browser: lo
  // gestiamo noi, sia per navigazione avanti (sempre dall'inizio) sia per
  // "indietro" (si torna esattamente dove si era).
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Memorizza la posizione di scroll per ogni voce della cronologia
  useEffect(() => {
    const salva = () => {
      try {
        sessionStorage.setItem(`roamly:scroll:${keyRef.current}`, String(Math.round(window.scrollY)))
      } catch { /* storage non disponibile: si riparte dall'alto */ }
    }
    window.addEventListener('scroll', salva, { passive: true })
    return () => window.removeEventListener('scroll', salva)
  }, [])

  useEffect(() => {
    return router.subscribe((state) => {
      const cambiataVoce = state.location.key !== keyRef.current
      keyRef.current = state.location.key

      if (!cambiataVoce) return

      // "Indietro": torna alla posizione salvata di quella voce. La pagina
      // può caricare i contenuti con un attimo di ritardo (skeleton → dati),
      // quindi si riprova per ~1,5 s, fermandosi se l'utente scorre.
      if (state.historyAction === 'POP') {
        let y = 0
        try { y = Number(sessionStorage.getItem(`roamly:scroll:${state.location.key}`)) || 0 } catch { /* noop */ }
        if (y > 0) {
          let tentativi = 0
          let interrotto = false
          const ferma = () => { interrotto = true }
          window.addEventListener('touchstart', ferma, { once: true, passive: true })
          window.addEventListener('wheel', ferma, { once: true, passive: true })
          const tick = () => {
            window.scrollTo(0, y)
            tentativi++
            if (!interrotto && tentativi < 90 && Math.abs(window.scrollY - y) > 2) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          return
        }
        // Nessuna posizione salvata (o era in cima): si riparte dall'alto
        window.scrollTo(0, 0)
        return
      }

      // Push/replace verso una pagina nuova: la scroll in cima la fa
      // RootLayout (layout effect), dopo il render e dentro l'eventuale View
      // Transition. Farla qui sposterebbe la pagina vecchia prima che il
      // browser ne scatti la foto.
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

// ------------------------------------------------------------
// Splash di apertura (index.html): dice alla splash che l'app è pronta
// quando la sessione è stata letta (isLoading false) e la prima schermata
// è montata. Due requestAnimationFrame di margine perché il cambio da
// "carico la sessione" alla pagina vera arrivi al primo paint prima che
// la splash cominci a sfumare. La splash ha già durata minima e massima.
// ------------------------------------------------------------
function useSplashPronta() {
  const { isLoading } = useAuth()
  useEffect(() => {
    if (isLoading) return
    let f2 = 0
    const f1 = requestAnimationFrame(() => {
      f2 = requestAnimationFrame(() => window.__roamlySplash?.ready())
    })
    return () => { cancelAnimationFrame(f1); cancelAnimationFrame(f2) }
  }, [isLoading])
}

function AppInner() {
  useAuthListener()
  useSplashPronta()
  useScrollToTopOnNavigate()
  usePendingInviteHandler()
  return (
    <BannerOffsetProvider>
      <RouterProvider router={router} />
      {/* Infrastruttura globale — fuori dal router, sopravvive alle navigazioni */}
      <ToastContainer />
      <OfflineBanner />
      <InstallBanner />
    </BannerOffsetProvider>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": con "Riduci movimento" attivo nel sistema,
          framer-motion toglie gli spostamenti (y, x, scale) e lascia solo
          le dissolvenze. */}
      <MotionConfig reducedMotion="user">
        <AppInner />
      </MotionConfig>
    </QueryClientProvider>
  )
}
