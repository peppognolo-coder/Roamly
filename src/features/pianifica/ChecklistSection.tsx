import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChecklistItemRow } from './ChecklistItemRow'
import { ChecklistInput }   from './ChecklistInput'
import { SuggerimentiSheet } from './SuggerimentiSheet'
import { useChecklist }      from '@/hooks/useChecklist'
import {
  useCreateChecklistItem,
  useCreateChecklistItemsBatch,
  useToggleChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/useCrudChecklist'
import { calcolaStatisticheChecklist } from '@/lib/checklist-templates'
import type { TemplateChecklistItem }  from '@/lib/checklist-templates'
import type { ViaggioConStato }        from '@/types'

// ============================================================
// ChecklistSection — accordion checklist per un singolo viaggio
//
// LAZY LOADING: la query checklist.byViaggio parte solo quando
// `abilitato` è true (primo tap sull'accordion).
// React Query mantiene poi la cache per gli accessi successivi.
// ============================================================

interface ChecklistSectionProps {
  viaggio: ViaggioConStato
}

export function ChecklistSection({ viaggio }: ChecklistSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // Traccia se l'accordion è stato aperto almeno una volta
  // — una volta true, rimane true per tutta la sessione.
  const [abilitato, setAbilitato]   = useState(false)
  const [showSuggerimenti, setShowSuggerimenti] = useState(false)

  function handleToggle() {
    if (!abilitato) setAbilitato(true)   // prima apertura → abilita la query
    setIsExpanded((prev) => !prev)
  }

  // Query lazy: parte solo quando abilitato = true
  const { data: items = [], isLoading: isLoadingChecklist } = useChecklist(
    viaggio.id,
    abilitato
  )

  const { createItem, isLoading: isCreating }     = useCreateChecklistItem(viaggio.id)
  const { createBatch, isLoading: isBatchLoading } = useCreateChecklistItemsBatch(viaggio.id)
  const { toggle, isLoading: isToggling }          = useToggleChecklistItem(viaggio.id)
  const { deleteItem }                             = useDeleteChecklistItem(viaggio.id)

  const stats = calcolaStatisticheChecklist(items)

  // nextOrdine è un contatore locale sincronizzato con items.length
  // all'apertura dell'accordion e aggiornato localmente dopo ogni insert.
  // A differenza di `items.length` (cache React Query, aggiornata in modo
  // asincrono), useRef è sincrono: due insert rapidi consecutivi ricevono
  // sempre ordini distinti anche se il refetch non è ancora completato.
  const nextOrdine = useRef(0)

  // Sincronizza il contatore quando la lista caricata/aggiornata arriva
  useEffect(() => {
    if (items.length > 0) {
      nextOrdine.current = Math.max(nextOrdine.current, items.length)
    }
  }, [items.length])

  function handleAdd(testo: string) {
    createItem({ testo, ordine: nextOrdine.current++ })
  }

  function handleBatch(scelti: TemplateChecklistItem[]) {
    const base = nextOrdine.current
    nextOrdine.current += scelti.length
    createBatch({
      items:      scelti.map((i) => ({ testo: i.testo })),
      ordineBase: base,
    })
    setShowSuggerimenti(false)
  }

  const testiEsistenti = items.map((i) => i.testo)
  const hasItems       = items.length > 0

  return (
    <div className="flex flex-col gap-0">

      {/* ── Header accordion ── */}
      <button
        onClick={handleToggle}
        className="
          flex items-center gap-3 py-3 w-full text-left
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-lg
          active:opacity-70 transition-opacity duration-100
        "
        aria-expanded={isExpanded}
      >
        {/* Emoji + nome */}
        <span className="text-xl shrink-0">{viaggio.cover_emoji ?? '✈️'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-lora text-base font-semibold text-roamly-g0 truncate">
            {viaggio.nome}
          </p>
          {/* Barra progresso inline nell'header se ha item */}
          {hasItems && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-roamly-g6 rounded-full overflow-hidden">
                <div
                  className="h-full bg-roamly-g2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.percentuale}%` }}
                />
              </div>
              <span className="font-dm-mono text-[10px] text-roamly-text/40 shrink-0">
                {stats.completati}/{stats.totale}
              </span>
            </div>
          )}
          {!hasItems && !abilitato && (
            <p className="font-dm-sans text-[10px] text-roamly-text/35 mt-0.5">
              Nessun punto ancora
            </p>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="text-roamly-text/30">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </button>

      {/* ── Contenuto collassabile ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="checklist-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-3 pb-3 pt-1">

              {/* Loading skeleton */}
              {isLoadingChecklist && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-roamly-g6 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {/* Lista item */}
              {!isLoadingChecklist && hasItems && (
                <>
                  {/* Barra progresso dettagliata */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-dm-sans text-xs text-roamly-text/50">
                      {stats.percentuale === 100
                        ? '✅ Tutto pronto!'
                        : `${stats.completati} di ${stats.totale} completati`
                      }
                    </span>
                    <span className="font-dm-mono text-xs font-medium text-roamly-g2">
                      {stats.percentuale}%
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {items.map((item) => (
                      <ChecklistItemRow
                        key={item.id}
                        item={item}
                        onToggle={toggle}
                        onDelete={deleteItem}
                        isToggling={isToggling}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Empty state + suggerimenti prominenti */}
              {!isLoadingChecklist && !hasItems && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="font-dm-sans text-sm text-roamly-text/40">
                    La checklist è vuota.
                  </p>
                  <button
                    onClick={() => setShowSuggerimenti(true)}
                    className="
                      flex items-center gap-2 px-4 py-2.5
                      bg-roamly-g0 rounded-xl
                      font-dm-sans text-sm font-medium text-white
                      hover:bg-roamly-g1 active:scale-95
                      transition-all duration-150
                    "
                  >
                    <span>✨</span>
                    <span>Aggiungi suggerimenti</span>
                  </button>
                </div>
              )}

              {/* Input aggiunta manuale */}
              {!isLoadingChecklist && (
                <ChecklistInput
                  onAdd={handleAdd}
                  isLoading={isCreating}
                />
              )}

              {/* Pulsante suggerimenti secondario (quando già ci sono item) */}
              {!isLoadingChecklist && hasItems && (
                <button
                  onClick={() => setShowSuggerimenti(true)}
                  className="
                    font-dm-sans text-xs text-roamly-text/40
                    hover:text-roamly-g2
                    transition-colors duration-150
                    text-center py-1
                  "
                >
                  ✨ Aggiungi suggerimenti predefiniti
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet suggerimenti */}
      <SuggerimentiSheet
        isOpen={showSuggerimenti}
        onClose={() => setShowSuggerimenti(false)}
        onConferma={handleBatch}
        isLoading={isBatchLoading}
        testiEsistenti={testiEsistenti}
      />
    </div>
  )
}
