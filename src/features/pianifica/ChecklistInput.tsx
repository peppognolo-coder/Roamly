import { useState, useRef } from 'react'

// ============================================================
// ChecklistInput — campo inline per aggiungere un nuovo item
// Submit su Enter o tap sul pulsante +
// ============================================================

interface ChecklistInputProps {
  onAdd:      (testo: string) => void
  isLoading:  boolean
  placeholder?: string
}

export function ChecklistInput({
  onAdd,
  isLoading,
  placeholder = 'Aggiungi un punto...',
}: ChecklistInputProps) {
  const [testo, setTesto] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    const trimmed = testo.trim()
    if (!trimmed || isLoading) return
    onAdd(trimmed)
    setTesto('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="
          flex-1 h-10 px-3
          bg-roamly-g7 border border-roamly-g5
          rounded-xl
          font-dm-sans text-sm text-roamly-text
          placeholder:text-roamly-text/30
          outline-none
          focus:border-roamly-g2 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
          disabled:opacity-50
          transition-all duration-150
        "
      />
      <button
        onClick={handleSubmit}
        disabled={!testo.trim() || isLoading}
        className="
          w-10 h-10 rounded-xl shrink-0
          bg-roamly-g0 hover:bg-roamly-g1
          flex items-center justify-center
          transition-all duration-150
          disabled:opacity-30 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          active:scale-95
        "
        aria-label="Aggiungi punto"
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </button>
    </div>
  )
}
