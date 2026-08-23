interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  withBottomNav?: boolean
}

export function PageLayout({
  children,
  className = '',
  withBottomNav = true,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div
        className={`
          w-full max-w-[430px] relative
          ${withBottomNav ? 'pb-24' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  )
}
