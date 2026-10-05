import { MOOD_OPTIONS } from '@/types'
import type { Mood } from '@/types'
import { MoodIcon } from '@/components/ui/MoodIcon'

// ============================================================
// MoodPicker — selezione mood, solo emoji (senza etichetta a vista,
// per non affollare la griglia con 10 opzioni) — il nome resta
// comunque leggibile al tap/hover (title) e agli screen reader
// (aria-label), non è rimosso, solo non stampato sotto l'emoji.
// Design: facilmente tappabile su mobile, chiaro a colpo d'occhio.
// ============================================================

interface MoodPickerProps {
  value: Mood | null
  onChange: (mood: Mood) => void
  error?: string
}

export function MoodPicker({ value, onChange, error }: MoodPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-dm-sans font-medium text-roamly-text/70">
        Come ti senti? <span className="text-red-400">*</span>
      </label>

      <div className="grid grid-cols-5 gap-2">
        {MOOD_OPTIONS.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              title={option.label}
              aria-label={option.label}
              aria-pressed={isSelected}
              className={`
                flex items-center justify-center
                py-3 px-1
                rounded-2xl border
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                active:scale-95
                ${isSelected
                  ? 'bg-roamly-g0 border-roamly-g0 shadow-md shadow-roamly-g0/20'
                  : 'bg-roamly-g7 border-roamly-g6 hover:border-roamly-g4 hover:bg-roamly-g6'
                }
              `}
            >
              <span className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-150 ${isSelected ? 'bg-roamly-g7' : ''}`}>
                <MoodIcon mood={option.value} size={32} />
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs font-dm-sans text-red-500">{error}</p>
      )}
    </div>
  )
}
