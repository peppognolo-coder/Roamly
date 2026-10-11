import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Aggiunge "(opzionale)" accanto al label, con lo stesso stile leggero
   *  usato per gli altri campi opzionali (es. Note) — evita disallineamenti
   *  di peso/colore tra i vari campi opzionali del form. */
  optional?: boolean
  error?: string
  hint?: string
  /** Elemento a destra dentro il campo (es. "Mostra" nella password). */
  trailing?: React.ReactNode
}

// Design: campo da 48px, sfondo roamly-bg, bordo g5, raggio 16.
// Al focus il bordo passa a g3 con un anello da 1px (≈ 1,5px totali)
// senza spostare il layout.
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, optional, error, hint, trailing, className = '', id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    // Bug noto iOS Safari: un <input type="date"/"time"> VUOTO viene
    // renderizzato dal motore nativo con un'altezza quasi doppia rispetto
    // a quella impostata via CSS, ignorando h-12 — non succede da desktop
    // né quando il campo è già valorizzato. appearance-none forza il
    // controllo a rispettare le nostre dimensioni mantenendo comunque
    // il picker nativo al tap (comportamento invariato su iOS 15+).
    const isDateOrTime = type === 'date' || type === 'time'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-dm-sans font-medium text-roamly-ink"
          >
            {label}
            {optional && (
              <span className="text-roamly-muted font-normal"> (opzionale)</span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`
              w-full h-12 px-4
              bg-roamly-bg border border-roamly-g5
              rounded-2xl
              font-dm-sans text-base text-roamly-text
              placeholder:text-roamly-muted
              transition-all duration-150
              outline-none
              focus:border-roamly-g3 focus:bg-white focus:ring-1 focus:ring-roamly-g3
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''}
              ${isDateOrTime ? 'appearance-none leading-[3rem] py-0 [&::-webkit-date-and-time-value]:text-left' : ''}
              ${trailing ? 'pr-20' : ''}
              ${className}
            `}
            {...props}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              {trailing}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-dm-sans text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs font-dm-sans text-roamly-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
