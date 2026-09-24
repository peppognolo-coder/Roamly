import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Sparkles, Briefcase } from 'lucide-react'
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
import { calcolaStatisticheChecklist, VALIGIA_TEMPLATES, VALIGIA_TEMPLATE_ICON, costruisciBlocchiSuggerimenti } from '@/lib/checklist-templates'
import { usePrenotazioni } from '@/hooks/usePrenotazioni'
import { useTappe } from '@/hooks/useTappe'
import type { TemplateChecklistItem, CategoriaChecklist } from '@/lib/checklist-templates'
import type { ViaggioConStato, ChecklistItem }        from '@/types'

// Sezioni della valigia — ordine e titoli fissi. "varie" è anche il
// fallback per gli item senza categoria (aggiunti a mano, o creati
// prima dell'introduzione di questa colonna).
const SEZIONI: { id: CategoriaChecklist | 'varie'; titolo: string }[] = [
  { id: 'documenti',     titolo: 'Documenti' },
  { id: 'salute',        titolo: 'Salute' },
  { id: 'abbigliamento', titolo: 'Abbigliamento' },
  { id: 'tech',          titolo: 'Tech' },
  { id: 'varie',         titolo: 'Varie' },
]

function categoriaEffettiva(item: ChecklistItem): CategoriaChecklist | 'varie' {
  return (item.categoria as CategoriaChecklist | null) ?? 'varie'
}

// ============================================================
// ChecklistSection — accordion checklist per un singolo viaggio
//
// LAZY LOADING: la query checklist.byViaggio parte solo quando
// `abilitato` è true (primo tap sull'accordion).
// React Query mantiene poi la cache per gli accessi successivi.
// ============================================================

interface ChecklistSectionProps {
  viaggio: ViaggioConStato
  /** 'accordion' (default): usato da PianificaPage — più viaggi in
   *  elenco, si apre al tap. 'pagina': usato da ValigiaPage, pagina
   *  dedicata a un solo viaggio — sempre aperta, niente header cliccabile. */
  variante?: 'accordion' | 'pagina'
}

