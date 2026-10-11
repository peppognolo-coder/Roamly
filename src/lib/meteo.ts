import type { Meteo } from '@/types'

// ============================================================
// ROAMLY — Meteo del giorno (Open-Meteo)
// Gratuito, senza API key. Dato giornaliero per data + coordinate:
// il "forecast" copre gli ultimi ~90 giorni e i prossimi, l'"archive"
// il passato più lontano. Serve solo a PRE-COMPILARE il ricordo:
// l'utente può sempre cambiarlo, e se la rete manca il campo resta
// semplicemente vuoto.
// ============================================================

export interface MeteoGiorno {
  meteo: Meteo
  temperatura: number // °C, massima del giorno, arrotondata
}

/** Codici WMO (Open-Meteo) → categoria Roamly. */
export function meteoDaCodiceWmo(code: number): Meteo {
  if (code === 0 || code === 1) return 'sole'
  if (code === 2 || code === 3) return 'nuvoloso'
  if (code === 45 || code === 48) return 'nebbia'
  if (code >= 51 && code <= 67) return 'pioggia'
  if (code >= 71 && code <= 77) return 'neve'
  if (code >= 80 && code <= 82) return 'pioggia'
  if (code === 85 || code === 86) return 'neve'
  if (code >= 95) return 'temporale'
  return 'nuvoloso'
}

interface RispostaOpenMeteo {
  daily?: {
    weather_code?: (number | null)[]
    temperature_2m_max?: (number | null)[]
    wind_speed_10m_max?: (number | null)[]
  }
}

const GIORNI_FORECAST = 80 // margine sotto il limite di 92 di past_days

export async function getMeteoGiorno(
  data: string,
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<MeteoGiorno | null> {
  const giorniFa = (Date.now() - new Date(`${data}T12:00:00`).getTime()) / 86_400_000
  if (Number.isNaN(giorniFa) || giorniFa < -14) return null // troppo nel futuro

  const base =
    giorniFa > GIORNI_FORECAST
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast'

  const url =
    `${base}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&start_date=${data}&end_date=${data}` +
    `&daily=weather_code,temperature_2m_max,wind_speed_10m_max&timezone=auto`

  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as RispostaOpenMeteo

  const code = json.daily?.weather_code?.[0]
  const tmax = json.daily?.temperature_2m_max?.[0]
  const vento = json.daily?.wind_speed_10m_max?.[0]
  if (code == null || tmax == null) return null

  let meteo = meteoDaCodiceWmo(code)
  // Giornata "per il resto buona" ma molto ventosa (> 40 km/h): vento
  if ((meteo === 'sole' || meteo === 'nuvoloso') && vento != null && vento > 40) meteo = 'vento'

  return { meteo, temperatura: Math.round(tmax) }
}
