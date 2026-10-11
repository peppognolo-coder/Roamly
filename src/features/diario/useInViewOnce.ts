import { useEffect, useRef, useState } from 'react'

// true appena l'elemento si avvicina allo schermo (e resta true).
// Serve a non lanciare decine di richieste foto per card ancora lontane.
export function useInViewOnce<T extends Element>(margine = '300px') {
  const ref = useRef<T | null>(null)
  const [visto, setVisto] = useState(false)

  useEffect(() => {
    if (visto) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setVisto(true); return }
    const obs = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setVisto(true); obs.disconnect() } },
      { rootMargin: margine }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [visto, margine])

  return { ref, visto }
}
