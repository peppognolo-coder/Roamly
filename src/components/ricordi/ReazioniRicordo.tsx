import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useReazioni } from '@/hooks/useReazioni'
import { useMembriViaggio } from '@/hooks/useMembri'
import { useAuth } from '@/hooks/useAuth'

// ============================================================
// ROAMLY — ReazioniRicordo
// Riga "cuore + chi ha reagito", sotto al contenuto di un ricordo.
// Compare solo su viaggi collaborativi (lo verifica useReazioni
// internamente) — su un viaggio solitario semplicemente non si
// renderizza nulla.
// ============================================================

interface ReazioniRicordoProps {
  ricordoId: string
  viaggioId: string | undefined
}

export function ReazioniRicordo({ ricordoId, viaggioId }: ReazioniRicordoProps) {
  const { user } = useAuth()
  const { data: membri } = useMembriViaggio(viaggioId)
  const { reazioni, totale, mieReazione, isCollaborativo, toggle } = useReazioni(ricordoId, viaggioId)

  if (!isCollaborativo) return null

  const reattori = reazioni
    .map((r) => {
      const membro = membri?.find((m) => m.user_id === r.user_id)
      const seiTu = r.user_id === user?.id
      return {
        userId: r.user_id,
        nome: seiTu ? 'Tu' : (membro?.display_name?.trim() || 'Un collaboratore'),
        avatarUrl: membro?.avatar_url ?? null,
      }
    })
    .slice(0, 5)

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-roamly-g6">
      <motion.button
        onClick={() => toggle()}
        whileTap={{ scale: 0.85 }}
        className={`
          flex items-center gap-1.5 px-3.5 py-2 rounded-full
          border transition-colors duration-150
          ${mieReazione
            ? 'bg-roamly-coral-light border-roamly-coral/30 text-roamly-coral-dark'
            : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50 hover:border-roamly-g4'
          }
        `}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={mieReazione ? 'piena' : 'vuota'}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Heart size={15} fill={mieReazione ? 'currentColor' : 'none'} />
          </motion.span>
        </AnimatePresence>
        <span className="font-dm-sans text-xs font-semibold">
          {totale > 0 ? totale : 'Reagisci'}
        </span>
      </motion.button>

      {reattori.length > 0 && (
        <div className="flex items-center -space-x-2">
          {reattori.map((r) =>
            r.avatarUrl ? (
              <img
                key={r.userId}
                src={r.avatarUrl}
                alt={r.nome}
                title={r.nome}
                className="w-6 h-6 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <span
                key={r.userId}
                title={r.nome}
                className="
                  w-6 h-6 rounded-full border-2 border-white
                  bg-roamly-g4 flex items-center justify-center
                  font-dm-sans text-[10px] font-semibold text-white
                "
              >
                {r.nome.charAt(0).toUpperCase()}
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}
