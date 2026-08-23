import type { FotoConUrl } from '@/types'

// ============================================================
// FotoThumbnail — singola foto nella galleria
// Mostra la thumbnail firmata, con pulsante elimina.
// Tap sulla thumbnail → callback onOpen per lightbox/fullscreen.
// ============================================================

interface FotoThumbnailProps {
  foto:      FotoConUrl
  onOpen:    (foto: FotoConUrl) => void
  onDelete:  (foto: FotoConUrl) => void
  isDeleting: boolean
}

export function FotoThumbnail({
  foto,
  onOpen,
  onDelete,
  isDeleting,
}: FotoThumbnailProps) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden group">
      {/* Immagine thumbnail */}
      <button
        onClick={() => onOpen(foto)}
        className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
        aria-label="Apri foto"
      >
        <img
          src={foto.thumbnailSignedUrl}
          alt=""
          className="
            w-full h-full object-cover
            transition-transform duration-200
            group-hover:scale-105
          "
          loading="lazy"
        />
      </button>

      {/* Badge cover */}
      {foto.is_cover && (
        <div className="
          absolute top-1.5 left-1.5
          px-1.5 py-0.5 rounded-md
          bg-black/40 backdrop-blur-sm
        ">
          <span className="font-dm-sans text-[9px] text-white font-medium uppercase tracking-wider">
            Cover
          </span>
        </div>
      )}

      {/* Pulsante elimina — visibile sempre su mobile, su hover su desktop */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(foto)
        }}
        disabled={isDeleting}
        className="
          absolute top-1.5 right-1.5
          w-6 h-6 rounded-full
          bg-black/50 backdrop-blur-sm
          flex items-center justify-center
          opacity-100 sm:opacity-0 sm:group-hover:opacity-100
          transition-opacity duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white
          disabled:cursor-wait
        "
        aria-label="Elimina foto"
      >
        {isDeleting ? (
          <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
      </button>
    </div>
  )
}
