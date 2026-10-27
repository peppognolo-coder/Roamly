import { useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'

// ============================================================
// RootLayout — radice di tutte le rotte. Si occupa di una cosa: quando
// si va a una pagina NUOVA (push/replace, non "indietro") la scroll
// torna in cima.
//
// Sta qui, in un layout effect, e non in un listener del router perché
// con le View Transitions il cambio di pagina avviene in due tempi: il
// browser scatta prima la foto della pagina vecchia, poi React rende
// la nuova. Un scrollTo(0, 0) fatto subito dal listener spostava la
// pagina vecchia in cima prima della foto (scatto visibile). Il layout
// effect gira invece dopo il render della pagina nuova, dentro la
// transizione. "Indietro" (POP) non passa di qui: il ripristino della
// posizione resta in App.tsx (useScrollToTopOnNavigate).
// ============================================================

export function RootLayout() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useLayoutEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0)
    // Solo al cambio di pagina: cambiare tab (?tab=) non deve riportare in cima
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return <Outlet />
}
