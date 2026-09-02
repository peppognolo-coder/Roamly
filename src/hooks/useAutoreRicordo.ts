import { useAuth } from '@/hooks/useAuth'
import { useMembriViaggio } from '@/hooks/useMembri'
import type { Ricordo } from '@/types'

// ============================================================
// ROAMLY — useAutoreRicordo
// Risolve nome/avatar di chi ha scritto un ricordo, a partire
// dai membri del viaggio (già in cache — chiamare questo hook
// più volte per lo stesso viaggio non genera richieste extra,
// React Query deduplica per queryKey).
//
// isCollaborativo: true solo se il viaggio ha più di un membro —
// l'autore va mostrato solo lì. Su un viaggio solitario, sapere
// "scritto da te" è rumore, non informazione.
// ============================================================

export interface AutoreRicordo {
  nome: string
  avatarUrl: string | null
  seiTu: boolean
}

export function useAutoreRicordo(ricordo: Pick<Ricordo, 'viaggio_id' | 'user_id'> | null | undefined): {
  autore: AutoreRicordo | null
  isCollaborativo: boolean
} {
  const { user } = useAuth()
  const { data: membri } = useMembriViaggio(ricordo?.viaggio_id)

  const isCollaborativo = (membri?.length ?? 0) > 1

  if (!ricordo || !isCollaborativo) {
    return { autore: null, isCollaborativo }
  }

  const membro = membri?.find((m) => m.user_id === ricordo.user_id)
  const seiTu = ricordo.user_id === user?.id

  return {
    autore: {
      nome: seiTu ? 'Tu' : (membro?.display_name?.trim() || 'Un collaboratore'),
      avatarUrl: membro?.avatar_url ?? null,
      seiTu,
    },
    isCollaborativo,
  }
}
