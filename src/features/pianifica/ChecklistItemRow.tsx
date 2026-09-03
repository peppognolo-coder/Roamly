import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ChecklistItem as ChecklistItemType } from '@/types'

// ============================================================
// ChecklistItemRow — singolo item della checklist
// Toggle completato + pulsante elimina + maniglia di trascinamento
// Nessun dialog di conferma — l'eliminazione è immediata.
//
// Drag-and-drop: solo la maniglia (icona GripVertical) attiva il
// listener di dnd-kit — checkbox e pulsante elimina restano tap
// normali, senza rischio di attivare un drag per sbaglio.
// ============================================================

interface ChecklistItemRowProps {
  item:       ChecklistItemType
  onToggle:   (itemId: string, completatoCorrente: boolean) => void
  onDelete:   (itemId: string) => void
  isToggling: boolean
}

export function ChecklistItemRow({
  item,
  onToggle,
  onDelete,
  isToggling,
}: ChecklistItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
      flex items-center gap-2 px-2 py-2.5
      rounded-xl border
      transition-all duration-150
      ${item.completato
        ? 'bg-roamly-g7 border-roamly-g6'
        : 'bg-white border-roamly-g6'
      }
      ${isDragging ? 'shadow-roamly-lg' : ''}
    `}>
      {/* Maniglia drag */}
      <button
        {...attributes}
        {...listeners}
        className="
          w-6 h-6 shrink-0 rounded-md
          flex items-center justify-center
          text-roamly-text/20 hover:text-roamly-text/40
          cursor-grab active:cursor-grabbing
          touch-none
        "
        aria-label="Trascina per riordinare"
      >
        <GripVertical size={15} />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, item.completato)}
        disabled={isToggling}
        className={`
          w-5 h-5 rounded-md shrink-0
          border-2 flex items-center justify-center
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          ${item.completato
            ? 'bg-roamly-g2 border-roamly-g2'
            : 'border-roamly-g4 hover:border-roamly-g2'
          }
        `}
        aria-label={item.completato ? 'Segna come incompleto' : 'Segna come completato'}
      >
        {item.completato && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Testo */}
      <p className={`
        flex-1 font-dm-sans text-sm leading-snug
        ${item.completato
          ? 'text-roamly-text/40 line-through'
          : 'text-roamly-text'
        }
      `}>
        {item.testo}
      </p>

      {/* Pulsante elimina */}
      <button
        onClick={() => onDelete(item.id)}
        className="
          w-7 h-7 rounded-lg
          flex items-center justify-center
          text-roamly-text/25 hover:text-red-400 hover:bg-red-50
          transition-all duration-150 shrink-0
          focus:outline-none focus-visible:ring-1 focus-visible:ring-red-300
        "
        aria-label={`Elimina "${item.testo}"`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}
