import { useState } from 'react'
import { Loader2, Music2, X } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSpotifySearch } from '@/hooks/useSpotifySearch'
import type { SpotifyTrackSelezionato } from '@/types'

// ============================================================
// ROAMLY — SpotifyTrackPicker
// Campo "colonna sonora" del ricordo: ricerca brani Spotify in
// tempo reale (stesso pattern di LuogoSearchInput) finché non è
// stato scelto un brano, poi mostra una card compatta col brano
// selezionato e un tasto per rimuoverlo.
// ============================================================

interface SpotifyTrackPickerProps {
  value: SpotifyTrackSelezionato | null
  onChange: (track: SpotifyTrackSelezionato | null) => void
  error?: string
}

export function SpotifyTrackPicker({ value, onChange, error }: SpotifyTrackPickerProps) {
  const [query, setQuery] = useState('')
  const [aperto, setAperto] = useState(false)

  const queryDebounced = useDebouncedValue(query, 450)
  const { data: risultati = [], isFetching } = useSpotifySearch(queryDebounced)

  const mostraDropdown = aperto && queryDebounced.trim().length >= 2

  // ── Brano già selezionato ───────────────────────────────────
  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70">
          Colonna sonora <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </label>
        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-roamly-g7 border border-roamly-g5 rounded-2xl">
          {value.immagineUrl ? (
            <img
              src={value.immagineUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g3">
              <Music2 size={16} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-dm-sans text-sm font-medium text-roamly-text truncate">
              {value.nome}
            </p>
            <p className="font-dm-sans text-xs text-roamly-text/45 truncate mt-0.5">
              {value.artista}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="
              shrink-0 w-7 h-7 rounded-full
              flex items-center justify-center
              bg-white text-roamly-text/40
              hover:text-roamly-text/70 transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
            aria-label="Rimuovi brano"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  // ── Ricerca ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70">
        Colonna sonora <span className="text-roamly-text/35 font-normal">(opzionale)</span>
      </label>

      <div className="relative">
        <Music2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-roamly-g3" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setAperto(true)
          }}
          onFocus={() => setAperto(true)}
          onBlur={() => setTimeout(() => setAperto(false), 150)}
          placeholder="Cerca un brano o un artista..."
          autoComplete="off"
          className={`
            w-full h-[46px] pl-10 pr-10
            bg-white border border-roamly-g5
            rounded-2xl
            font-dm-sans text-sm text-roamly-text
            placeholder:text-roamly-text/30
            transition-all duration-150
            outline-none
            focus:border-roamly-g3 focus:ring-2 focus:ring-roamly-g3/20
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
            max-h-72 overflow-y-auto
          "
        >
          {risultati.map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => {
                // onMouseDown (non onClick) così scatta prima del
                // blur dell'input — stesso motivo di LuogoSearchInput.
                e.preventDefault()
                onChange(r)
                setQuery('')
                setAperto(false)
              }}
              className="
                w-full flex items-center gap-3 px-3.5 py-2.5 text-left
                hover:bg-roamly-g7 transition-colors duration-100
              "
            >
              {r.immagineUrl ? (
                <img src={r.immagineUrl} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-md bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g3">
                  <Music2 size={13} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans text-sm text-roamly-text truncate">{r.nome}</p>
                <p className="font-dm-sans text-xs text-roamly-text/40 truncate">{r.artista}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {mostraDropdown && !isFetching && risultati.length === 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1 z-20
          bg-white rounded-2xl shadow-roamly-lg border border-roamly-g6
          px-3.5 py-3
        ">
          <p className="font-dm-sans text-xs text-roamly-text/40">Nessun brano trovato.</p>
        </div>
      )}
    </div>
  )
}
