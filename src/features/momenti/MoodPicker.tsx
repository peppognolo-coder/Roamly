import { useState } from 'react'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { MOOD_FAMIGLIE, MOOD_PROMPT } from '@/types'
import type { Mood } from '@/types'

// ============================================================
// MoodPicker — venti mood in quattro famiglie (Gioia · Meraviglia ·
// Calma · Fatica): cinque per volta, un tocco per cambiare famiglia.
// Il puntino corallo sulla linguetta dice in quale famiglia sta il
// mood scelto. Sotto il picker, la domanda guida del mood scelto.
// Icone: MoodIcon (direzione 1b). Il nome resta anche in aria-label.
// ============================================================

interface MoodPickerProps {
  value: Mood | null
  onChange: (mood: Mood) => void
  error?: string
}

export function MoodPicker({ value, onChange, error }: MoodPickerProps) {
  const famigliaDelValore = MOOD_FAMIGLIE.find((f) => value && f.moods.includes(value))
  const [famigliaId, setFamigliaId] = useState(famigliaDelValore?.id ?? MOOD_FAMIGLIE[0].id)
  const famiglia = MOOD_FAMIGLIE.find((f) => f.id === famigliaId) ?? MOOD_FAMIGLIE[0]

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-dm-sans font-medium text-roamly-text/70">
        Come ti senti? <span className="text-red-400">*</span>
      </label>

      {/* Linguette famiglie */}
      <div role="tablist" className="grid grid-cols-4 gap-1 p-1 rounded-full bg-roamly-g7 border border-roamly-g6">
        {MOOD_FAMIGLIE.map((f) => {
          const attiva = f.id === famiglia.id
          const contieneValore = f.id === famigliaDelValore?.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={attiva}
              onClick={() => setFamigliaId(f.id)}
              className={`
                relative h-[34px] rounded-full
                font-dm-sans text-xs font-medium
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                ${attiva ? 'bg-white text-roamly-g0 shadow-roamly' : 'text-roamly-g2'}
              `}
            >
              {f.label}
              {contieneValore && (
                <span className="absolute top-1.5 right-2 w-[5px] h-[5px] rounded-full bg-roamly-coral" />
              )}
            </button>
          )
        })}
      </div>

      {/* Cinque mood della famiglia */}
      <div className="grid grid-cols-5 gap-1">
        {famiglia.moods.map((mood) => {
          const selezionato = value === mood
          const label = mood.charAt(0).toUpperCase() + mood.slice(1)
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onChange(mood)}
              title={label}
              aria-label={label}
              aria-pressed={selezionato}
              className={`
                flex flex-col items-center gap-1.5
                pt-2.5 pb-2 px-0.5 rounded-2xl
                border-[1.5px] transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                active:scale-95
                ${selezionato
                  ? 'bg-white border-roamly-g0 shadow-roamly-lg'
                  : 'border-transparent hover:bg-roamly-g7'
                }
              `}
            >
              <MoodIcon mood={mood} size={36} />
              <span className={`font-dm-sans text-[10.5px] leading-none ${selezionato ? 'font-semibold text-roamly-g0' : 'font-medium text-roamly-g2'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Domanda guida del mood scelto */}
      {value && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-roamly-g7">
          <MoodIcon mood={value} size={28} />
          <p className="font-lora text-sm text-roamly-g0">{MOOD_PROMPT[value]}</p>
        </div>
      )}

      {error && (
        <p className="text-xs font-dm-sans text-red-500">{error}</p>
      )}
    </div>
  )
}
