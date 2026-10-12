import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { nomeEsistenteONuovo, pulisciNomeRaccolta } from '@/lib/raccolte'

// ============================================================
// SelettoreRaccolte — fila di "chip" per scegliere le raccolte.
// • Con `onNessuna`: modalità "Salva in:" (una sola scelta, "Nessuna"
//   disponibile) — usata sopra la ricerca di Voglio andarci.
// • Senza `onNessuna`: modalità multipla (si accendono e spengono),
//   usata nella scheda del posto.
// "+ Nuova" apre un campo per scrivere il nome di una raccolta nuova.
// ============================================================

interface Props {
  /** Tutte le raccolte disponibili */
  tutte: string[]
  /** Quelle attive (selezione corrente) */
  selezionate: string[]
  onToggle: (nome: string) => void
  onNuova: (nome: string) => void
  onNessuna?: () => void
}

export function SelettoreRaccolte({ tutte, selezionate, onToggle, onNuova, onNessuna }: Props) {
  const [nuova, setNuova] = useState(false)
  const [testo, setTesto] = useState('')

  const attiva = (nome: string) => selezionate.some((s) => s.toLowerCase() === nome.toLowerCase())

  function conferma() {
    const nome = nomeEsistenteONuovo(tutte, testo)
    if (pulisciNomeRaccolta(nome)) onNuova(nome)
    setTesto('')
    setNuova(false)
  }

  const chip = (attivo: boolean) => `
    shrink-0 h-9 px-3.5 rounded-full border font-dm-sans text-[13px] font-medium
    inline-flex items-center gap-1.5 transition-colors active:scale-[0.97]
    ${attivo
      ? 'bg-roamly-g0 border-roamly-g0 text-white'
      : 'bg-white border-roamly-g5 text-roamly-g1'}
  `

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
      {onNessuna && (
        <button type="button" onClick={onNessuna} className={chip(selezionate.length === 0)}>
          Nessuna
        </button>
      )}

      {tutte.map((nome) => (
        <button key={nome} type="button" onClick={() => onToggle(nome)} className={chip(attiva(nome))}>
          {attiva(nome) && !onNessuna && <Check size={13} />}
          {nome}
        </button>
      ))}

      {nuova ? (
        <form
          onSubmit={(e) => { e.preventDefault(); conferma() }}
          className="shrink-0 h-9 flex items-center gap-1 pl-3 pr-1 rounded-full border border-roamly-g3 bg-white"
        >
          <input
            autoFocus
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={40}
            placeholder="Nome raccolta"
            className="w-[130px] bg-transparent outline-none font-dm-sans text-base text-roamly-text placeholder:text-roamly-text/30"
            style={{ fontSize: 16 }}
          />
          <button type="submit" aria-label="Crea raccolta"
            className="w-7 h-7 rounded-full bg-roamly-g0 text-white flex items-center justify-center">
            <Check size={14} />
          </button>
          <button type="button" aria-label="Annulla" onClick={() => { setNuova(false); setTesto('') }}
            className="w-7 h-7 rounded-full text-roamly-text/40 flex items-center justify-center">
            <X size={14} />
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setNuova(true)}
          className="shrink-0 h-9 px-3.5 rounded-full border border-dashed border-roamly-g4 text-roamly-g2
            font-dm-sans text-[13px] font-medium inline-flex items-center gap-1.5 active:scale-[0.97]">
          <Plus size={14} /> Nuova
        </button>
      )}
    </div>
  )
}
