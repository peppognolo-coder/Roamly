import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TIPO_PRENOTAZIONE_OPTIONS } from '@/types'
import type { Prenotazione } from '@/types'

// ============================================================
// ROAMLY — PrenotazioneForm
// Form condiviso tra creazione e modifica.
//
// Layout: Categoria → Nome → [blocco dinamico per categoria] →
//         Data/Prezzo (sempre presente) → Stato → Note.
//
// Tutti i campi extra vivono in dettaglio (JSONB) — nessuna
// colonna dedicata, nessuna migrazione SQL necessaria.
//
// NOTA FUTURA: dettaglio.biglietto_path è un nome riservato per
// l'allegato foto biglietto (QR/barcode) — non ancora implementato
// lato UI, ma il modello dati non richiede modifiche per aggiungerlo.
// ============================================================

const SOTTOTIPI_TRASPORTO = ['aereo', 'treno', 'bus', 'auto', 'altro'] as const

const prenotazioneFormSchema = z.object({
  tipo: z.enum(['trasporto', 'alloggio', 'museo', 'evento', 'food', 'visto', 'altro']),
  nome: z.string().min(1, 'Il nome è obbligatorio').max(80).trim(),
  data: z.string().optional().or(z.literal('')),
  prezzo: z.string().optional().or(z.literal('')),
  stato: z.enum(['confermato', 'in_attesa', 'annullato']),
  note: z.string().max(500).optional().or(z.literal('')),

  // Trasporto
  sottotipo: z.enum(SOTTOTIPI_TRASPORTO).optional(),
  numero:    z.string().max(40).optional().or(z.literal('')),
  da:        z.string().max(60).optional().or(z.literal('')),
  a:         z.string().max(60).optional().or(z.literal('')),
  orario:    z.string().optional().or(z.literal('')),

  // Alloggio
  checkout:         z.string().optional().or(z.literal('')),
  numero_conferma:  z.string().max(60).optional().or(z.literal('')),

  // Musei / Eventi
  numero_biglietti: z.string().optional().or(z.literal('')),

  // Food
  numero_persone: z.string().optional().or(z.literal('')),

  // Visti
  numero_pratica: z.string().max(60).optional().or(z.literal('')),
  scadenza:       z.string().optional().or(z.literal('')),
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

// Etichetta del campo "Data" e "Numero" adattiva per categoria/sottotipo
function labelData(tipo: PrenotazioneFormData['tipo']): string {
  if (tipo === 'trasporto') return 'Data partenza'
  if (tipo === 'alloggio')  return 'Check-in'
  return 'Data'
}

function labelNumero(sottotipo: string | undefined): string {
  if (sottotipo === 'aereo') return 'Numero volo'
  if (sottotipo === 'treno') return 'Numero treno'
  return 'Numero (opzionale)'
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
      sottotipo: (prenotazione?.dettaglio?.sottotipo as typeof SOTTOTIPI_TRASPORTO[number]) ?? 'aereo',
      numero: prenotazione?.dettaglio?.numero ?? '',
      da: prenotazione?.dettaglio?.da ?? '',
      a: prenotazione?.dettaglio?.a ?? '',
      orario: prenotazione?.dettaglio?.orario ?? '',
      checkout: prenotazione?.dettaglio?.checkout ?? '',
      numero_conferma: prenotazione?.dettaglio?.numero_conferma ?? '',
      numero_biglietti: prenotazione?.dettaglio?.numero_biglietti ?? '',
      numero_persone: prenotazione?.dettaglio?.numero_persone ?? '',
      numero_pratica: prenotazione?.dettaglio?.numero_pratica ?? '',
      scadenza: prenotazione?.dettaglio?.scadenza ?? '',
    },
  })

  const tipo = useWatch({ control, name: 'tipo' })
  const sottotipo = useWatch({ control, name: 'sottotipo' })

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

      {/* ── Blocco dinamico: Trasporto ── */}
      {tipo === 'trasporto' && (
        <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
          <div className="flex flex-col gap-2">
            <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
              Mezzo
            </label>
            <Controller
              name="sottotipo"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'aereo', label: 'Aereo' },
                    { value: 'treno', label: 'Treno' },
                    { value: 'bus',   label: 'Bus' },
                    { value: 'auto',  label: 'Auto' },
                    { value: 'altro', label: 'Altro' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`
                        px-3 py-1.5 rounded-full
                        font-dm-sans text-xs font-medium
                        border transition-all duration-150
                        ${field.value === opt.value
                          ? 'bg-white border-roamly-g4 text-roamly-g1 shadow-sm'
                          : 'bg-transparent border-roamly-g5 text-roamly-text/50'
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

          {(sottotipo === 'aereo' || sottotipo === 'treno' || sottotipo === 'bus') && (
            <Input
              label={labelNumero(sottotipo)}
              placeholder={sottotipo === 'aereo' ? 'Es. AZ1234' : 'Es. FR9807'}
              {...register('numero')}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Da" placeholder="Milano" {...register('da')} />
            <Input label="A" placeholder="Barcellona" {...register('a')} />
          </div>

          <Input type="time" label="Orario" {...register('orario')} />
        </div>
      )}

      {/* ── Blocco dinamico: Alloggio ── */}
      {tipo === 'alloggio' && (
        <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
          <Input type="date" label="Check-out" {...register('checkout')} />
          <Input label="Numero di conferma" placeholder="Es. HTL-882910" {...register('numero_conferma')} />
        </div>
      )}

      {/* ── Blocco dinamico: Musei / Eventi ── */}
      {(tipo === 'museo' || tipo === 'evento') && (
        <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
          <div className="grid grid-cols-2 gap-4">
            <Input type="time" label="Orario" {...register('orario')} />
            <Input type="number" inputMode="numeric" label="N. biglietti" placeholder="1" {...register('numero_biglietti')} />
          </div>
        </div>
      )}

      {/* ── Blocco dinamico: Food ── */}
      {tipo === 'food' && (
        <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
          <div className="grid grid-cols-2 gap-4">
            <Input type="time" label="Orario" {...register('orario')} />
            <Input type="number" inputMode="numeric" label="N. persone" placeholder="2" {...register('numero_persone')} />
          </div>
        </div>
      )}

      {/* ── Blocco dinamico: Visti ── */}
      {tipo === 'visto' && (
        <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
          <Input label="Numero pratica" placeholder="Es. VS-2026-00981" {...register('numero_pratica')} />
          <Input type="date" label="Scadenza validità" {...register('scadenza')} />
        </div>
      )}

      {/* Data + Prezzo — sempre presenti */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label={labelData(tipo)}
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
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          placeholder="Altri dettagli utili..."
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
