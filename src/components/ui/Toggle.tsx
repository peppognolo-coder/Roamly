// ============================================================
// ROAMLY — Toggle
// Interruttore on/off, stile pillola — riutilizzabile ovunque
// serva un booleano (qui: preferenze di notifica).
// ============================================================

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  ariaLabel?: string
}

export function Toggle({ checked, onChange, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative w-11 h-6 rounded-full shrink-0
        transition-colors duration-200
        disabled:opacity-50
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        ${checked ? 'bg-roamly-coral' : 'bg-roamly-g5'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5
          w-5 h-5 rounded-full bg-white shadow
          transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}
