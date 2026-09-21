import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TIPO_PRENOTAZIONE_OPTIONS } from '@/types'
import type { Prenotazione } from '@/types'

// ============================================================
// ROAMLY — PrenotazioneForm
// Wizard a 3 passi (stessa estetica del flusso "Booking" del
// mockup — header con contatore passo + barra di progresso,
// footer fisso con CTA), sugli STESSI campi e dati di prima:
// nessun nuovo modello, nessuno slot orario finto.
//
//   1. Cosa prenoti   → categoria, nome, dettagli per categoria
//   2. Quando e quanto → data, prezzo, stato, note
//   3. Rivedi e conferma → riepilogo di sola lettura + salva
//      (in modifica, anche l'eliminazione vive qui)
//
// Tutti i campi extra vivono in dettaglio (JSONB) — nessuna
// colonna dedicata, nessuna migrazione SQL necessaria.
//
// NOTA FUTURA: dettaglio.biglietto_path è un nome riservato per
// l'allegato foto biglietto (QR/barcode) — non ancora implementato
// lato UI, ma il modello dati non richiede modifiche per aggiungerlo.
// ============================================================

const SOTTOTIPI_TRASPORTO = ['aereo', 'treno', 'bus', 'auto', 'altro'] as const

const MEZZO_OPTIONS = [
  { value: 'aereo', label: 'Aereo' },
  { value: 'treno', label: 'Treno' },
  { value: 'bus',   label: 'Bus' },
  { value: 'auto',  label: 'Taxi/Uber' },
  { value: 'altro', label: 'Altro' },
] as const

const STATO_OPTIONS = [
  { value: 'confermato', label: 'Confermato' },
  { value: 'in_attesa',  label: 'In attesa' },
  { value: 'annullato',  label: 'Annullato' },
] as const

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

  // Eliminazione — solo in modalità edit, vissuta nel Passo 3
  isEdit?: boolean
  onDelete?: () => void
  isDeleting?: boolean
  deleteError?: string | null
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

function placeholderNome(
  tipo: PrenotazioneFormData['tipo'],
  sottotipo: string | undefined
): string {
  if (tipo === 'trasporto') {
    if (sottotipo === 'aereo') return 'Es. Volo Milano–Barcellona'
    if (sottotipo === 'treno') return 'Es. Treno Roma–Firenze'
    if (sottotipo === 'bus')   return 'Es. Bus Milano–Praga'
    if (sottotipo === 'auto')  return 'Es. Taxi aeroporto–hotel'
    return 'Es. Traghetto Napoli–Capri'
  }
  if (tipo === 'alloggio') return 'Es. Hotel Barcellona Centro'
  if (tipo === 'museo')    return 'Es. Museo del Prado'
  if (tipo === 'evento')   return 'Es. Concerto in piazza'
  if (tipo === 'food')     return 'Es. Cena da Can Culleretes'
  if (tipo === 'visto')    return 'Es. Visto turistico USA'
  return 'Es. Noleggio bici'
}

// Righe del riepilogo (Passo 3) — solo i campi effettivamente
// valorizzati, stesso principio del salvataggio in dettaglio.
function buildRiepilogo(v: PrenotazioneFormData): { k: string; v: string }[] {
  const righe: { k: string; v: string }[] = []

  righe.push({ k: 'Categoria', v: TIPO_PRENOTAZIONE_OPTIONS.find((o) => o.value === v.tipo)?.label ?? v.tipo })
  righe.push({ k: 'Nome', v: v.nome || '—' })

  if (v.tipo === 'trasporto') {
    const mezzo = MEZZO_OPTIONS.find((o) => o.value === v.sottotipo)?.label
    if (mezzo) righe.push({ k: 'Mezzo', v: mezzo })
    if (v.numero) righe.push({ k: labelNumero(v.sottotipo), v: v.numero })
    if (v.da || v.a) righe.push({ k: 'Percorso', v: `${v.da || '?'} → ${v.a || '?'}` })
    if (v.orario) righe.push({ k: 'Orario', v: v.orario })
  }
  if (v.tipo === 'alloggio') {
    if (v.checkout) righe.push({ k: 'Check-out', v: v.checkout })
    if (v.numero_conferma) righe.push({ k: 'Numero di conferma', v: v.numero_conferma })
  }
  if (v.tipo === 'museo' || v.tipo === 'evento') {
    if (v.orario) righe.push({ k: 'Orario', v: v.orario })
    if (v.numero_biglietti) righe.push({ k: 'Biglietti', v: v.numero_biglietti })
  }
  if (v.tipo === 'food') {
    if (v.orario) righe.push({ k: 'Orario', v: v.orario })
    if (v.numero_persone) righe.push({ k: 'Persone', v: v.numero_persone })
  }
  if (v.tipo === 'visto') {
    if (v.numero_pratica) righe.push({ k: 'Numero pratica', v: v.numero_pratica })
    if (v.scadenza) righe.push({ k: 'Scadenza', v: v.scadenza })
  }

  if (v.data) righe.push({ k: labelData(v.tipo), v: v.data })
  if (v.prezzo) righe.push({ k: 'Prezzo', v: `€ ${v.prezzo}` })
  righe.push({ k: 'Stato', v: STATO_OPTIONS.find((o) => o.value === v.stato)?.label ?? v.stato })
  if (v.note) righe.push({ k: 'Note', v: v.note })

  return righe
}

