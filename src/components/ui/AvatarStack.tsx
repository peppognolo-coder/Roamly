import { coloreIniziale } from '@/lib/avatar-utils'
import { useMembriViaggio } from '@/hooks/useMembri'

// ============================================================
// ROAMLY — AvatarStack
// Bolle avatar sovrapposte per i membri di un viaggio condiviso.
// Non renderizza nulla per viaggi solo-tuoi (1 membro) — il
// segnale visivo ha senso solo quando c'è davvero da condividere.
// ============================================================

interface AvatarStackProps {
  viaggioId: string
  size?: 'sm' | 'md'
  maxVisible?: number
  className?: string
}

const DIMENSIONI = {
  sm: { avatar: 'w-6 h-6', font: 'text-[10px]', overlap: '-space-x-2' },
  md: { avatar: 'w-8 h-8', font: 'text-xs',      overlap: '-space-x-2.5' },
}

export function AvatarStack({
  viaggioId,
  size = 'sm',
  maxVisible = 4,
  className = '',
}: AvatarStackProps) {
  const { data: membri } = useMembriViaggio(viaggioId)

  // Niente da mostrare: ancora in caricamento, o viaggio non condiviso
  if (!membri || membri.length < 2) return null

  const dim = DIMENSIONI[size]
  const visibili = membri.slice(0, maxVisible)
  const restanti = membri.length - visibili.length

  return (
    <div className={`flex items-center ${dim.overlap} ${className}`}>
      {visibili.map((m) => {
        const nome = m.display_name ?? 'Utente'
        return m.avatar_url ? (
          <img
            key={m.user_id}
            src={m.avatar_url}
            alt=""
            title={nome}
            className={`${dim.avatar} rounded-full object-cover ring-2 ring-white shrink-0`}
          />
        ) : (
          <span
            key={m.user_id}
            title={nome}
            className={`${dim.avatar} rounded-full ring-2 ring-white shrink-0 flex items-center justify-center font-dm-sans font-semibold text-white ${dim.font}`}
            style={{ background: coloreIniziale(nome) }}
          >
            {nome.charAt(0).toUpperCase()}
          </span>
        )
      })}

      {restanti > 0 && (
        <span
          className={`${dim.avatar} rounded-full ring-2 ring-white shrink-0 flex items-center justify-center bg-roamly-g6 font-dm-sans font-semibold text-roamly-text/60 ${dim.font}`}
        >
          +{restanti}
        </span>
      )}
    </div>
  )
}
