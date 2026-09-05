import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { BudgetForm } from './BudgetForm'
import type { BudgetFormData } from './BudgetForm'
import { useBudgetVoci, useCreateBudgetVoce, useUpdateBudgetVoce, useDeleteBudgetVoce } from '@/hooks/useBudget'

// ============================================================
// BudgetVocePage — /viaggi/:id/budget/nuova (create)
//                   /viaggi/:id/budget/:voceId (edit)
// ============================================================

export function BudgetVocePage() {
  const { id: viaggioId, voceId } = useParams<{ id: string; voceId?: string }>()
  const isEdit = !!voceId && voceId !== 'nuova'

  const { data: voci } = useBudgetVoci(viaggioId)
  const voce = isEdit ? voci?.find((v) => v.id === voceId) : undefined

  const { createBudgetVoce, isLoading: isCreating, error: createError } = useCreateBudgetVoce(viaggioId ?? '')
  const { updateBudgetVoce, isLoading: isUpdating, error: updateError } = useUpdateBudgetVoce(viaggioId ?? '')
  const { deleteBudgetVoce, isLoading: isDeleting, error: deleteError } = useDeleteBudgetVoce(viaggioId ?? '')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSubmit(data: BudgetFormData) {
    const payload = {
      viaggio_id: viaggioId ?? '',
      categoria: data.categoria,
      importo: Number(data.importo.replace(',', '.')),
      nota: data.nota || null,
    }

    if (isEdit && voceId) {
      updateBudgetVoce(voceId, payload)
    } else {
      createBudgetVoce(payload)
    }
  }

  function handleDelete() {
    if (!voceId) return
    deleteBudgetVoce(voceId)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title={isEdit ? 'Modifica spesa' : 'Nuova spesa'}
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-8">
          <BudgetForm
            voce={voce}
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
            error={createError ?? updateError}
            submitLabel={isEdit ? 'Salva modifiche' : 'Aggiungi'}
          />

          {isEdit && (
            <div className="mt-6">
              {deleteError && (
                <p className="font-dm-sans text-sm text-red-500 mb-3 text-center">
                  {deleteError}
                </p>
              )}
              {!showDeleteConfirm ? (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500/70 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} className="mr-1.5" />
                  Elimina spesa
                </Button>
              ) : (
                <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
                  <p className="font-dm-sans text-sm font-medium text-red-600">
                    Eliminare questa spesa? L'azione non può essere annullata.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                      disabled={isDeleting}
                    >
                      Annulla
                    </Button>
                    <Button
                      onClick={handleDelete}
                      isLoading={isDeleting}
                      className="flex-1 !bg-red-500 hover:!bg-red-600"
                    >
                      Elimina
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
