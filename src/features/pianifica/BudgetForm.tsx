import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CATEGORIA_BUDGET_OPTIONS } from '@/types'
import type { BudgetVoce } from '@/types'

// ============================================================
// ROAMLY — BudgetForm
// Form condiviso tra creazione e modifica di una voce di spesa.
// ============================================================

const budgetFormSchema = z.object({
  categoria: z.enum(['trasporto', 'alloggio', 'food', 'attivita', 'shopping', 'altro']),
  importo: z.string().min(1, 'Inserisci un importo'),
  nota: z.string().max(200).optional().or(z.literal('')),
})

export type BudgetFormData = z.infer<typeof budgetFormSchema>

interface BudgetFormProps {
  voce?: BudgetVoce
  onSubmit: (data: BudgetFormData) => void
  isLoading: boolean
  error?: string | null
  submitLabel?: string
}

export function BudgetForm({
  voce,
  onSubmit,
  isLoading,
  error,
  submitLabel = 'Salva',
}: BudgetFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoria: voce?.categoria ?? 'altro',
      importo: voce?.importo != null ? String(voce.importo) : '',
      nota: voce?.nota ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Categoria */}
      <div className="flex flex-col gap-2">
        <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
          Categoria
        </label>
        <Controller
          name="categoria"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CATEGORIA_BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={`
                    px-3.5 py-2 rounded-full
                    font-dm-sans text-sm font-medium
                    border transition-all duration-150
                    ${field.value === opt.value
                      ? 'bg-roamly-g0 border-roamly-g0 text-white'
                      : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/60 hover:border-roamly-g4'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Importo */}
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        label="Importo (€)"
        placeholder="0,00"
        error={errors.importo?.message}
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        {...register('importo')}
      />

      {/* Nota */}
      <div className="flex flex-col gap-2">
        <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
          Nota <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </label>
        <textarea
          {...register('nota')}
          rows={2}
          placeholder="Es. Cena del primo giorno"
          className="
            w-full px-4 py-3
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl resize-none
            font-dm-sans text-sm text-roamly-text
            placeholder:text-roamly-text/30
            focus:outline-none focus:ring-2 focus:ring-roamly-g3 focus:border-transparent
          "
        />
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        {submitLabel}
      </Button>
    </form>
  )
}
