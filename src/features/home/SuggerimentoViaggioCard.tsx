import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useLuoghiSalvati } from '@/hooks/useLuoghiSalvati'
import { trovaClusterVicini, descriviCluster } from '@/lib/luoghi-clustering'

// ============================================================
// SuggerimentoViaggioCard — Home
// Quando 3+ posti di "Voglio andarci" non ancora assegnati sono
// vicini tra loro, propone di organizzarci un viaggio. Scartabile:
// il rifiuto è ricordato per quel gruppo di posti (se ne aggiungi
// altri, il gruppo cambia e il suggerimento può tornare).
// ============================================================

const PREFIX = 'roamly-suggerimento-viaggio-'

function letto(chiave: string): boolean {
  try { return localStorage.getItem(PREFIX + chiave) === '1' } catch { return false }
}

export function SuggerimentoViaggioCard() {
  const navigate = useNavigate()
  const { luoghi } = useLuoghiSalvati()
  const [scartati, setScartati] = useState<string[]>([])

  const cluster = useMemo(() => {
    const liberi = luoghi.filter((l) => !l.viaggio_id)
    const c = trovaClusterVicini(liberi)[0]
    return c ? { luoghi: c, info: descriviCluster(c) } : null
  }, [luoghi])

  if (!cluster) return null
  const { chiave, nomeZona } = cluster.info
  if (scartati.includes(chiave) || letto(chiave)) return null

  function scarta() {
    try { localStorage.setItem(PREFIX + chiave, '1') } catch { /* noop */ }
    setScartati((p) => [...p, chiave])
  }

  return (
    <div className="bg-white rounded-2xl shadow-roamly p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-roamly-g6 flex items-center justify-center text-roamly-g1 shrink-0">
        <Sparkles size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-dm-sans text-sm text-roamly-g0 leading-snug">
          Hai salvato <span className="font-semibold">{cluster.luoghi.length} posti</span>
          {nomeZona ? <> vicino a <span className="font-semibold">{nomeZona}</span></> : ' nella stessa zona'}.
          Ci organizziamo un viaggio?
        </p>
        <button
          onClick={() => navigate('/viaggi/nuovo', { state: { daLuoghi: cluster.info } })}
          className="mt-2 font-dm-sans text-xs font-semibold text-roamly-g1 hover:underline"
        >
          Organizza il viaggio →
        </button>
      </div>
      <button
        onClick={scarta}
        aria-label="Non ora"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-roamly-text/35 hover:bg-roamly-g7"
      >
        <X size={14} />
      </button>
    </div>
  )
}