export function PrenotazioneForm({
  prenotazione,
  tipoIniziale,
  onSubmit,
  isLoading,
  error,
  submitLabel = 'Salva',
  isEdit = false,
  onDelete,
  isDeleting = false,
  deleteError,
}: PrenotazioneFormProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    trigger,
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
  const valoriCorrenti = useWatch({ control })

  const titoloPasso = step === 1 ? 'Cosa prenoti?' : step === 2 ? 'Quando e quanto' : (isEdit ? 'Rivedi le modifiche' : 'Rivedi e conferma')

  async function handleAvanti() {
    if (step === 1) {
      const ok = await trigger(['nome'])
      if (!ok) return
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  function handleIndietro() {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2)
    } else {
      navigate(-1)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-screen overflow-hidden">

      {/* Header fisso — back, contatore passo, titolo */}
      <div className="flex-none px-5 pt-14 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleIndietro}
          aria-label="Indietro"
          className="
            shrink-0 w-9 h-9 rounded-full
            flex items-center justify-center
            bg-roamly-g7 text-roamly-g1
            hover:bg-roamly-g6
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
          "
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-dm-mono text-[9px] uppercase tracking-widest text-roamly-text/30">
            Passo {step} di 3
          </p>
          <h1 className="font-lora text-[19px] font-semibold text-roamly-g0 mt-0.5 truncate">
            {titoloPasso}
          </h1>
        </div>
      </div>

      {/* Barra di progresso */}
      <div className="flex-none px-5 pb-3.5 flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`flex-1 h-1 rounded-full transition-colors duration-200 ${n <= step ? 'bg-roamly-g3' : 'bg-roamly-g6'}`}
          />
        ))}
      </div>

      {error && (
        <div className="flex-none mx-5 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-dm-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Contenuto scrollabile del passo corrente */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">

        {/* ── Passo 1 — Categoria, nome, dettagli per categoria ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
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

            <Input
              label="Nome"
              placeholder={placeholderNome(tipo, sottotipo)}
              error={errors.nome?.message}
              {...register('nome')}
            />

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
                        {MEZZO_OPTIONS.map((opt) => (
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

            {tipo === 'alloggio' && (
              <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
                <Input type="date" label="Check-out" {...register('checkout')} />
                <Input label="Numero di conferma" placeholder="Es. HTL-882910" {...register('numero_conferma')} />
              </div>
            )}

            {(tipo === 'museo' || tipo === 'evento') && (
              <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" label="Orario" {...register('orario')} />
                  <Input type="number" inputMode="numeric" label="N. biglietti" placeholder="1" {...register('numero_biglietti')} />
                </div>
              </div>
            )}

            {tipo === 'food' && (
              <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" label="Orario" {...register('orario')} />
                  <Input type="number" inputMode="numeric" label="N. persone" placeholder="2" {...register('numero_persone')} />
                </div>
              </div>
            )}

            {tipo === 'visto' && (
              <div className="flex flex-col gap-4 p-4 bg-roamly-g7 rounded-2xl">
                <Input label="Numero pratica" placeholder="Es. VS-2026-00981" {...register('numero_pratica')} />
                <Input type="date" label="Scadenza validità" {...register('scadenza')} />
              </div>
            )}
          </div>
        )}

        {/* ── Passo 2 — Data, prezzo, stato, note ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
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

            <div className="flex flex-col gap-2">
              <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
                Stato
              </label>
              <Controller
                name="stato"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {STATO_OPTIONS.map((opt) => (
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
          </div>
        )}

        {/* ── Passo 3 — Riepilogo di sola lettura + conferma ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="bg-white rounded-2xl shadow-roamly px-4">
              {buildRiepilogo(valoriCorrenti as PrenotazioneFormData).map((r, i) => (
                <div
                  key={r.k}
                  className={`flex justify-between gap-3 py-3 ${i > 0 ? 'border-t border-roamly-text/[0.06]' : ''}`}
                >
                  <span className="font-dm-sans text-xs text-roamly-text/45 shrink-0">{r.k}</span>
                  <span className="font-dm-sans text-xs font-medium text-roamly-g0 text-right">{r.v}</span>
                </div>
              ))}
            </div>

            {isEdit && (
              <div>
                {deleteError && (
                  <p className="font-dm-sans text-sm text-red-500 mb-3 text-center">
                    {deleteError}
                  </p>
                )}
                {!showDeleteConfirm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500/70 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Elimina prenotazione
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
                    <p className="font-dm-sans text-sm font-medium text-red-600">
                      Eliminare questa prenotazione? L'azione non può essere annullata.
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                        disabled={isDeleting}
                      >
                        Annulla
                      </Button>
                      <Button
                        type="button"
                        onClick={onDelete}
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
        )}

      </div>

      {/* Footer fisso — CTA del passo corrente */}
      <div className="
        flex-none px-5 pt-3 pb-8
        bg-roamly-bg/95 backdrop-blur-sm
        border-t border-roamly-text/[0.06]
      ">
        {step < 3 ? (
          <Button type="button" fullWidth onClick={handleAvanti}>
            Continua
          </Button>
        ) : (
          <Button type="submit" fullWidth isLoading={isLoading}>
            {submitLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
