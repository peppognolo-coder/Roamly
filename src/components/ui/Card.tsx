interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
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
        shadow-roamly
        ${paddingClasses[padding]}
        ${isClickable
          ? 'cursor-pointer hover:shadow-roamly-lg active:scale-[0.99] transition-all duration-150'
          : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  )
}
