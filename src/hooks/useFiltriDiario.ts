import { useState, useCallback, useEffect } from 'react'
import type { Mood } from '@/types'
import type { FiltriDiario } from '@/lib/diario-utils'
import { haFiltriAttivi } from '@/lib/diario-utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

// ============================================================
// useFiltriDiario — stato locale filtri del Diario
// Nessuna persistenza, nessuno store Zustand.
// I filtri si resettano ad ogni visita alla schermata.
//
// Ricerca testuale: `ricercaInput` è il valore immediato del
// campo (per un input reattivo, senza scatti), `filtri.ricerca`
// è la versione debounced (250ms) che alimenta effettivamente
// il filtro — evita di rifiltrare/rirenderizzare la timeline ad
// ogni singolo carattere digitato.
// ============================================================

const FILTRI_INIZIALI: FiltriDiario = {
  mood: [],
  soloPreferiti: false,
  autori: [],
  ricerca: '',
}

export function useFiltriDiario() {
  const [filtri, setFiltri] = useState<FiltriDiario>(FILTRI_INIZIALI)
  const [ricercaInput, setRicercaInput] = useState('')
  const ricercaDebounced = useDebouncedValue(ricercaInput, 250)

  useEffect(() => {
    setFiltri((prev) => ({ ...prev, ricerca: ricercaDebounced }))
  }, [ricercaDebounced])

  const toggleMood = useCallback((mood: Mood) => {
    setFiltri((prev) => {
      const presente = prev.mood.includes(mood)
      return {
        ...prev,
        mood: presente
          ? prev.mood.filter((m) => m !== mood)
          : [...prev.mood, mood],
      }
    })
  }, [])

  const toggleAutore = useCallback((userId: string) => {
    setFiltri((prev) => {
      const presente = prev.autori.includes(userId)
      return {
        ...prev,
        autori: presente
          ? prev.autori.filter((id) => id !== userId)
          : [...prev.autori, userId],
      }
    })
  }, [])

  const togglePreferiti = useCallback(() => {
    setFiltri((prev) => ({ ...prev, soloPreferiti: !prev.soloPreferiti }))
  }, [])

  const resetFiltri = useCallback(() => {
    setFiltri(FILTRI_INIZIALI)
    setRicercaInput('')
  }, [])

  return {
    filtri,
    ricercaInput,
    setRicercaInput,
    toggleMood,
    toggleAutore,
    togglePreferiti,
    resetFiltri,
    haNessunFiltro: !haFiltriAttivi(filtri),
  }
}
