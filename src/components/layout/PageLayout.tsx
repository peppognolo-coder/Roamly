import { useBannerOffset } from '@/contexts/BannerOffsetContext'

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
  // Spazio base per la BottomNav (h-20 + margine) più l'eventuale
  // extra riservato quando OfflineBanner/InstallBanner sono visibili
  // (vedi BannerOffsetContext) — altrimenti quei banner finiscono
  // sopra l'ultimo contenuto reale della pagina invece che sotto.
  const { extraOffset } = useBannerOffset()

  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div
        className={`w-full max-w-[430px] relative ${className}`}
        style={withBottomNav ? { paddingBottom: 96 + extraOffset } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
