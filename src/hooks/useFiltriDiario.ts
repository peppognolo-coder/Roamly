import { useState, useCallback } from 'react'
import type { Mood } from '@/types'
import type { FiltriDiario } from '@/lib/diario-utils'
import { haFiltriAttivi } from '@/lib/diario-utils'

// ============================================================
// useFiltriDiario — stato locale filtri del Diario
// Nessuna persistenza, nessuno store Zustand.
// I filtri si resettano ad ogni visita alla schermata.
// ============================================================

const FILTRI_INIZIALI: FiltriDiario = {
  mood: [],
  soloPreferiti: false,
  autori: [],
}

export function useFiltriDiario() {
  const [filtri, setFiltri] = useState<FiltriDiario>(FILTRI_INIZIALI)

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
  }, [])

  return {
    filtri,
    toggleMood,
    toggleAutore,
    togglePreferiti,
    resetFiltri,
    haNessunFiltro: !haFiltriAttivi(filtri),
  }
}
