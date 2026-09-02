import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { MOOD_OPTIONS } from '@/types'
import { useAutoreRicordo } from '@/hooks/useAutoreRicordo'
import { AutoreBadge } from '@/components/ricordi/AutoreBadge'
import type { Ricordo } from '@/types'

// ============================================================
// RicordoCard — card per la lista ricordi in ViaggioDetailPage
//
// Layout strutturale in due zone:
//   LEFT  — thumbnail area (gradient + mood)
//           Struttura pronta per le foto V1.1 senza modifiche al layout.
//           La cover sarà fornita dalla tabella `foto` (is_cover=true) in V1.1.
//   RIGHT — contenuto testuale (titolo, luogo, data, preferito)
// ============================================================

interface RicordoCardProps {
  ricordo:   Ricordo
  coverUrl?: string | null   // thumbnailSignedUrl dalla tabella foto (anti-N+1)
  onClick?:  () => void
}

// Gradient per mood — placeholder visivo che rimane anche con la foto
// (sarà il fallback se la foto non carica in V1.1)
const MOOD_GRADIENT: Record<string, string> = {
  felice:      'from-amber-100 to-yellow-50',
  meravigliato:'from-pink-100 to-rose-50',
  sereno:      'from-roamly-g7 to-roamly-g6',
  entusiasta:  'from-orange-100 to-amber-50',
  ispirato:    'from-violet-100 to-purple-50',
}

export function RicordoCard({ ricordo, coverUrl, onClick }: RicordoCardProps) {
  const navigate = useNavigate()
  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g7 to-roamly-g6'
  const { autore } = useAutoreRicordo(ricordo)

  function handleClick() {
    if (onClick) {
      onClick()
    } else {
      navigate(`/ricordi/${ricordo.id}`)
    }
  }

  // Parsing locale: evita lo shift UTC che porta 'YYYY-MM-DD' a essere
  // interpretato come mezzanotte UTC, producendo "ieri" in timezone +2.
  const [dy, dm, dd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(dy, dm - 1, dd).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="
        flex gap-0 overflow-hidden
        bg-white rounded-2xl
        shadow-roamly
        cursor-pointer
        hover:shadow-roamly-lg
        active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* ── Thumbnail area ────────────────────────────────────────
          Se coverUrl è disponibile: foto di copertina + mood badge in basso.
          Fallback: gradient mood + emoji centrata (nessuna foto).
          ──────────────────────────────────────────────────────────── */}
      <div className={`
        w-20 shrink-0 relative overflow-hidden
        bg-gradient-to-br ${gradient}
        flex items-center justify-center
      `}>
        {coverUrl ? (
          <>
            {/* Foto di copertina */}
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Mood badge secondario — visibile sopra la foto */}
            <div className="
              absolute bottom-1.5 left-1.5
              w-6 h-6 rounded-full
              bg-black/40 backdrop-blur-sm
              flex items-center justify-center
              text-sm leading-none
            ">
              {moodOption?.emoji ?? '📝'}
            </div>
          </>
        ) : (
          <span className="text-3xl opacity-70">{moodOption?.emoji ?? '📝'}</span>
        )}
      </div>

      {/* ── Contenuto testuale ────────────────────────────────── */}
      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
        {/* Riga superiore: titolo + preferito */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-dm-sans font-semibold text-sm text-roamly-text leading-snug line-clamp-2 flex-1">
            {ricordo.titolo}
          </p>
          {ricordo.preferito && (
            <Heart size={14} className="fill-red-400 text-red-400 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Corpo: descrizione preview */}
        {ricordo.testo && (
          <p className="font-dm-sans text-xs text-roamly-text/50 mt-1 line-clamp-2 leading-relaxed">
            {ricordo.testo}
          </p>
        )}

        {/* Riga inferiore: luogo + autore (se collaborativo) + data */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ricordo.luogo && (
            <span className="flex items-center gap-1 font-dm-sans text-xs text-roamly-text/40">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {ricordo.luogo}
            </span>
          )}
          <span className="flex items-center gap-2 ml-auto shrink-0">
            {autore && <AutoreBadge nome={autore.nome} avatarUrl={autore.avatarUrl} size="xs" />}
            <span className="font-dm-mono text-[10px] text-roamly-text/30">
              {dataFormattata}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
