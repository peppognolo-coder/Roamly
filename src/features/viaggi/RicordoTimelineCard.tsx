import { useNavigate }  from 'react-router-dom'
import { MOOD_OPTIONS }  from '@/types'
import type { Ricordo }  from '@/types'

// ============================================================
// RicordoTimelineCard — card ricordo nella timeline del viaggio
// Mostra: foto cover · titolo · luogo · mood badge · contatore foto
// Diversa da RicordoCard: layout verticale, cover più grande,
// mood badge sempre visibile, indicatore foto.
// ============================================================

interface RicordoTimelineCardProps {
  ricordo:    Ricordo
  coverUrl?:  string | null   // thumbnailSignedUrl da useCoversByViaggio
  fotoCount?: number          // numero foto del ricordo
}

const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-100 to-yellow-50',
  meravigliato: 'from-pink-100 to-rose-50',
  sereno:       'from-roamly-g7 to-roamly-g6',
  entusiasta:   'from-orange-100 to-amber-50',
  ispirato:     'from-violet-100 to-purple-50',
}

export function RicordoTimelineCard({
  ricordo,
  coverUrl,
  fotoCount = 0,
}: RicordoTimelineCardProps) {
  const navigate    = useNavigate()
  const moodOption  = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const gradient    = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g7 to-roamly-g6'

  const [dy, dm, dd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(dy, dm - 1, dd).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <button
      onClick={() => navigate(`/ricordi/${ricordo.id}`)}
      className="
        flex gap-0 overflow-hidden w-full text-left
        bg-white rounded-2xl
        border border-roamly-g6
        shadow-sm shadow-roamly-g0/5
        hover:shadow-md hover:border-roamly-g5
        active:scale-[0.99]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* ── Thumbnail (cover foto o gradient mood) ── */}
      <div className={`
        w-24 shrink-0 relative overflow-hidden
        bg-gradient-to-br ${gradient}
        flex items-center justify-center
      `}>
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Mood badge sulla foto */}
            <div className="
              absolute bottom-1.5 left-1.5
              w-6 h-6 rounded-full
              bg-black/40 backdrop-blur-sm
              flex items-center justify-center text-sm leading-none
            ">
              {moodOption?.emoji ?? '📝'}
            </div>
          </>
        ) : (
          <span className="text-3xl opacity-70">{moodOption?.emoji ?? '📝'}</span>
        )}

        {/* Contatore foto — visibile solo se > 1 */}
        {fotoCount > 1 && (
          <div className="
            absolute top-1.5 right-1.5
            px-1.5 py-0.5 rounded-md
            bg-black/50 backdrop-blur-sm
            flex items-center gap-0.5
          ">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="font-dm-mono text-[9px] text-white">
              {fotoCount}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenuto testuale ── */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        {/* Riga superiore: mood badge + preferito */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="
            font-dm-sans text-[10px] font-semibold uppercase tracking-wider
            text-roamly-text/40
          ">
            {moodOption?.label}
          </span>
          {ricordo.preferito && (
            <span className="text-xs leading-none ml-auto">❤️</span>
          )}
        </div>

        {/* Titolo */}
        <p className="font-lora text-base font-semibold text-roamly-g0 leading-snug line-clamp-2">
          {ricordo.titolo}
        </p>

        {/* Testo preview */}
        {ricordo.testo && (
          <p className="font-dm-sans text-xs text-roamly-text/50 mt-1 line-clamp-1 leading-relaxed">
            {ricordo.testo}
          </p>
        )}

        {/* Riga inferiore: luogo + data */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ricordo.luogo && (
            <span className="flex items-center gap-1 font-dm-sans text-xs text-roamly-text/40">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {ricordo.luogo}
            </span>
          )}
          <span className="font-dm-mono text-[10px] text-roamly-text/30 ml-auto">
            {dataFormattata}
          </span>
        </div>
      </div>
    </button>
  )
}
