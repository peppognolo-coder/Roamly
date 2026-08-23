import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

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
