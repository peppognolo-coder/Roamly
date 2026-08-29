import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MoodPicker } from './MoodPicker'
import type { Ricordo } from '@/types'

// ============================================================
// ROAMLY — RicordoForm
// Ordine canonico campi (Master Prompt):
//   1. Mood (obbligatorio)
//   2. Titolo (obbligatorio)
//   3. Descrizione (opzionale)
//   4. Luogo (opzionale)
//   5. Data (default: oggi in timezone locale)
//   6. Preferito (toggle)
// ============================================================

// Data locale oggi — evita bug UTC per utenti in fuso orario italiano
function oggi(): string {
  return new Date().toLocaleDateString('sv') // 'sv' = formato YYYY-MM-DD in locale
}

// ------------------------------------------------------------
// Schema Zod
// ------------------------------------------------------------

const ricordoSchema = z.object({
  mood: z.enum(
    ['felice', 'meravigliato', 'sereno', 'entusiasta', 'ispirato'],
    { errorMap: () => ({ message: 'Seleziona come ti senti' }) }
  ),
  titolo: z
    .string()
    .min(1, 'Il titolo è obbligatorio')
    .max(80, 'Il titolo non può superare 80 caratteri')
    .trim(),
  testo: z
    .string()
    .max(1000, 'La descrizione non può superare 1000 caratteri')
    .optional()
    .or(z.literal('')),
  luogo: z
    .string()
    .max(80, 'Il luogo non può superare 80 caratteri')
    .optional()
    .or(z.literal('')),
  data: z.string().min(1, 'La data è obbligatoria'),
  preferito: z.boolean(),
})

export type RicordoFormData = z.infer<typeof ricordoSchema>

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface RicordoFormProps {
  ricordo?: Ricordo          // presente → modalità edit
  onSubmit: (data: RicordoFormData) => void
  isLoading: boolean
  error?: string | null
  submitLabel?: string
}

// ------------------------------------------------------------
// RicordoForm
// ------------------------------------------------------------

export function RicordoForm({
  ricordo,
  onSubmit,
  isLoading,
  error,
  submitLabel,
}: RicordoFormProps) {
  const isEdit = !!ricordo
  const label = submitLabel ?? (isEdit ? 'Salva modifiche' : 'Salva ricordo')

  // In modalità create (nessun ricordo), mood è undefined — Zod lo valida al submit.
  // In modalità edit, mood è sempre valorizzato dal ricordo esistente.
  // Non si usa cast insicuro: il tipo del valore di `values` è
  // `RicordoFormData | Partial<RicordoFormData>` per React Hook Form.
  const initialValues = {
    mood:      ricordo?.mood,
    titolo:    ricordo?.titolo    ?? '',
    testo:     ricordo?.testo     ?? '',
    luogo:     ricordo?.luogo     ?? '',
    data:      ricordo?.data      ?? oggi(),
    preferito: ricordo?.preferito ?? false,
  } as RicordoFormData

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RicordoFormData>({
    resolver: zodResolver(ricordoSchema),
    // `values` aggiorna il form ogni volta che il prop `ricordo` cambia
    values: initialValues,
  })

  const preferitoValue = watch('preferito')

  return (
    <div className="flex flex-col gap-6">
      {/* Errore globale */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 1. Mood */}
      <Controller
        name="mood"
        control={control}
        render={({ field }) => (
          <MoodPicker
            value={field.value || null}
            onChange={field.onChange}
            error={errors.mood?.message}
          />
        )}
      />

      {/* 2. Titolo */}
      <Input
        label="Titolo *"
        type="text"
        placeholder="Un momento da ricordare..."
        autoComplete="off"
        error={errors.titolo?.message}
        {...register('titolo')}
      />

      {/* 3. Descrizione */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-dm-sans font-medium text-roamly-text/70">
          Descrizione
        </label>
        <textarea
          placeholder="Racconta questo momento..."
          rows={4}
          className="
            w-full px-4 py-3
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl
            font-dm-sans text-base text-roamly-text
            placeholder:text-roamly-text/30
            resize-none
            transition-all duration-150
            outline-none
            focus:border-roamly-g2 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
          "
          {...register('testo')}
        />
        {errors.testo && (
          <p className="text-xs font-dm-sans text-red-500">{errors.testo.message}</p>
        )}
      </div>

      {/* 4. Luogo */}
      <Input
        label="Luogo"
        type="text"
        placeholder="Dove eri?"
        autoComplete="off"
        error={errors.luogo?.message}
        {...register('luogo')}
      />

      {/* 5. Data */}
      <Input
        label="Data"
        type="date"
        error={errors.data?.message}
        {...register('data')}
      />

      {/* 6. Preferito */}
      <button
        type="button"
        onClick={() => setValue('preferito', !preferitoValue)}
        className={`
          flex items-center gap-3 px-4 py-3.5
          rounded-2xl border
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          ${preferitoValue
            ? 'bg-roamly-g6 border-roamly-g4 text-roamly-g1'
            : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/50'
          }
        `}
      >
        <Heart
          size={20}
          className={preferitoValue ? 'fill-red-400 text-red-400' : 'text-roamly-text/40'}
        />
        <div className="flex-1 text-left">
          <p className="font-dm-sans font-medium text-sm">
            {preferitoValue ? 'Tra i preferiti' : 'Aggiungi ai preferiti'}
          </p>
          <p className="font-dm-sans text-xs opacity-60 mt-0.5">
            I ricordi preferiti appaiono nella sezione dedicata
          </p>
        </div>
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${preferitoValue ? 'bg-roamly-g3 border-roamly-g3' : 'border-roamly-g4'}
        `}>
          {preferitoValue && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </button>

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
