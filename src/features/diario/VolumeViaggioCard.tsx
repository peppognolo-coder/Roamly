import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { StatoBadge } from '@/features/viaggi/StatoBadge'
import { useCoverViaggio, useCoversByViaggio } from '@/hooks/useFoto'
import { formatDataViaggio, gradienteCopertinaViaggio } from '@/lib/viaggi-utils'
import { useInViewOnce } from './useInViewOnce'
import type { SezioneViaggio } from '@/lib/diario-utils'

// ============================================================
// VolumeViaggioCard — un viaggio nel Diario, come un "volume":
// copertina, nome, date, quanti ricordi e una fila di miniature.
// Tocca → il diario di quel viaggio.
// ============================================================

export function VolumeViaggioCard({ sezione }: { sezione: SezioneViaggio }) {
  const navigate = useNavigate()
  const { viaggio, giorni, totaleRicordi } = sezione
  const { ref, visto } = useInViewOnce<HTMLDivElement>()

  const { data: coverUrl } = useCoverViaggio(visto ? viaggio.id : undefined)
  const { data: covers } = useCoversByViaggio(visto ? viaggio.id : undefined)

  const [chiaro, scuro] = gradienteCopertinaViaggio(viaggio.id)
  const luogo = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')
  const ricordi = giorni.flatMap((g) => g.ricordi)
  const conFoto = ricordi.filter((r) => covers?.has(r.id))
  const anteprima = (conFoto.length > 0 ? conFoto : ricordi).slice(0, 4)
  const resto = Math.max(0, totaleRicordi - anteprima.length)

  const apri = () => navigate(`/diario/${viaggio.id}`)

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={apri}
      onKeyDown={(e) => e.key === 'Enter' && apri()}
      className="bg-white rounded-3xl overflow-hidden shadow-roamly cursor-pointer
        active:scale-[0.99] transition-transform duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
    >
      {/* Copertina */}
      <div className="relative h-[150px]" style={{ background: `linear-gradient(135deg, ${chiaro}, ${scuro})` }}>
        {coverUrl && <img src={coverUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/10" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <ViaggioCoverIcon value={viaggio.cover_emoji} size={18} />
          </span>
          <span className="rounded-full bg-white/90 backdrop-blur-sm"><StatoBadge stato={viaggio.stato_effettivo} size="sm" /></span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-lora text-xl font-semibold leading-tight text-white truncate [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            {viaggio.nome}
          </h3>
          <p className="font-dm-sans text-xs text-white/80 truncate [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">
            {[luogo, formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Ricordi */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        {totaleRicordi === 0 ? (
          <>
            <p className="flex-1 font-dm-sans text-sm text-roamly-text/50">Nessun ricordo ancora</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(`/nuovo-ricordo?viaggioId=${viaggio.id}`) }}
              className="h-9 px-3.5 rounded-full bg-roamly-g6 border border-roamly-g5 inline-flex items-center gap-1.5
                font-dm-sans text-xs font-medium text-roamly-g1 active:scale-95 transition-transform"
            >
              <Plus size={14} />
              Aggiungi
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
                {totaleRicordi} {totaleRicordi === 1 ? 'ricordo' : 'ricordi'}
              </p>
              <p className="font-dm-sans text-xs text-roamly-text/45">
                {giorni.length} {giorni.length === 1 ? 'giorno raccontato' : 'giorni raccontati'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {anteprima.map((r) => {
                const u = covers?.get(r.id)
                return (
                  <span key={r.id} className="w-11 h-11 rounded-xl overflow-hidden bg-roamly-g6 flex items-center justify-center">
                    {u
                      ? <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                      : <MoodIcon mood={r.mood} size={24} />}
                  </span>
                )
              })}
              {resto > 0 && (
                <span className="w-11 h-11 rounded-xl bg-roamly-g7 flex items-center justify-center font-dm-mono text-[11px] text-roamly-g2">
                  +{resto}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
