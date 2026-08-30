import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Landmark, UtensilsCrossed, Car, PartyPopper, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { TappaViaggio, CategoriaTappa } from '@/types'

// ============================================================
// ROAMLY — TappaForm
// Form condiviso tra creazione e modifica, usato sia da Itinerario
// che da Attività (mappa) — stessa tabella, stesso form.
// La posizione (lat/lng) si imposta solo toccando la mappa in
// Attività — qui è un dato read-only, mostrato come conferma.
// ============================================================

const CATEGORIE: { value: CategoriaTappa; label: string; icon: LucideIcon }[] = [
  { value: 'visita',     label: 'Visita',     icon: Landmark },
  { value: 'ristorante', label: 'Ristorante', icon: UtensilsCrossed },
  { value: 'trasporto',  label: 'Trasporto',  icon: Car },
  { value: 'svago',      label: 'Svago',      icon: PartyPopper },
  { value: 'altro',      label: 'Altro',      icon: MapPin },
]

const tappaFormSchema = z.object({
  nome: z.string().min(1, 'Il nome è obbligatorio').max(80).trim(),
  categoria: z.enum(['visita', 'ristorante', 'trasporto', 'svago', 'altro']),
  giorno: z.string().optional().or(z.literal('')),
  ora: z.string().optional().or(z.literal('')),
  indirizzo: z.string().max(120).optional().or(z.literal('')),
  note: z.string().max(500).optional().or(z.literal('')),
})

export type TappaFormData = z.infer<typeof tappaFormSchema>

interface TappaFormProps {
  /** Tappa esistente → modalità edit. Assente → modalità create. */
  tappa?: TappaViaggio
  /** Giorno pre-selezionato (arrivo da Itinerario, "+ " su un giorno specifico) */
  giornoIniziale?: string
  /** Coordinate dal tap sulla mappa (arrivo da Attività) — solo in creazione */
  posizioneIniziale?: { lat: number; lng: number }
  onSubmit: (data: TappaFormData) => void
  isLoading: boolean
  error?: string | null
  submitLabel?: string
}

export function TappaForm({
  tappa,
  giornoIniziale,
  posizioneIniziale,
  onSubmit,
  isLoading,
  error,
  submitLabel = 'Salva',
}: TappaFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TappaFormData>({
    resolver: zodResolver(tappaFormSchema),
    defaultValues: {
      nome: tappa?.nome ?? '',
      categoria: tappa?.categoria ?? 'visita',
      giorno: tappa?.giorno ?? giornoIniziale ?? '',
      ora: tappa?.ora?.slice(0, 5) ?? '',
      indirizzo: tappa?.indirizzo ?? '',
      note: tappa?.note ?? '',
    },
  })

  const haPosizione = !!(tappa?.lat && tappa?.lng) || !!posizioneIniziale

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {haPosizione && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-roamly-g6 rounded-full w-fit">
          <MapPin size={14} className="text-roamly-g2" />
          <span className="font-dm-sans text-xs font-medium text-roamly-g1">
            Posizione sulla mappa impostata
          </span>
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
              {CATEGORIE.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => field.onChange(cat.value)}
                    className={`
                      flex items-center gap-1.5 px-3.5 py-2 rounded-full
                      font-dm-sans text-sm font-medium
                      border transition-all duration-150
                      ${field.value === cat.value
                        ? 'bg-roamly-g0 border-roamly-g0 text-white'
                        : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/60 hover:border-roamly-g4'
                      }
                    `}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          )}
        />
      </div>

      {/* Nome */}
      <Input
        label="Nome"
        placeholder="Es. Sagrada Familia"
        error={errors.nome?.message}
        {...register('nome')}
      />

      {/* Giorno + Ora */}
      <div className="grid grid-cols-2 gap-4">
        <Input type="date" label="Giorno" error={errors.giorno?.message} {...register('giorno')} />
        <Input type="time" label="Orario (opzionale)" {...register('ora')} />
      </div>

      {/* Indirizzo */}
      <Input
        label="Indirizzo o luogo"
        placeholder="Es. Carrer de Mallorca, 401"
        error={errors.indirizzo?.message}
        {...register('indirizzo')}
      />

      {/* Note */}
      <div className="flex flex-col gap-2">
        <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
          Note <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </label>
        <textarea
          {...register('note')}
          rows={3}
          placeholder="Orari di apertura, prenotazione necessaria..."
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
