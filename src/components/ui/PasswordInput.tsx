import { forwardRef, useState } from 'react'
import { Input } from './Input'

// ============================================================
// PasswordInput — Input con "Mostra / Nascondi" a destra (design
// Accesso). Stesse props di Input, tranne `type` e `trailing`.
// ============================================================

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type' | 'trailing'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visibile, setVisibile] = useState(false)

    return (
      <Input
        ref={ref}
        type={visibile ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisibile((v) => !v)}
            aria-pressed={visibile}
            className="
              font-dm-sans text-xs font-medium text-roamly-g2
              rounded-md px-1 py-1
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            "
          >
            {visibile ? 'Nascondi' : 'Mostra'}
          </button>
        }
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
