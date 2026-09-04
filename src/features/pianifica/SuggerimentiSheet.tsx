import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TEMPLATE_BASE,
  CATEGORIA_LABEL,
  CATEGORIA_ICON,
  type TemplateChecklistItem,
  type CategoriaChecklist,
  type BloccoSuggerimenti,
} from '@/lib/checklist-templates'
import { Button } from '@/components/ui/Button'

// ============================================================
// SuggerimentiSheet — bottom sheet con i template predefiniti
// Multi-select: l'utente sceglie quali item aggiungere.
// Conferma → batch insert via useCreateChecklistItemsBatch.
//
// `blocchiSuggerimenti` (stagione / prenotazioni / itinerario)
// compaiono in gruppi dedicati ed evidenziati in cima alla lista,
// ognuno con titolo+sottotitolo che spiega il "perché" — prima
// delle categorie generiche del pool statico. Stessi suggerimenti
// già mostrati nello stato vuoto, qui disponibili anche a
// checklist non vuota.
// ============================================================

interface SuggerimentiSheetProps {
  isOpen:            boolean
  onClose:           () => void
  onConferma:        (items: TemplateChecklistItem[]) => void
  isLoading:         boolean
  testiEsistenti:    string[]   // per escludere item già presenti
  blocchiSuggerimenti?: BloccoSuggerimenti[]
}

// ------------------------------------------------------------
// GruppoItem — riga selezionabile riusata sia per i blocchi
// intelligenti (stile evidenziato) sia per il pool generico.
// ------------------------------------------------------------

