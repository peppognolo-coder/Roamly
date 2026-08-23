import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-roamly-g0 text-white
    shadow-roamly
    hover:bg-roamly-g1
    active:bg-roamly-g2
    disabled:bg-roamly-g5 disabled:text-white/60 disabled:shadow-none
  `,
  secondary: `
    bg-roamly-g6 text-roamly-g0
    hover:bg-roamly-g5
    active:bg-roamly-g4/30
    border border-roamly-g5
    disabled:opacity-50
  `,
  ghost: `
    bg-transparent text-roamly-g1
    hover:bg-roamly-g6
    active:bg-roamly-g5/40
    disabled:opacity-40
  `,
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-base rounded-xl',
  lg: 'h-13 px-6 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          font-dm-sans font-medium
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          select-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
