// ============================================================
// RoamlyMark — il sentiero, segno del brand (logo 3c).
// Due bordi in prospettiva + punto corallo all'orizzonte; la
// mezzeria compare solo quando c'è spazio (>= 40px), sotto
// resterebbe una macchia.
//
// `ink` è il colore dei bordi: bianco su fondi scuri/gradienti
// (default), blu notte su fondi chiari. Il punto resta sempre corallo.
// Inline SVG (non <img>) così html-to-image lo esporta nelle share
// card senza passare da fetch/CORS.
// ============================================================

interface RoamlyMarkProps {
  size?:      number
  ink?:       string
  dashColor?: string
  className?: string
  title?:     string
}

export function RoamlyMark({
  size = 24,
  ink = '#FFFFFF',
  dashColor = '#5FB8D9',
  className,
  title,
}: RoamlyMarkProps) {
  const conMezzeria = size >= 40
  const spessore = size >= 40 ? 3.6 : 5

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M15 52 L28.8 25" stroke={ink} strokeWidth={spessore} strokeLinecap="round" />
      <path d="M49 52 L35.2 25" stroke={ink} strokeWidth={spessore} strokeLinecap="round" />
      {conMezzeria && (
        <>
          <path d="M32 50 L32 45" stroke={dashColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M32 40 L32 36.5" stroke={dashColor} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      <circle cx="32" cy="20" r={size >= 40 ? 4.6 : 5.6} fill="#FF6B4A" />
    </svg>
  )
}
