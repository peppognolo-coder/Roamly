import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Backpack,
  Map,
  MapPinned,
  CalendarDays,
  NotebookPen,
  ChevronRight,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// PianificaHub — griglia delle 6 sezioni di pianificazione
// di un viaggio. Mostrata nella tab "Pianifica" di ViaggioDetailPage.
// Le sezioni non ancora costruite sono disabilitate ("Presto disponibile")
// e verranno attivate una per una nei prossimi blocchi (P2-P5).
// ============================================================

interface PianificaHubProps {
  viaggioId: string
}

interface VoceHub {
  id: string
  label: string
  descrizione: string
  icon: LucideIcon
  path?: string   // assente = non ancora disponibile
}

const VOCI: VoceHub[] = [
  {
    id: 'prenotazioni',
    label: 'Prenotazioni',
    descrizione: 'Trasporti, alloggi, musei, eventi...',
    icon: Briefcase,
    path: 'prenotazioni',
  },
  {
    id: 'itinerario',
    label: 'Itinerario',
    descrizione: 'Il percorso giorno per giorno',
    icon: Map,
    path: 'itinerario',
  },
  {
    id: 'attivita',
    label: 'Attività',
    descrizione: 'Tutte le tappe sulla mappa',
    icon: MapPinned,
    path: 'attivita',
  },
  {
    id: 'valigia',
    label: 'Valigia',
    descrizione: 'La tua checklist di partenza',
    icon: Backpack,
    path: 'valigia',
  },
  {
    id: 'calendario',
    label: 'Calendario',
    descrizione: 'Tutto il viaggio a colpo d\'occhio',
    icon: CalendarDays,
    path: 'calendario',
  },
  {
    id: 'note',
    label: 'Note di viaggio',
    descrizione: 'Appunti liberi, promemoria',
    icon: NotebookPen,
    path: 'note',
  },
]

export function PianificaHub({ viaggioId }: PianificaHubProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2.5">
      {VOCI.map((voce) => {
        const disponibile = !!voce.path
        const Icon = voce.icon

        return (
          <button
            key={voce.id}
            disabled={!disponibile}
            onClick={() => disponibile && navigate(`/viaggi/${viaggioId}/${voce.path}`)}
            className={`
              flex items-center gap-3.5 p-4
              bg-white rounded-2xl shadow-roamly
              text-left w-full
              transition-all duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
              ${disponibile
                ? 'active:scale-[0.98] hover:shadow-roamly-lg'
                : 'opacity-60'
              }
            `}
          >
            <div className="w-11 h-11 rounded-xl bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g2">
              <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
                {voce.label}
              </p>
              <p className="font-dm-sans text-xs text-roamly-text/45 truncate">
                {voce.descrizione}
              </p>
            </div>

            {disponibile ? (
              <ChevronRight size={18} className="text-roamly-text/25 shrink-0" />
            ) : (
              <span className="
                flex items-center gap-1 shrink-0
                px-2.5 py-1 rounded-full bg-roamly-g7
                font-dm-sans text-[10px] font-medium text-roamly-text/40
              ">
                <Clock size={10} />
                Presto
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
