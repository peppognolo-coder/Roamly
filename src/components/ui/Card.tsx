interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
}: CardProps) {
  const isClickable = !!onClick

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => e.key === 'Enter' && onClick?.()
          : undefined
      }
      className={`
        bg-white rounded-2xl
        border border-roamly-g6
        shadow-sm shadow-roamly-g0/5
        ${paddingClasses[padding]}
        ${isClickable
          ? 'cursor-pointer hover:shadow-md hover:border-roamly-g5 active:scale-[0.99] transition-all duration-150'
          : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}
