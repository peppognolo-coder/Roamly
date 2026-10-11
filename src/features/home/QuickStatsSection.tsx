import { useNavigate } from 'react-router-dom'

// ============================================================
// QuickStatsSection — il tuo diario in numeri, in una sola striscia
// Viaggi · Ricordi · Paesi. Tocca per andare al profilo.
// ============================================================

interface QuickStatsSectionProps {
  viaggi: number
  ricordi: number
  paesi: number
  isLoading: boolean
}

export function QuickStatsSection({ viaggi, ricordi, paesi, isLoading }: QuickStatsSectionProps) {
  const navigate = useNavigate()
  const voci = [
    { label: viaggi === 1 ? 'viaggio' : 'viaggi', value: viaggi },
    { label: ricordi === 1 ? 'ricordo' : 'ricordi', value: ricordi },
    { label: paesi === 1 ? 'paese' : 'paesi', value: paesi },
  ]

  return (
    <button
      type="button"
      onClick={() => navigate('/profilo')}
      aria-label="Il tuo diario in numeri, apri il profilo"
      className="w-full flex items-center bg-white rounded-2xl shadow-roamly py-3.5
        active:scale-[0.99] transition-transform text-left"
    >
      {voci.map((v, i) => (
        <div key={v.label}
          className={`flex-1 flex flex-col items-center gap-0.5 ${i > 0 ? 'border-l border-roamly-g6' : ''}`}>
          {isLoading ? (
            <div className="h-6 w-8 bg-roamly-g6 rounded animate-pulse" />
          ) : (
            <span className="font-lora text-2xl font-semibold text-roamly-g0 leading-none">{v.value}</span>
          )}
          <span className="font-dm-sans text-[11px] text-roamly-muted">{v.label}</span>
        </div>
      ))}
    </button>
  )
}
