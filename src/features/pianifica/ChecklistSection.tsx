import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Sparkles } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { ChecklistItemRow } from './ChecklistItemRow'
import { ChecklistInput }   from './ChecklistInput'
import { SuggerimentiSheet } from './SuggerimentiSheet'
import { useChecklist }      from '@/hooks/useChecklist'
import {
  useCreateChecklistItem,
  useCreateChecklistItemsBatch,
  useToggleChecklistItem,
  useDeleteChecklistItem,
  useReorderChecklist,
} from '@/hooks/useCrudChecklist'
import { calcolaStatisticheChecklist, VALIGIA_TEMPLATES, VALIGIA_TEMPLATE_ICON, getSuggerimentiStagionali, STAGIONE_LABEL, STAGIONE_ICON } from '@/lib/checklist-templates'
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
  const { reorder }                                = useReorderChecklist(viaggio.id)

  // Sensori drag: PointerSensor per mouse/trackpad, TouchSensor per
  // mobile — un piccolo delay+tolleranza sul touch evita che uno
  // scroll verticale della pagina venga scambiato per un drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const riordinati = arrayMove(items, oldIndex, newIndex)
    reorder(riordinati.map((item, i) => ({ id: item.id, ordine: i })))
  }

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

  function handleApplicaTemplate(items: TemplateChecklistItem[]) {
    handleBatch(items)
  }

  const testiEsistenti = items.map((i) => i.testo)
  const hasItems       = items.length > 0

  // Suggerimento stagionale — dedotto da data_inizio/paese del
  // viaggio stesso, nessuna scelta manuale richiesta. null se il
  // viaggio non ha ancora una data di partenza impostata.
  const suggerimentoStagionale = getSuggerimentiStagionali(viaggio.data_inizio, viaggio.paese)

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
        <span className="shrink-0 text-roamly-g2"><ViaggioCoverIcon value={viaggio.cover_emoji} size={18} /></span>
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
                    <span className="font-dm-sans text-xs text-roamly-text/50 flex items-center gap-1">
                      {stats.percentuale === 100
                        ? <><CheckCircle2 size={12} className="text-roamly-g3" /> Tutto pronto!</>
                        : `${stats.completati} di ${stats.totale} completati`
                      }
                    </span>
                    <span className="font-dm-mono text-xs font-medium text-roamly-g2">
                      {stats.percentuale}%
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={items.map((i) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {items.map((item) => (
                          <ChecklistItemRow
                            key={item.id}
                            item={item}
                            onToggle={toggle}
                            onDelete={deleteItem}
                            isToggling={isToggling}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </>
              )}

              {/* Empty state + template tematici */}
              {!isLoadingChecklist && !hasItems && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="font-dm-sans text-sm text-roamly-text/40">
                    La checklist è vuota. Parti da un template:
                  </p>

                  {/* Suggerimento stagionale — evidenziato, dedotto dal
                      viaggio stesso (data + paese), nessuna scelta manuale */}
                  {suggerimentoStagionale && (
                    <button
                      onClick={() => handleApplicaTemplate(suggerimentoStagionale.items)}
                      disabled={isBatchLoading}
                      className="
                        flex items-center gap-2.5 w-full py-3 px-4
                        bg-roamly-coral/10 border border-roamly-coral/30 rounded-xl
                        hover:bg-roamly-coral/15 active:scale-[0.98]
                        transition-all duration-150
                        disabled:opacity-50
                      "
                    >
                      {(() => {
                        const StagioneIcon = STAGIONE_ICON[suggerimentoStagionale.stagione]
                        return <StagioneIcon size={18} className="text-roamly-coral shrink-0" />
                      })()}
                      <div className="flex-1 text-left">
                        <p className="font-dm-sans text-xs font-semibold text-roamly-g0">
                          Consigliato per il tuo viaggio
                        </p>
                        <p className="font-dm-sans text-[11px] text-roamly-text/50">
                          {STAGIONE_LABEL[suggerimentoStagionale.stagione]} — {suggerimentoStagionale.items.length} voci
                        </p>
                      </div>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 w-full">
                    {VALIGIA_TEMPLATES.map((template) => {
                      const Icon = VALIGIA_TEMPLATE_ICON[template.id]
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleApplicaTemplate(template.items)}
                          disabled={isBatchLoading}
                          className="
                            flex flex-col items-center gap-1.5 py-3.5
                            bg-roamly-g7 rounded-xl
                            hover:bg-roamly-g6 active:scale-[0.98]
                            transition-all duration-150
                            disabled:opacity-50
                          "
                        >
                          <Icon size={18} className="text-roamly-g2" />
                          <span className="font-dm-sans text-xs font-medium text-roamly-text/70">
                            {template.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setShowSuggerimenti(true)}
                    className="
                      flex items-center gap-2 px-4 py-2 mt-1
                      font-dm-sans text-xs font-medium text-roamly-g2
                      hover:text-roamly-g1
                      transition-colors duration-150
                    "
                  >
                    <Sparkles size={12} />
                    <span>Oppure scegli singole voci</span>
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
                    flex items-center justify-center gap-1
                  "
                >
                  <Sparkles size={12} />
                  Aggiungi suggerimenti predefiniti
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
        suggerimentoStagionale={suggerimentoStagionale}
      />
    </div>
  )
}
