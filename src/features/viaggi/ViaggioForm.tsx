import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { COVER_ICON_OPTIONS, DEFAULT_COVER_ICON_ID } from '@/lib/viaggio-cover-icons'
import type { ViaggioConStato } from '@/types'

// ============================================================
// ROAMLY — ViaggioForm
// Form condiviso tra creazione e modifica.
// In modalità create: solo Nome obbligatorio (< 60 secondi).
// In modalità edit: tutti i campi modificabili.
// ============================================================

// ------------------------------------------------------------
// Schema Zod
// ------------------------------------------------------------

const viaFormSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Il nome del viaggio è obbligatorio')
      .max(60, 'Il nome non può superare 60 caratteri')
      .trim(),
    destinazione: z.string().max(80).trim().optional().or(z.literal('')),
    paese:        z.string().max(60).trim().optional().or(z.literal('')),
    data_inizio:  z.string().optional().or(z.literal('')),
    data_fine:    z.string().optional().or(z.literal('')),
    cover_emoji:  z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.data_inizio && d.data_fine) {
        return d.data_fine >= d.data_inizio
      }
      return true
    },
    {
      path: ['data_fine'],
      message: 'La data di fine deve essere successiva alla data di inizio',
    }
  )

export type ViaggioFormData = z.infer<typeof viaFormSchema>

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface ViaggioFormProps {
  /** Viaggio esistente → modalità edit. Assente → modalità create. */
  viaggio?: ViaggioConStato
  onSubmit: (data: ViaggioFormData) => void
  isLoading: boolean
  error?: string | null
  submitLabel?: string
}

// ------------------------------------------------------------
// ViaggioForm
// ------------------------------------------------------------

export function ViaggioForm({
  viaggio,
  onSubmit,
  isLoading,
  error,
  submitLabel,
}: ViaggioFormProps) {
  const isEdit = !!viaggio
  const label = submitLabel ?? (isEdit ? 'Salva modifiche' : 'Crea viaggio')

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ViaggioFormData>({
    resolver: zodResolver(viaFormSchema),
    // `values` (non `defaultValues`) aggiorna il form ogni volta che
    // il prop `viaggio` cambia — robusto con dati asincroni.
    values: {
      nome:         viaggio?.nome         ?? '',
      destinazione: viaggio?.destinazione ?? '',
      paese:        viaggio?.paese        ?? '',
      data_inizio:  viaggio?.data_inizio  ?? '',
      data_fine:    viaggio?.data_fine    ?? '',
      cover_emoji:  viaggio?.cover_emoji  ?? DEFAULT_COVER_ICON_ID,
    },
  })

  const selectedEmoji = watch('cover_emoji')

  return (
    <div className="flex flex-col gap-6">
      {/* Errore globale */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Icona picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-dm-sans font-medium text-roamly-text/70">
          Icona viaggio
        </label>
        <Controller
          name="cover_emoji"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2 flex-wrap">
              {COVER_ICON_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`
                      w-10 h-10 rounded-xl
                      flex items-center justify-center
                      border transition-all duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                      ${field.value === opt.value
                        ? 'bg-roamly-g0 border-roamly-g0 shadow-md scale-110 text-white'
                        : 'bg-roamly-g7 border-roamly-g5 hover:border-roamly-g3 text-roamly-text/60'
                      }
                    `}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>
          )}
        />
      </div>

      {/* Nome — unico campo obbligatorio */}
      <Input
        label="Nome viaggio *"
        type="text"
        placeholder="Es. Estate in Grecia"
        autoComplete="off"
        error={errors.nome?.message}
        {...register('nome')}
      />

      {/* Campi opzionali */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Destinazione"
              type="text"
              placeholder="Es. Santorini"
              error={errors.destinazione?.message}
              {...register('destinazione')}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Paese"
              type="text"
              placeholder="Es. Grecia"
              error={errors.paese?.message}
              {...register('paese')}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Data inizio"
              type="date"
              error={errors.data_inizio?.message}
              {...register('data_inizio')}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Data fine"
              type="date"
              error={errors.data_fine?.message}
              {...register('data_fine')}
            />
          </div>
        </div>
      </div>

      {/* Anteprima selezionata */}
      {!isEdit && (
        <div className="flex items-center gap-3 px-4 py-3 bg-roamly-g7 rounded-xl shadow-roamly">
          <ViaggioCoverIcon value={selectedEmoji} size={24} className="text-roamly-g2" />
          <div>
            <p className="font-dm-sans text-sm font-medium text-roamly-text">
              Anteprima viaggio
            </p>
            <p className="font-dm-sans text-xs text-roamly-text/40">
              Solo il nome è obbligatorio per iniziare
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isLoading}
        fullWidth
        size="lg"
      >
        {label}
      </Button>
    </div>
  )
}
