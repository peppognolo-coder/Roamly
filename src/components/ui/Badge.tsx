// ============================================================
// Badge — chip generico riutilizzabile (stati, mood, tag)
// ============================================================

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'info'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-roamly-text/5   text-roamly-text/50 border-roamly-text/10',
  success: 'bg-roamly-g3/15    text-roamly-g1       border-roamly-g3/30',
  warning: 'bg-amber-100       text-amber-700        border-amber-200',
  info:    'bg-roamly-g6       text-roamly-g2        border-roamly-g5',
}

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-roamly-text/40',
  success: 'bg-roamly-g3',
  warning: 'bg-amber-500',
  info:    'bg-roamly-g3',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        border rounded-full font-dm-sans font-medium
        ${size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClasses[variant]}`} />
      )}
      {children}
    </span>
  )
}
