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

  // Spazio sotto il contenuto: barra (80px) + margine + banner + area sicura
  // del dispositivo (la barra a casa di iPhone/iPad). Le pagine usano
  // min-h-screen al loro interno: globals.css (.roamly-page) sottrae questo
  // spazio, così pagina + spazio = esattamente l'altezza dello schermo e
  // non compare uno scorrimento di troppo.
  const spazio = withBottomNav
    ? `calc(${96 + extraOffset}px + env(safe-area-inset-bottom, 0px))`
    : '0px'

  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div
        className={`roamly-page w-full max-w-[430px] relative ${className}`}
        style={{ '--roamly-spazio': spazio, paddingBottom: 'var(--roamly-spazio)' } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
