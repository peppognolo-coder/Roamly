import { useNavigate } from 'react-router-dom'
import { NotebookPen, Heart, ChevronRight } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { useAutoreRicordo } from '@/hooks/useAutoreRicordo'
import { AutoreBadge } from '@/components/ricordi/AutoreBadge'
import { MOOD_OPTIONS } from '@/types'
import type { Ricordo, ViaggioConStato } from '@/types'

// ============================================================
// RicordoDelGiornoCard — componente condiviso tra Home e Diario
// Posizione: src/components/ricordi/ — dominio semantico "ricordi"
//
// Tre stati:
//   loading  — skeleton animato
//   vuoto    — nessun ricordo disponibile (non mostrato dal consumer)
//   reale    — ricordo selezionato con logica B45
// ============================================================

// ---- Props ----

interface RicordoDelGiornoCardProps {
  ricordo: Ricordo
  viaggio?: ViaggioConStato | null
  labelTempo?: string | null  // "Un anno fa" | "Due anni fa" | null
}

// ---- Gradient mood coerente con il resto dell'app ----

const MOOD_GRADIENT: Record<string, string> = {
  felice:       'from-amber-100 to-yellow-50',
  meravigliato: 'from-pink-100 to-rose-50',
  sereno:       'from-roamly-g7 to-roamly-g6',
  entusiasta:   'from-orange-100 to-amber-50',
  ispirato:     'from-violet-100 to-purple-50',
}

// ---- Componente principale ----

export function RicordoDelGiornoCard({
  ricordo,
  viaggio,
  labelTempo,
}: RicordoDelGiornoCardProps) {
  const navigate = useNavigate()
  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const gradient = MOOD_GRADIENT[ricordo.mood] ?? 'from-roamly-g7 to-roamly-g6'
  const { autore } = useAutoreRicordo(ricordo)

  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const dataFormattata = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <button
      onClick={() => navigate(`/ricordi/${ricordo.id}`)}
      className="
        flex items-center gap-3 px-4 py-3.5 w-full text-left
        bg-white rounded-2xl
        shadow-roamly
        hover:shadow-roamly-lg
        active:scale-[0.98]
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
      "
    >
      {/* Thumbnail mood */}
      <div className={`
        w-12 h-12 rounded-xl shrink-0
        bg-gradient-to-br ${gradient}
        flex items-center justify-center
      `}>
        {moodOption ? (
          <span className="text-2xl">{moodOption.emoji}</span>
        ) : (
          <NotebookPen size={20} className="opacity-50 text-roamly-g2" />
        )}
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0">
        {/* Label superiore */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-dm-sans text-[10px] font-semibold uppercase tracking-wider text-roamly-g3">
            {labelTempo ?? 'Ricordo del giorno'}
          </span>
          {ricordo.preferito && (
            <Heart size={11} className="fill-red-400 text-red-400" />
          )}
        </div>

        {/* Titolo */}
        <p className="font-lora text-sm font-semibold text-roamly-g0 truncate leading-snug">
          {ricordo.titolo}
        </p>

        {/* Metadati */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {viaggio && (
            <>
              <ViaggioCoverIcon value={viaggio.cover_emoji} size={13} />
              <span className="font-dm-sans text-[10px] text-roamly-text/40 truncate">
                {viaggio.nome}
              </span>
              <span className="text-roamly-text/20 text-[10px]">·</span>
            </>
          )}
          <span className="font-dm-mono text-[10px] text-roamly-text/30 shrink-0">
            {dataFormattata}
          </span>
          {autore && (
            <>
              <span className="text-roamly-text/20 text-[10px]">·</span>
              <AutoreBadge nome={autore.nome} avatarUrl={autore.avatarUrl} size="xs" />
            </>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight size={16} className="text-roamly-text/20 shrink-0" />
    </button>
  )
}

// ---- Skeleton ----

export function RicordoDelGiornoCardSkeleton() {
  return (
    <div className="
      flex items-center gap-3 px-4 py-3.5
      bg-white rounded-2xl shadow-roamly
    ">
      <div className="w-12 h-12 rounded-xl bg-roamly-g6 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-2.5 bg-roamly-g6 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-roamly-g6 rounded animate-pulse w-3/4" />
        <div className="h-2.5 bg-roamly-g6 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
