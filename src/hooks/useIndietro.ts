import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { percorsoGenitore } from '@/lib/navigation'

// ============================================================
// useIndietro — handler per il tasto "indietro".
// Se la pagina ha una cronologia interna all'app → navigate(-1).
// Se è la prima voce (location.key === 'default': link diretto,
// invito, notifica push) → va alla rotta genitore, in replace, così
// "indietro" non esce mai dall'app. Stesso criterio già usato in
// NuovoRicordoPage e LuoghiSalvatiPage.
// ============================================================

export function useIndietro(fallback?: string) {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate(fallback ?? percorsoGenitore(location.pathname), { replace: true })
    }
  }, [navigate, location.key, location.pathname, fallback])
}