export function ChecklistSection({ viaggio, variante = 'accordion' }: ChecklistSectionProps) {
  const paginaDedicata = variante === 'pagina'
  const [isExpanded, setIsExpanded] = useState(paginaDedicata)
  // Traccia se l'accordion è stato aperto almeno una volta
  // — una volta true, rimane true per tutta la sessione.
  const [abilitato, setAbilitato]   = useState(paginaDedicata)
  const [showSuggerimenti, setShowSuggerimenti] = useState(false)

  function handleToggle() {
    if (paginaDedicata) return // pagina dedicata: sempre aperta, niente collapse
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

  // Il riordino resta confinato alla sezione dell'item trascinato —
  // ogni sezione è un elenco a sé (vedi rendering). Riassegna
  // esattamente gli stessi valori di `ordine` che la sezione occupava
  // già, solo in sequenza diversa: non tocca l'ordine globale degli
  // item delle altre sezioni, che restano intatti e interfogliati.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const trascinato = items.find((i) => i.id === active.id)
    if (!trascinato) return
    const sezione = items.filter((i) => categoriaEffettiva(i) === categoriaEffettiva(trascinato))

    const oldIndex = sezione.findIndex((i) => i.id === active.id)
    const newIndex = sezione.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const riordinati = arrayMove(sezione, oldIndex, newIndex)
    const ordiniOriginali = sezione.map((i) => i.ordine).sort((a, b) => a - b)
    reorder(riordinati.map((item, i) => ({ id: item.id, ordine: ordiniOriginali[i] })))
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

  function handleBatch(scelti: TemplateChecklistItem[], fonte?: string) {
    const base = nextOrdine.current
    nextOrdine.current += scelti.length
    createBatch({
      items:      scelti.map((i) => ({ testo: i.testo, categoria: i.categoria, fonte })),
      ordineBase: base,
    })
    setShowSuggerimenti(false)
  }

  function handleApplicaTemplate(items: TemplateChecklistItem[], fonte?: string) {
    handleBatch(items, fonte)
  }

  const testiEsistenti = items.map((i) => i.testo)
  const hasItems       = items.length > 0

  // Suggerimenti intelligenti — stagione (data+paese del viaggio),
  // prenotazioni (biglietti/documenti) e itinerario (attività già
  // pianificate). Gated su `abilitato` come la checklist stessa:
  // niente query finché l'accordion non viene aperto, altrimenti
  // ogni ChecklistSection visibile in PianificaPage (una per
  // viaggio pianificato) sparerebbe due query extra a caricamento
  // pagina, anche per viaggi mai espansi.
  const { data: prenotazioni = [] } = usePrenotazioni(viaggio.id, abilitato)
  const { data: tappe = [] }        = useTappe(viaggio.id, abilitato)
  const blocchiSuggerimenti = costruisciBlocchiSuggerimenti(viaggio, prenotazioni, tappe)

  // Blocchi ancora "attivi" — con almeno una voce non già in valigia.
  // Mostrati SEMPRE (non solo a valigia vuota, come prima): sono legati
  // al periodo/luogo/prenotazioni del viaggio, non allo stato della
  // checklist, e devono restare visibili anche dopo il primo item aggiunto.
  const testiEsistentiLower = new Set(testiEsistenti.map((t) => t.toLowerCase()))
  const blocchiSuggerimentiAttivi = blocchiSuggerimenti
    .map((b) => ({ ...b, items: b.items.filter((i) => !testiEsistentiLower.has(i.testo.toLowerCase())) }))
    .filter((b) => b.items.length > 0)

  return (
    <div className="flex flex-col gap-0">

      {/* Pagina dedicata (ValigiaPage): card di progresso al posto
          dell'header-accordion — nome viaggio è già nel PageHeader. */}
      {paginaDedicata && hasItems && (
        <div className="p-4 rounded-2xl bg-white shadow-roamly mb-3.5">
          <div className="flex items-end justify-between mb-2.5">
            <p className="font-lora text-base font-semibold text-roamly-g0">
              {stats.completati} di {stats.totale} in valigia
            </p>
            <span className="font-dm-mono text-sm font-medium text-roamly-g3">
              {stats.percentuale}%
            </span>
          </div>
          <div className="h-1.5 bg-roamly-g6 rounded-full overflow-hidden">
            <div
              className="h-full bg-roamly-g3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentuale}%` }}
            />
          </div>
          <p className="mt-2.5 font-dm-sans text-xs text-roamly-g2">
            {stats.percentuale === 100
              ? 'Tutto dentro. Puoi chiudere la valigia.'
              : `Ancora ${stats.totale - stats.completati} da mettere in valigia.`}
          </p>
        </div>
      )}

      {/* ── Header accordion (solo variante 'accordion') ── */}
      {!paginaDedicata && (
      <button
        onClick={handleToggle}
        className="
          flex items-center gap-3 py-3 w-full text-left
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3 rounded-lg
          active:opacity-70 transition-opacity duration-100
        "
        aria-expanded={isExpanded}
      >
        {/* Icona valigia — nome ed emoji del viaggio sono già nella
            ViaggioCard appena sopra, ripeterli qui era ridondante. */}
        <span className="shrink-0 w-7 h-7 rounded-lg bg-roamly-g7 flex items-center justify-center text-roamly-g2">
          <Briefcase size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-dm-sans text-sm font-semibold text-roamly-g1">
            Valigia
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
              <span className="font-dm-mono text-[10px] text-roamly-g2 shrink-0">
                {stats.completati}/{stats.totale}
              </span>
            </div>
          )}
          {!hasItems && !abilitato && (
            <p className="font-dm-sans text-[10px] text-roamly-g2 mt-0.5">
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
      )}

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

              {/* Suggerimenti intelligenti — SEMPRE visibili quando c'è
                  qualcosa da suggerire, non solo a valigia vuota: seguono
                  il periodo/luogo/prenotazioni del viaggio, non lo stato
                  della checklist. Ogni voce sparisce dal blocco appena
                  viene aggiunta (vedi blocchiSuggerimentiAttivi sopra). */}
              {!isLoadingChecklist && blocchiSuggerimentiAttivi.length > 0 && (
                <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-roamly-g7 border border-roamly-g6">
                  <p className="font-dm-mono text-[9.5px] font-medium tracking-wider uppercase text-roamly-g2">
                    I suggerimenti seguono il viaggio
                  </p>
                  {blocchiSuggerimentiAttivi.map((blocco) => {
                    const BloccoIcon = blocco.icon
                    return (
                      <button
                        key={blocco.id}
                        onClick={() => handleApplicaTemplate(blocco.items, blocco.id)}
                        disabled={isBatchLoading}
                        className="
                          flex items-center gap-2.5 w-full py-3 px-3.5
                          bg-white border-l-[3px] border-roamly-g4 rounded-xl
                          hover:bg-roamly-g6/40 active:scale-[0.98]
                          transition-all duration-150
                          disabled:opacity-50
                        "
                      >
                        <span className="w-8 h-8 rounded-lg bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g1">
                          <BloccoIcon size={15} />
                        </span>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-dm-sans text-xs font-semibold text-roamly-g0 truncate">
                            {blocco.titolo}
                          </p>
                          <p className="font-dm-sans text-[11px] text-roamly-g2 truncate">
                            {blocco.sottotitolo} · {blocco.items.length} {blocco.items.length === 1 ? 'voce' : 'voci'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lista item */}
              {!isLoadingChecklist && hasItems && (
                <>
                  {/* Barra progresso dettagliata — non in pagina dedicata,
                      dove c'è già la card di progresso sopra */}
                  {!paginaDedicata && (
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-dm-sans text-xs text-roamly-g2 flex items-center gap-1">
                        {stats.percentuale === 100
                          ? <><CheckCircle2 size={12} className="text-roamly-g3" /> Tutto pronto!</>
                          : `${stats.completati} di ${stats.totale} completati`
                        }
                      </span>
                      <span className="font-dm-mono text-xs font-medium text-roamly-g2">
                        {stats.percentuale}%
                      </span>
                    </div>
                  )}

                  {/* Sezioni — documenti/salute/abbigliamento/tech/varie.
                      Un unico DndContext, una SortableContext per
                      sezione: il trascinamento riordina solo dentro
                      la stessa sezione (vedi handleDragEnd). */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex flex-col gap-4">
                      {SEZIONI.map((sez) => {
                        const itemsSezione = items.filter((i) => categoriaEffettiva(i) === sez.id)
                        if (itemsSezione.length === 0) return null
                        return (
                          <div key={sez.id} className="flex flex-col gap-1.5">
                            <div className="flex items-baseline justify-between px-0.5">
                              <span className="font-dm-mono text-[11px] font-medium tracking-wide uppercase text-roamly-g2">
                                {sez.titolo}
                              </span>
                              <span className="font-dm-mono text-[10px] text-roamly-g2">
                                {itemsSezione.filter((i) => i.completato).length}/{itemsSezione.length}
                              </span>
                            </div>
                            <SortableContext
                              items={itemsSezione.map((i) => i.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {itemsSezione.map((item) => (
                                <ChecklistItemRow
                                  key={item.id}
                                  item={item}
                                  onToggle={toggle}
                                  onDelete={deleteItem}
                                  isToggling={isToggling}
                                />
                              ))}
                            </SortableContext>
                          </div>
                        )
                      })}
                    </div>
                  </DndContext>
                </>
              )}

              {/* Empty state + template tematici — i blocchi di
                  suggerimenti intelligenti sono già mostrati sopra
                  (sempre visibili, non solo qui) */}
              {!isLoadingChecklist && !hasItems && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="font-dm-sans text-sm text-roamly-g2">
                    {blocchiSuggerimentiAttivi.length > 0
                      ? 'Oppure parti da un tipo di viaggio:'
                      : 'La checklist è vuota. Parti da un template:'}
                  </p>

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
                    font-dm-sans text-xs text-roamly-g2
                    hover:text-roamly-g1
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
        blocchiSuggerimenti={blocchiSuggerimenti}
      />
    </div>
  )
}
