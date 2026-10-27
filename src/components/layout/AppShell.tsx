import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageSkeleton } from '@/components/layout/PageSkeleton'

// ============================================================
// AppShell — layout condiviso delle schermate "principali" (quelle
// che hanno la barra in basso: Home, Diario, Pianifica, Profilo,
// lista e dettaglio viaggio, dettaglio ricordo...).
//
// Prima ogni pagina montava la propria <BottomNav /> e il proprio
// AuthGuard: a ogni cambio di schermata la barra veniva smontata e
// rimontata, e non poteva animare nulla tra una tab e l'altra. Ora la
// barra vive qui, fuori dall'Outlet: resta la stessa istanza mentre
// cambia la pagina, e l'AuthGuard (onboarding, referral) gira una
// volta sola per sessione invece che a ogni navigazione.
//
// Il Suspense è dentro la shell e la barra fuori: mentre si scarica
// il chunk di una pagina lazy compare lo skeleton ma la barra resta
// visibile e tappabile.
// ============================================================

export function AppShell() {
  return (
    <AuthGuard>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
      <BottomNav />
    </AuthGuard>
  )
}
