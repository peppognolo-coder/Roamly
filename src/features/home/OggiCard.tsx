import { useNavigate } from 'react-router-dom'
import type { CategoriaTappa, TappaViaggio } from '@/types'

// ============================================================
// OggiCard — "Tappe di oggi" in Home (schermata Home del mockup)
// Visibile solo per un viaggio in corso: le tappe con giorno ==
// oggi, ordinate per ora. Riusa i dati già caricati da Itinerario/
// Attività (tappe_viaggio) — nessuna query nuova, nessun dato finto.
// ============================================================

const LABEL_CATEGORIA: Record<CategoriaTappa, string> = {
  cultura: 'Cultura',
  natura: 'Natura',
  food: 'Food',
  svago: 'Svago',
  relax: 'Relax',
  trasporto: 'Trasporto',
  altro: 'Altro',
}

function formatOra(ora: string | null): string {
  if (!ora) return '—'
  return ora.slice(0, 5) // 'HH:MM:SS' → 'HH:MM'
}

function oggiISO(): string {
  const d = new Date()
  const mese = String(d.getMonth() + 1).padStart(2, '0')
  const giorno = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mese}-${giorno}`
}

interface OggiCardProps {
  viaggioId: string
  tappe: TappaViaggio[]
}

export function OggiCard({ viaggioId, tappe }: OggiCardProps) {
  const navigate = useNavigate()
  const oggi = oggiISO()

  const tappeOggi = tappe
    .filter((t) => t.giorno === oggi || (t.giorno && t.giorno_fine && t.giorno <= oggi && t.giorno_fine >= oggi))
    .sort((a, b) => (a.ora ?? '99:99').localeCompare(b.ora ?? '99:99'))

  if (tappeOggi.length === 0) return null

  return (
    <div className="bg-white rounded-2xl px-4 shadow-roamly">
      {tappeOggi.map((t, i) => (
        <button
          key={t.id}
          onClick={() => navigate(`/viaggi/${viaggioId}/itinerario`)}
          className={`
            w-full flex items-center gap-3 py-3.5 text-left
            ${i > 0 ? 'border-t border-roamly-text/[0.06]' : ''}
          `}
        >
          <span className="font-dm-mono text-[11px] font-medium text-roamly-g3 w-9 shrink-0">
            {formatOra(t.ora)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-dm-sans text-[13.5px] font-medium text-roamly-g0 truncate">
              {t.nome}
            </p>
            <p className="font-dm-sans text-[11px] text-roamly-text/40 truncate mt-0.5">
              {LABEL_CATEGORIA[t.categoria]}{t.indirizzo ? ` · ${t.indirizzo}` : ''}
            </p>
          </div>
          <span className="shrink-0 w-[7px] h-[7px] border-r-[1.8px] border-b-[1.8px] border-roamly-text/20 -rotate-45" />
        </button>
      ))}
      <p className="py-3 border-t border-roamly-text/[0.06] font-dm-sans text-[11.5px] text-roamly-text/35 text-center">
        Il resto del giorno è libero — e va benissimo.
      </p>
    </div>
  )
}
