import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { NotebookPen, Trash2, Pencil, Check, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { useViaggio }   from '@/hooks/useViaggi'
import {
  useNoteViaggio, useCreateNota, useUpdateNota, useDeleteNota,
} from '@/hooks/useNoteViaggio'
import type { NotaViaggio } from '@/types'

// ============================================================
// NoteViaggioPage — /viaggi/:id/note
// Appunti liberi. Niente form dedicato: aggiunta rapida in cima,
// ogni nota si modifica/elimina direttamente nella sua card.
// ============================================================

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function NoteViaggioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: note = [], isLoading } = useNoteViaggio(viaggioId)

  const { createNota, isLoading: isCreating, error: createError } = useCreateNota(viaggioId ?? '')
  const { updateNota, error: updateError } = useUpdateNota(viaggioId ?? '')
  const { deleteNota, error: deleteError } = useDeleteNota(viaggioId ?? '')

  const [testoNuovaNota, setTestoNuovaNota] = useState('')

  function handleAggiungi() {
    const testo = testoNuovaNota.trim()
    if (!testo) return
    createNota(testo)
    setTestoNuovaNota('')
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Note di viaggio" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {/* Aggiunta rapida */}
          <div className="bg-white rounded-2xl shadow-roamly p-4 flex flex-col gap-3">
            {createError && (
              <p className="font-dm-sans text-xs text-red-500">{createError}</p>
            )}
            <textarea
              value={testoNuovaNota}
              onChange={(e) => setTestoNuovaNota(e.target.value)}
              rows={3}
              placeholder="Scrivi un appunto, un promemoria, un'idea..."
              className="
                w-full px-1
                font-dm-sans text-sm text-roamly-text
                placeholder:text-roamly-text/30
                resize-none focus:outline-none
              "
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAggiungi}
                isLoading={isCreating}
                disabled={!testoNuovaNota.trim()}
              >
                Aggiungi nota
              </Button>
            </div>
          </div>

          {/* Lista note */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : note.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <NotebookPen size={28} className="text-roamly-g3" />
              <p className="font-dm-sans text-sm text-roamly-text/45 max-w-[220px]">
                Nessuna nota ancora. Scrivi il primo appunto qui sopra.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {deleteError && (
                <p className="font-dm-sans text-xs text-red-500 text-center">{deleteError}</p>
              )}
              {note.map((n) => (
                <NotaCard
                  key={n.id}
                  nota={n}
                  onSalva={(contenuto) => updateNota(n.id, contenuto)}
                  onElimina={() => deleteNota(n.id)}
                  errore={updateError}
                />
              ))}
            </div>
          )}

        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

function NotaCard({
  nota,
  onSalva,
  onElimina,
  errore,
}: {
  nota: NotaViaggio
  onSalva: (contenuto: string) => void
  onElimina: () => void
  errore: string | null
}) {
  const [inModifica, setInModifica] = useState(false)
  const [testo, setTesto] = useState(nota.contenuto)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSalva() {
    const pulito = testo.trim()
    if (!pulito) return
    onSalva(pulito)
    setInModifica(false)
  }

  function handleAnnulla() {
    setTesto(nota.contenuto)
    setInModifica(false)
  }

  if (showDeleteConfirm) {
    return (
      <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
        <p className="font-dm-sans text-sm font-medium text-red-600">
          Eliminare questa nota?
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
            Annulla
          </Button>
          <Button onClick={onElimina} className="flex-1 !bg-red-500 hover:!bg-red-600">
            Elimina
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-roamly p-4 flex flex-col gap-2">
      {inModifica ? (
        <>
          {errore && <p className="font-dm-sans text-xs text-red-500">{errore}</p>}
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            rows={3}
            autoFocus
            className="
              w-full font-dm-sans text-sm text-roamly-text
              resize-none focus:outline-none
            "
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleAnnulla}
              className="w-8 h-8 rounded-full flex items-center justify-center text-roamly-text/40 hover:bg-roamly-g7"
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSalva}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-roamly-g0 hover:bg-roamly-g1"
            >
              <Check size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="font-dm-sans text-sm text-roamly-text whitespace-pre-wrap">
            {nota.contenuto}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="font-dm-sans text-[11px] text-roamly-text/35">
              {formatData(nota.updated_at)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInModifica(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-roamly-text/35 hover:bg-roamly-g7 hover:text-roamly-g2"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-roamly-text/35 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
