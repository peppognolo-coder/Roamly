import { useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useLuogoSearch } from '@/hooks/useLuogoSearch'
import type { RisultatoGeocoding, BiasGeocoding } from '@/lib/geocoding'

// ============================================================
// ROAMLY — LuogoSearchInput
// Campo indirizzo con ricerca luoghi (Nominatim) in tempo reale.
// Selezionare un suggerimento imposta anche lat/lng — è l'unica
// azione che li scrive: digitare liberamente senza selezionare
// non tocca coordinate già presenti (es. impostate toccando la
// mappa in Attività), evitando di "spostare" una tappa per sbaglio
// mentre si corregge solo il testo dell'indirizzo.
//
// `bias` (opzionale): dà priorità ai risultati vicini alla
// destinazione di un viaggio specifico, invece di una ricerca
// puramente globale — vedi BiasGeocoding.
// ============================================================

interface LuogoSearchInputProps {
  label?: string
  placeholder?: string
  value: string
  onChangeValue: (text: string) => void
  onSelectLuogo: (luogo: RisultatoGeocoding) => void
  error?: string
  bias?: BiasGeocoding
}

export function LuogoSearchInput({
  label,
  placeholder,
  value,
  onChangeValue,
  onSelectLuogo,
  error,
  bias,
}: LuogoSearchInputProps) {
  const [aperto, setAperto] = useState(false)

  const queryDebounced = useDebouncedValue(value, 450)
  const { data: risultati = [], isFetching } = useLuogoSearch(queryDebounced, bias)

  const mostraDropdown = aperto && queryDebounced.trim().length >= 3

  return (
    <div className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-sm font-dm-sans font-medium text-roamly-text/70">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChangeValue(e.target.value)
            setAperto(true)
          }}
          onFocus={() => setAperto(true)}
          onBlur={() => setTimeout(() => setAperto(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            w-full h-11 pl-4 pr-10
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl
            font-dm-sans text-base text-roamly-text
            placeholder:text-roamly-text/30
            transition-all duration-150
            outline-none
            focus:border-roamly-g2 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
          `}
        />
        {isFetching && (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-roamly-g3"
          />
        )}
      </div>

      {error && <p className="text-xs font-dm-sans text-red-500">{error}</p>}

      {mostraDropdown && risultati.length > 0 && (
        <div
          className="
            absolute top-full left-0 right-0 mt-1 z-20
            bg-white rounded-2xl shadow-roamly-lg
            border border-roamly-g6 overflow-hidden
            max-h-60 overflow-y-auto
          "
        >
          {risultati.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              type="button"
              onMouseDown={(e) => {
                // onMouseDown (non onClick) così scatta prima del
                // blur dell'input, che altrimenti chiuderebbe il
                // dropdown prima che il click venga registrato.
                e.preventDefault()
                onChangeValue(r.label)
                onSelectLuogo(r)
                setAperto(false)
              }}
              className="
                w-full flex items-start gap-2 px-3.5 py-2.5 text-left
                hover:bg-roamly-g7 transition-colors duration-100
              "
            >
              <MapPin size={14} className="text-roamly-g3 mt-0.5 shrink-0" />
              <span className="font-dm-sans text-sm text-roamly-text leading-snug">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
