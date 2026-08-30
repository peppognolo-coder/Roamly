import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TIPO_PRENOTAZIONE_OPTIONS } from '@/types'
import type { Prenotazione } from '@/types'

// ============================================================
// ROAMLY — PrenotazioneForm
// Form condiviso tra creazione e modifica.
// dettaglio.note: unico campo extra JSONB per ora, MVP.
// ============================================================

const prenotazioneFormSchema = z.object({
  tipo: z.enum(['trasporto', 'alloggio', 'museo', 'evento', 'food', 'visto', 'altro']),
  nome: z.string().min(1, 'Il nome è obbligatorio').max(80).trim(),
  data: z.string().optional().or(z.literal('')),
  prezzo: z.string().optional().or(z.literal('')),
  stato: z.enum(['confermato', 'in_attesa', 'annullato']),
  note: z.string().max(500).optional().or(z.literal('')),
})

export type PrenotazioneFormData = z.infer<typeof prenotazioneFormSchema>

interface PrenotazioneFormProps {
  /** Prenotazione esistente → modalità edit. Assente → modalità create. */
  prenotazione?: Prenotazione
  /** Tipo pre-selezionato quando si arriva da una categoria specifica dell'hub */
  tipoIniziale?: PrenotazioneFormData['tipo']
  onSubmit: (data: PrenotazioneFormData) => void
  isLoading: boolean
  error?: string | null
  submitLabel?: string
}

export function PrenotazioneForm({
  prenotazione,
  tipoIniziale,
  onSubmit,
  isLoading,
  error,
  submitLabel = 'Salva',
}: PrenotazioneFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrenotazioneFormData>({
    resolver: zodResolver(prenotazioneFormSchema),
    defaultValues: {
      tipo: prenotazione?.tipo ?? tipoIniziale ?? 'altro',
      nome: prenotazione?.nome ?? '',
      data: prenotazione?.data ?? '',
      prezzo: prenotazione?.prezzo != null ? String(prenotazione.prezzo) : '',
      stato: prenotazione?.stato ?? 'confermato',
      note: prenotazione?.dettaglio?.note ?? '',
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
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {TIPO_PRENOTAZIONE_OPTIONS.map((opt) => (
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

      {/* Nome */}
      <Input
        label="Nome"
        placeholder="Es. Volo Milano-Barcellona"
        error={errors.nome?.message}
        {...register('nome')}
      />

      {/* Data + Prezzo */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Data"
          error={errors.data?.message}
          {...register('data')}
        />
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          label="Prezzo (€)"
          placeholder="0,00"
          error={errors.prezzo?.message}
          {...register('prezzo')}
        />
      </div>

      {/* Stato */}
      <div className="flex flex-col gap-2">
        <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
          Stato
        </label>
        <Controller
          name="stato"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              {([
                { value: 'confermato', label: 'Confermato' },
                { value: 'in_attesa',  label: 'In attesa' },
                { value: 'annullato',  label: 'Annullato' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={`
                    flex-1 px-3 py-2 rounded-xl
                    font-dm-sans text-xs font-medium
                    border transition-all duration-150
                    ${field.value === opt.value
                      ? 'bg-roamly-g6 border-roamly-g4 text-roamly-g1'
                      : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50'
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

      {/* Note */}
      <div className="flex flex-col gap-2">
        <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
          Note <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </label>
        <textarea
          {...register('note')}
          rows={3}
          placeholder="Numero di riferimento, orario, indirizzo..."
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
