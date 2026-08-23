import { useState, useEffect, useCallback } from 'react'

// ============================================================
// useCollapseViaggi — stato collapse locale delle sezioni viaggio
// Default: tutti espansi.
// Stato: Set<string> degli ID espansi.
// Quando arrivano nuovi ID (nuovi viaggi), vengono aggiunti
// automaticamente al Set (espansi di default).
// Nessuna persistenza — si resetta ad ogni montaggio del Diario.
// ============================================================

export function useCollapseViaggi(ids: string[]) {
  // Inizializzazione: tutti gli ID correnti sono espansi
  const [espansi, setEspansi] = useState<Set<string>>(() => new Set(ids))

  // Quando la lista degli ID cambia (nuovo viaggio aggiunto),
  // aggiunge i nuovi ID al Set senza toccare quelli già gestiti
  useEffect(() => {
    setEspansi((prev) => {
      const aggiornato = new Set(prev)
      let cambiato = false
      for (const id of ids) {
        if (!aggiornato.has(id)) {
          aggiornato.add(id)
          cambiato = true
        }
      }
      // Restituisce lo stesso Set se non è cambiato nulla — evita re-render
      return cambiato ? aggiornato : prev
    })
  }, [ids])

  const isExpanded = useCallback(
    (id: string) => espansi.has(id),
    [espansi]
  )

  const toggle = useCallback((id: string) => {
    setEspansi((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setEspansi(new Set(ids))
  }, [ids])

  return { isExpanded, toggle, expandAll }
}
