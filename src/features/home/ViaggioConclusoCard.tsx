import { useNavigate } from 'react-router-dom'
import { BookOpen, Sparkles } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { useCoverViaggio } from '@/hooks/useFoto'
import { useStatisticheViaggio } from '@/hooks/useViaggi'
import { calcolaDurataViaggio, formatDataViaggio } from '@/lib/viaggi-utils'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ViaggioConclusoCard — in Home quando non c'è un viaggio in corso
// o in arrivo: rimette in primo piano l'ultimo viaggio concluso
// con le due azioni che contano (rileggere, rivedere il riepilogo).
// ============================================================

export function ViaggioConclusoCard({ viaggio }: { viaggio: ViaggioConStato }) {
  const navigate = useNavigate()
  const { data: coverUrl } = useCoverViaggio(viaggio.id)
  const { data: stats } = useStatisticheViaggio(viaggio.id)

  const durata = calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const luogo = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')
  const numeri = [
    durata ? `${durata} ${durata === 1 ? 'giorno' : 'giorni'}` : null,
    stats?.ricordi ? `${stats.ricordi} ${stats.ricordi === 1 ? 'ricordo' : 'ricordi'}` : null,
  ].filter(Boolean).join(' · ')
  const haRicordi = (stats?.ricordi ?? 0) > 0

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-roamly-g0 shadow-roamly-lg"
    >
      {/* Foto di copertina oppure fondo brand */}
      {coverUrl && (
        <img src={coverUrl} alt="" loading="lazy"
          className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className={`absolute inset-0 ${coverUrl
        ? 'bg-gradient-to-t from-black/80 via-black/30 to-black/20'
        : 'bg-gradient-to-br from-roamly-g0 to-roamly-g1'}`} />

      <div className="relative flex flex-col gap-5 p-5 pt-24">
        <button
          type="button"
          onClick={() => navigate(`/viaggi/${viaggio.id}`)}
          className="text-left flex flex-col gap-1.5 focus:outline-none"
          aria-label={`Apri il viaggio ${viaggio.nome}`}
        >
          <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm
            font-dm-mono text-[10px] font-medium uppercase tracking-wider text-white/85">
            <ViaggioCoverIcon value={viaggio.cover_emoji} size={12} />
            Il tuo ultimo viaggio
          </span>
          <h2 className="font-lora text-[26px] leading-tight font-semibold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">
            {viaggio.nome}
          </h2>
          <p className="font-dm-sans text-sm text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
            {[luogo, formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)].filter(Boolean).join(' · ')}
          </p>
          {numeri && (
            <p className="font-dm-mono text-[11px] text-white/65">{numeri}</p>
          )}
        </button>

        {haRicordi && (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/viaggi/${viaggio.id}/racconto`)}
              className="flex-1 h-11 rounded-2xl bg-white text-roamly-g0
                inline-flex items-center justify-center gap-1.5 px-2
                font-dm-sans text-[13px] font-semibold
                active:scale-[0.98] transition-transform
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <BookOpen size={16} />
              Rileggi il racconto
            </button>
            <button
              type="button"
              onClick={() => navigate(`/viaggi/${viaggio.id}/wrapped`)}
              className="flex-1 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white
                inline-flex items-center justify-center gap-1.5 px-2
                font-dm-sans text-[13px] font-semibold
                active:scale-[0.98] transition-transform
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Sparkles size={16} />
              Riepilogo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
