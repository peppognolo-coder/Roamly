import { Heart } from 'lucide-react'
import { MOOD_OPTIONS } from '@/types'
import type { Mood } from '@/types'
import { AutoreBadge } from '@/components/ricordi/AutoreBadge'
import type { FiltriDiario, AutoreFiltro } from '@/lib/diario-utils'

// ============================================================
// FiltriBar — pill filtri nel Diario
// Mood: multi-select
// Preferiti: toggle singolo
// Autore: multi-select — visibile solo se esistono almeno 2
//         persone distinte tra i ricordi (viaggi collaborativi)
// I filtri si combinano con AND logico.
// ============================================================

interface FiltriBarProps {
  filtri: FiltriDiario
  onToggleMood: (mood: Mood) => void
  onTogglePreferiti: () => void
  onToggleAutore: (userId: string) => void
  onReset: () => void
  totaleFiltrati: number
  totaleRicordi: number
  autoriDisponibili: AutoreFiltro[]
}

export function FiltriBar({
  filtri,
  onToggleMood,
  onTogglePreferiti,
  onToggleAutore,
  onReset,
  totaleFiltrati,
  totaleRicordi,
  autoriDisponibili,
}: FiltriBarProps) {
  const haNessunFiltro = filtri.mood.length === 0 && !filtri.soloPreferiti && filtri.autori.length === 0
  const mostraContatore = !haNessunFiltro
  const mostraFiltroAutori = autoriDisponibili.length > 1

  return (
    <div className="flex flex-col gap-2">
      {/* Riga pill */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">

        {/* Pill mood */}
        {MOOD_OPTIONS.map((option) => {
          const attivo = filtri.mood.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => onToggleMood(option.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                rounded-full border shrink-0
                font-dm-sans text-xs font-medium
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                active:scale-95
                ${attivo
                  ? 'bg-roamly-g0 border-roamly-g0 text-white shadow-sm'
                  : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50 hover:border-roamly-g4'
                }
              `}
            >
              <span className="text-sm leading-none">{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          )
        })}

        {/* Separatore */}
        <div className="w-px h-5 bg-roamly-g5 shrink-0" />

        {/* Pill preferiti */}
        <button
          onClick={onTogglePreferiti}
          className={`
            flex items-center gap-1.5 px-3 py-1.5
            rounded-full border shrink-0
            font-dm-sans text-xs font-medium
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
            active:scale-[0.98]
            ${filtri.soloPreferiti
              ? 'bg-roamly-g0 border-roamly-g0 text-white shadow-sm'
              : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50 hover:border-roamly-g4'
            }
          `}
        >
          <Heart
            size={13}
            className={filtri.soloPreferiti ? 'fill-white text-white' : ''}
          />
          <span>Preferiti</span>
        </button>
      </div>

      {/* Riga pill autori — solo se il Diario include viaggi collaborativi */}
      {mostraFiltroAutori && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {autoriDisponibili.map((autore) => {
            const attivo = filtri.autori.includes(autore.userId)
            return (
              <button
                key={autore.userId}
                onClick={() => onToggleAutore(autore.userId)}
                className={`
                  flex items-center gap-1.5 pl-1 pr-3 py-1
                  rounded-full border shrink-0
                  font-dm-sans text-xs font-medium
                  transition-all duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                  active:scale-95
                  ${attivo
                    ? 'bg-roamly-g0 border-roamly-g0 text-white shadow-sm'
                    : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50 hover:border-roamly-g4'
                  }
                `}
              >
                <AutoreBadge
                  nome={autore.nome}
                  avatarUrl={autore.avatarUrl}
                  size="xs"
                  mostraNome={false}
                />
                <span className={attivo ? 'text-white' : ''}>{autore.nome}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Riga contatore + reset — visibile solo con filtri attivi */}
      {mostraContatore && (
        <div className="flex items-center justify-between px-0.5">
          <span className="font-dm-sans text-xs text-roamly-text/40">
            {totaleFiltrati === totaleRicordi
              ? `${totaleRicordi} ricordi`
              : `${totaleFiltrati} di ${totaleRicordi} ricordi`
            }
          </span>
          <button
            onClick={onReset}
            className="
              font-dm-sans text-xs text-roamly-g2 underline
              hover:text-roamly-g1
              focus:outline-none focus-visible:ring-1 focus-visible:ring-roamly-g3
            "
          >
            Rimuovi filtri
          </button>
        </div>
      )}
    </div>
  )
}