function GruppoItem({
  testo,
  isSelected,
  evidenziato,
  onClick,
}: {
  testo: string
  isSelected: boolean
  evidenziato: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 w-full text-left
        rounded-xl border
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
        ${evidenziato
          ? (isSelected
              ? 'bg-roamly-coral/15 border-roamly-coral/40'
              : 'bg-white border-roamly-coral/20 hover:border-roamly-coral/40')
          : (isSelected
              ? 'bg-roamly-g6 border-roamly-g4'
              : 'bg-white border-roamly-g6 hover:border-roamly-g5')
        }
      `}
    >
      <div className={`
        w-5 h-5 rounded-md border-2 shrink-0
        flex items-center justify-center
        ${isSelected
          ? (evidenziato ? 'bg-roamly-coral border-roamly-coral' : 'bg-roamly-g2 border-roamly-g2')
          : 'border-roamly-g4'
        }
      `}>
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="font-dm-sans text-sm text-roamly-text">{testo}</span>
    </button>
  )
}

export function SuggerimentiSheet({
  isOpen,
  onClose,
  onConferma,
  isLoading,
  testiEsistenti,
  blocchiSuggerimenti = [],
}: SuggerimentiSheetProps) {
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set())

  // Filtra i template già presenti nella checklist
  const disponibili = TEMPLATE_BASE.filter(
    (t) => !testiEsistenti.includes(t.testo)
  )

  // Blocchi intelligenti: item già in checklist esclusi, e deduplicati
  // tra loro e contro il pool generico (evita doppioni se lo stesso
  // testo compare in più blocchi, es. "Scarpe comode" in stagione e tappe)
  const testiGiaMostrati = new Set(disponibili.map((d) => d.testo))
  const blocchiFiltrati = blocchiSuggerimenti
    .map((blocco) => {
      const itemsFiltrati = blocco.items.filter((i) => {
        if (testiEsistenti.includes(i.testo)) return false
        if (testiGiaMostrati.has(i.testo)) return false
        testiGiaMostrati.add(i.testo)
        return true
      })
      return { ...blocco, items: itemsFiltrati }
    })
    .filter((blocco) => blocco.items.length > 0)

  // Raggruppa il pool generico per categoria
  const perCategoria = disponibili.reduce<Record<CategoriaChecklist, TemplateChecklistItem[]>>(
    (acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = []
      acc[item.categoria].push(item)
      return acc
    },
    {} as Record<CategoriaChecklist, TemplateChecklistItem[]>
  )

  const tuttiGliItem = [
    ...blocchiFiltrati.flatMap((b) => b.items),
    ...disponibili,
  ]
  const nessunSuggerimento = tuttiGliItem.length === 0

  function toggleItem(testo: string) {
    setSelezionati((prev) => {
      const next = new Set(prev)
      if (next.has(testo)) {
        next.delete(testo)
      } else {
        next.add(testo)
      }
      return next
    })
  }

  function selezionaTutti() {
    setSelezionati(new Set(tuttiGliItem.map((i) => i.testo)))
  }

  function deselezionaTutti() {
    setSelezionati(new Set())
  }

  function handleConferma() {
    const scelti = tuttiGliItem.filter((i) => selezionati.has(i.testo))
    if (scelti.length === 0) return
    onConferma(scelti)
    setSelezionati(new Set())
  }

  function handleClose() {
    setSelezionati(new Set())
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="
              fixed bottom-0 left-0 right-0 z-50
              flex justify-center
            "
          >
            <div className="
              w-full max-w-[430px]
              bg-roamly-bg rounded-t-3xl
              shadow-2xl shadow-black/20
              flex flex-col
              max-h-[75vh]
            ">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-roamly-g5 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-roamly-g6">
                <div>
                  <h3 className="font-lora text-lg font-semibold text-roamly-g0">
                    Suggerimenti
                  </h3>
                  <p className="font-dm-sans text-xs text-roamly-text/40 mt-0.5">
                    Seleziona i punti da aggiungere
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {selezionati.size > 0 ? (
                    <button
                      onClick={deselezionaTutti}
                      className="font-dm-sans text-xs text-roamly-text/50 hover:text-roamly-text/70"
                    >
                      Deseleziona tutti
                    </button>
                  ) : (
                    <button
                      onClick={selezionaTutti}
                      className="font-dm-sans text-xs text-roamly-g2 hover:text-roamly-g1"
                    >
                      Seleziona tutti
                    </button>
                  )}
                </div>
              </div>

              {/* Lista — scrollabile */}
              <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-4">
                {nessunSuggerimento ? (
                  <p className="font-dm-sans text-sm text-center text-roamly-text/40 py-6">
                    Tutti i suggerimenti sono già nella tua checklist.
                  </p>
                ) : (
                  <>
                    {/* Blocchi intelligenti — in cima, evidenziati, ognuno
                        con il proprio "perché" */}
                    {blocchiFiltrati.map((blocco) => {
                      const BloccoIcon = blocco.icon
                      return (
                        <div key={blocco.id} className="flex flex-col gap-2">
                          <p className="font-dm-sans text-xs font-semibold text-roamly-coral uppercase tracking-wider flex items-center gap-1.5">
                            <BloccoIcon size={12} />
                            {blocco.titolo}
                          </p>
                          <p className="font-dm-sans text-[11px] text-roamly-text/40 -mt-1 mb-0.5">
                            {blocco.sottotitolo}
                          </p>
                          {blocco.items.map((item) => (
                            <GruppoItem
                              key={item.testo}
                              testo={item.testo}
                              isSelected={selezionati.has(item.testo)}
                              evidenziato
                              onClick={() => toggleItem(item.testo)}
                            />
                          ))}
                        </div>
                      )
                    })}

                    {/* Pool generico per categoria */}
                    {Object.entries(perCategoria).map(([cat, catItems]) => {
                      const CategoriaIcon = CATEGORIA_ICON[cat as CategoriaChecklist]
                      return (
                        <div key={cat} className="flex flex-col gap-2">
                          <p className="font-dm-sans text-xs font-semibold text-roamly-text/40 uppercase tracking-wider flex items-center gap-1.5">
                            <CategoriaIcon size={12} />
                            {CATEGORIA_LABEL[cat as CategoriaChecklist]}
                          </p>
                          {catItems.map((item) => (
                            <GruppoItem
                              key={item.testo}
                              testo={item.testo}
                              isSelected={selezionati.has(item.testo)}
                              evidenziato={false}
                              onClick={() => toggleItem(item.testo)}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pt-3 pb-6 border-t border-roamly-g6">
                <Button
                  onClick={handleConferma}
                  disabled={selezionati.size === 0 || isLoading}
                  isLoading={isLoading}
                  fullWidth
                  size="lg"
                >
                  {selezionati.size === 0
                    ? 'Seleziona almeno un punto'
                    : `Aggiungi ${selezionati.size} ${selezionati.size === 1 ? 'punto' : 'punti'}`
                  }
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
