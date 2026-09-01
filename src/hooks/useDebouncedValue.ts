import { useEffect, useState } from 'react'

// ============================================================
// ROAMLY — useDebouncedValue
// Ritarda la propagazione di un valore che cambia rapidamente
// (es. digitazione in un campo di ricerca) di `delayMs`.
// ============================================================

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
