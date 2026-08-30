import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    // Bug noto iOS Safari: un <input type="date"/"time"> VUOTO viene
    // renderizzato dal motore nativo con un'altezza quasi doppia rispetto
    // a quella impostata via CSS, ignorando h-11 — non succede da desktop
    // né quando il campo è già valorizzato. appearance-none forza il
    // controllo a rispettare le nostre dimensioni mantenendo comunque
    // il picker nativo al tap (comportamento invariato su iOS 15+).
    const isDateOrTime = type === 'date' || type === 'time'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-dm-sans font-medium text-roamly-text/70"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full h-11 px-4
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl
            font-dm-sans text-base text-roamly-text
            placeholder:text-roamly-text/30
            transition-all duration-150
            outline-none
            focus:border-roamly-g2 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
            ${isDateOrTime ? 'appearance-none leading-[2.75rem] py-0 [&::-webkit-date-and-time-value]:text-left' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs font-dm-sans text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs font-dm-sans text-roamly-text/40">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
