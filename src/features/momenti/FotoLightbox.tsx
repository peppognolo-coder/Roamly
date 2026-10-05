import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Move } from 'lucide-react'
import type { FotoConUrl } from '@/types'

// ============================================================
// FotoLightbox — lightbox fullscreen con react-photo-view
// Funzionalità native:
//   ✅ Swipe orizzontale tra immagini
//   ✅ Pinch-zoom (touch) + scroll-zoom (desktop)
//   ✅ Indicatore posizione (1/5, 2/5 ...)
//   ✅ Chiusura con X e swipe verso il basso
//   ✅ Animazioni fluide
//
// Uso: FotoLightbox wrappa l'intera griglia. I <PhotoView>
// avvolgono le singole miniature. L'apertura è gestita
// internamente da PhotoProvider tramite indice.
// ============================================================

interface FotoLightboxProps {
  foto:      FotoConUrl[]
  children:  (openAt: (index: number) => void) => React.ReactNode
}

export function FotoLightbox({ foto, children }: FotoLightboxProps) {
  return (
    <PhotoProvider
      // Overlay scuro
      maskOpacity={0.92}
      // Abilita chiusura con swipe verso il basso
      pullClosable={true}
      // Velocità animazione entrata/uscita
      speed={() => 300}
      easing={(type) =>
        type === 2
          ? 'cubic-bezier(0.36, 0.66, 0.04, 1)'
          : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }
      // Toolbar personalizzata — mostra solo il pulsante chiudi
      // L'indicatore posizione (1/5) è nativo di react-photo-view
      toolbarRender={({ onClose }) => (
        <button
          onClick={onClose}
          className="
            w-10 h-10 rounded-full
            bg-white/15 hover:bg-white/25
            flex items-center justify-center
            transition-colors duration-150
          "
          aria-label="Chiudi"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    >
      {/* Renderizza le PhotoView per ogni foto (necessario per il preload) */}
      {foto.map((f) => (
        <PhotoView key={f.id} src={f.signedUrl}>
          {/* Nessun children visibile qui — il trigger è gestito da FotoGalleria */}
          <span style={{ display: 'none' }} />
        </PhotoView>
      ))}

      {/* children riceve openAt(index) per aprire il lightbox programmaticamente */}
      {children(() => {})}
    </PhotoProvider>
  )
}

// ============================================================
// FotoLightboxGrid — versione integrata che gestisce tutto
// Sostituisce la griglia + lightbox in FotoGalleria.
// Ogni thumbnail apre il lightbox all'indice corretto.
// ============================================================

interface FotoLightboxGridProps {
  foto:         FotoConUrl[]
  onDelete:     (foto: FotoConUrl) => void
  onSetCover?:  (foto: FotoConUrl) => void
  isDeleting:   boolean
  deletingId?:  string
  /** Se presente, abilita il riordino drag-and-drop (maniglia dedicata
   *  su ogni thumbnail) — assente in contesti dove l'ordine non è
   *  persistibile (es. nessuna griglia read-only). */
  onReorder?:   (items: { id: string; ordine: number }[]) => void
}

export function FotoLightboxGrid({
  foto,
  onDelete,
  onSetCover,
  isDeleting,
  deletingId,
  onReorder,
}: FotoLightboxGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    if (!onReorder) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = foto.findIndex((f) => f.id === active.id)
    const newIndex = foto.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const riordinate = arrayMove(foto, oldIndex, newIndex)
    const ordiniOriginali = foto.map((f) => f.ordine).sort((a, b) => a - b)
    onReorder(riordinate.map((f, i) => ({ id: f.id, ordine: ordiniOriginali[i] })))
  }

  return (
    <PhotoProvider
      maskOpacity={0.92}
      pullClosable={true}
      speed={() => 300}
      easing={(type) =>
        type === 2
          ? 'cubic-bezier(0.36, 0.66, 0.04, 1)'
          : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }
      toolbarRender={({ onClose, index }) => {
        const fotoCorrente = foto[index]
        return (
          <div className="flex items-center gap-2">
            {/* Imposta come cover */}
            {onSetCover && fotoCorrente && !fotoCorrente.is_cover && (
              <button
                onClick={() => onSetCover(fotoCorrente)}
                className="
                  px-3 py-1.5 rounded-lg
                  bg-white/15 hover:bg-white/25
                  font-dm-sans text-xs text-white font-medium
                  transition-colors duration-150
                "
                aria-label="Imposta come copertina"
              >
                Imposta cover
              </button>
            )}
            {/* Badge cover attiva */}
            {fotoCorrente?.is_cover && (
              <span className="
                px-2.5 py-1 rounded-lg
                bg-roamly-g2/80
                font-dm-sans text-xs text-white font-medium
              ">
                ✓ Cover
              </span>
            )}
            {/* Elimina */}
            {fotoCorrente && (
              <button
                onClick={() => {
                  onDelete(fotoCorrente)
                  onClose()
                }}
                className="
                  w-9 h-9 rounded-full
                  bg-white/15 hover:bg-red-500/70
                  flex items-center justify-center
                  transition-colors duration-150
                "
                aria-label="Elimina foto"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
            {/* Chiudi */}
            <button
              onClick={onClose}
              className="
                w-9 h-9 rounded-full
                bg-white/15 hover:bg-white/25
                flex items-center justify-center
                transition-colors duration-150
              "
              aria-label="Chiudi"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={foto.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2">
            {foto.map((f) => (
              <FotoTile
                key={f.id}
                foto={f}
                onDelete={onDelete}
                isDeleting={isDeleting}
                deletingId={deletingId}
                riordinabile={!!onReorder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </PhotoProvider>
  )
}

// ------------------------------------------------------------
// FotoTile — singola thumbnail della griglia, trigger del lightbox
// (PhotoView) + maniglia di trascinamento dedicata.
//
// Drag-and-drop: solo la maniglia (icona Move, angolo in basso a
// sinistra) attiva il listener di dnd-kit — tap sulla thumbnail
// apre sempre il lightbox normalmente, nessun rischio di avviare
// un drag per sbaglio. Stesso principio di ChecklistItemRow.
// ------------------------------------------------------------

function FotoTile({
  foto: f,
  onDelete,
  isDeleting,
  deletingId,
  riordinabile,
}: {
  foto:         FotoConUrl
  onDelete:     (foto: FotoConUrl) => void
  isDeleting:   boolean
  deletingId?:  string
  riordinabile: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: f.id, disabled: !riordinabile })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <PhotoView src={f.signedUrl}>
      {/* La thumbnail è il trigger nativo di PhotoView */}
      <div
        ref={setNodeRef}
        style={style}
        className="relative aspect-square rounded-xl overflow-hidden group cursor-zoom-in"
      >
        <img
          src={f.thumbnailSignedUrl}
          alt=""
          className="
            w-full h-full object-cover
            transition-transform duration-200
            group-hover:scale-105
          "
          loading="lazy"
        />

        {/* Badge cover */}
        {f.is_cover && (
          <div className="
            absolute top-1.5 left-1.5
            px-1.5 py-0.5 rounded-md
            bg-black/50 backdrop-blur-sm
          ">
            <span className="font-dm-sans text-[9px] text-white font-medium uppercase tracking-wider">
              Cover
            </span>
          </div>
        )}

        {/* Maniglia di trascinamento */}
        {riordinabile && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="
              absolute bottom-1.5 left-1.5
              w-6 h-6 rounded-full
              bg-black/50 backdrop-blur-sm
              flex items-center justify-center
              text-white touch-none cursor-grab active:cursor-grabbing
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100
              transition-opacity duration-150
            "
            aria-label="Trascina per riordinare"
          >
            <Move size={11} />
          </button>
        )}

        {/* Pulsante elimina (su thumbnail, fuori dal lightbox) */}
        <button
          onClick={(e) => {
            e.stopPropagation()   // non aprire il lightbox
            onDelete(f)
          }}
          disabled={isDeleting && deletingId === f.id}
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
          {isDeleting && deletingId === f.id ? (
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
    </PhotoView>
  )
}
