// ============================================================
// ROAMLY — AutoreBadge
// Avatar + nome di chi ha scritto un ricordo. Foto profilo se
// presente, altrimenti iniziale su sfondo colorato (deterministico
// per persona, cambia solo pallette non foto).
// ============================================================

import { coloreIniziale } from '@/lib/avatar-utils'

interface AutoreBadgeProps {
  nome: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md'
  mostraNome?: boolean
  /** Testo alternativo da mostrare al posto di `nome` (es. "Aggiunto da Marco") —
   *  `nome` continua a determinare iniziale/colore del fallback avatar. */
  testoOverride?: string
  className?: string
}

const DIMENSIONI = {
  xs: { avatar: 'w-4 h-4', testo: 'text-[10px]', font: 'text-[9px]' },
  sm: { avatar: 'w-5 h-5', testo: 'text-xs',     font: 'text-[10px]' },
  md: { avatar: 'w-7 h-7', testo: 'text-sm',     font: 'text-xs' },
}

export function AutoreBadge({
  nome,
  avatarUrl,
  size = 'sm',
  mostraNome = true,
  testoOverride,
  className = '',
}: AutoreBadgeProps) {
  const dim = DIMENSIONI[size]

  return (
    <span className={`flex items-center gap-1.5 min-w-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={`${dim.avatar} rounded-full object-cover shrink-0`}
        />
      ) : (
        <span
          className={`${dim.avatar} rounded-full shrink-0 flex items-center justify-center font-dm-sans font-semibold text-white ${dim.font}`}
          style={{ background: coloreIniziale(nome) }}
        >
          {nome.charAt(0).toUpperCase()}
        </span>
      )}
      {mostraNome && (
        <span className={`font-dm-sans ${dim.testo} text-roamly-text/45 truncate`}>
          {testoOverride ?? nome}
        </span>
      )}
    </span>
  )
}
