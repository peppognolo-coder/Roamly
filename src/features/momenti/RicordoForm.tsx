import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LuogoSearchInput } from '@/components/ui/LuogoSearchInput'
import { MoodPicker } from './MoodPicker'
import { SpotifyTrackPicker } from '@/components/ui/SpotifyTrackPicker'
import { MeteoPicker, ConChiPicker, DomandeRicordo, PosizioneButton } from './ContestoRicordo'
import { useMembriViaggio } from '@/hooks/useMembri'
import { useAuth } from '@/hooks/useAuth'
import { getMeteoGiorno } from '@/lib/meteo'
import { nomeDaCoordinate } from '@/lib/geocoding'
import { MOOD_OPTIONS, METEO_OPTIONS } from '@/types'
import type { Mood, Meteo, Ricordo, SpotifyTrackSelezionato } from '@/types'
import type { BiasGeocoding } from '@/lib/geocoding'

// ============================================================
// ROAMLY — RicordoForm
// Ordine canonico campi (Master Prompt):
//   1. Mood (obbligatorio)
//   2. Titolo (obbligatorio)
//   3. Descrizione (opzionale)
//   4. Luogo (opzionale)
//   5. Data (default: oggi in timezone locale)
//   6. Preferito (toggle)
//   7. Colonna sonora (opzionale, brano Spotify — aggiunta dopo
//      il Master Prompt, in coda per non alterare l'ordine sopra)
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
    MOOD_OPTIONS.map((m) => m.value) as [Mood, ...Mood[]],
    { errorMap: () => ({ message: 'Seleziona come ti senti' }) }
  ),
  emozioneTesto: z
    .string()
    .max(300, 'Massimo 300 caratteri')
    .optional()
    .or(z.literal('')),
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
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  data: z.string().min(1, 'La data è obbligatoria'),
  preferito: z.boolean(),
  spotifyTrack: z
    .object({
      id: z.string(),
      nome: z.string(),
      artista: z.string(),
      immagineUrl: z.string().nullable(),
    })
    .nullable(),
  meteo: z
    .enum(METEO_OPTIONS.map((m) => m.value) as [Meteo, ...Meteo[]])
    .nullable(),
  temperatura: z.number().int().min(-60).max(60).nullable(),
  conChi: z.array(z.string().min(1).max(40)).max(12),
  risposte: z
    .array(z.object({ domanda: z.string().max(80), risposta: z.string().max(600) }))
    .max(8),
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
  /** Contenuto extra inserito subito dopo il mood e prima del Titolo
   *  (es. la griglia foto in NuovoRicordoPage) — tiene l'ordine dei
   *  campi identico al mockup senza spostare la gestione dei file
   *  fuori dal componente che li possiede. */
  beforeTitolo?: React.ReactNode
  /** Nasconde il bottone di submit interno — usato quando la pagina
   *  chiamante mostra un proprio bottone fisso in fondo, collegato
   *  via l'attributo HTML `form`. */
  hideSubmitButton?: boolean
  /** id dell'elemento <form>, da passare al bottone esterno quando
   *  hideSubmitButton è true. */
  formId?: string
  /** Dà priorità ai risultati di ricerca luogo vicini alla
   *  destinazione del viaggio, invece di una ricerca puramente
   *  globale — vedi LuogoSearchInput. */
  bias?: BiasGeocoding
  /** Viaggio del ricordo — serve per proporre i compagni in "Con chi eri". */
  viaggioId?: string
  /** Data pre-compilata in creazione (es. dalla Pagina del giorno). */
  dataIniziale?: string
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
  beforeTitolo,
  hideSubmitButton = false,
  formId = 'ricordo-form',
  bias,
  viaggioId,
  dataIniziale,
}: RicordoFormProps) {
  const isEdit = !!ricordo
  const label = submitLabel ?? (isEdit ? 'Salva modifiche' : 'Salva ricordo')

  // In modalità create (nessun ricordo), mood è undefined — Zod lo valida al submit.
  // In modalità edit, mood è sempre valorizzato dal ricordo esistente.
  // Non si usa cast insicuro: il tipo del valore di `values` è
  // `RicordoFormData | Partial<RicordoFormData>` per React Hook Form.
  const initialValues = {
    mood:          ricordo?.mood,
    emozioneTesto: ricordo?.emozione_testo ?? '',
    titolo:    ricordo?.titolo    ?? '',
    testo:     ricordo?.testo     ?? '',
    luogo:     ricordo?.luogo     ?? '',
    lat:       ricordo?.lat       ?? null,
    lng:       ricordo?.lng       ?? null,
    data:      ricordo?.data      ?? dataIniziale ?? oggi(),
    preferito: ricordo?.preferito ?? false,
    spotifyTrack: ricordo?.spotify_track_id
      ? {
          id:          ricordo.spotify_track_id,
          nome:        ricordo.spotify_track_nome ?? '',
          artista:     ricordo.spotify_track_artista ?? '',
          immagineUrl: ricordo.spotify_track_immagine_url,
        } satisfies SpotifyTrackSelezionato
      : null,
    meteo:       ricordo?.meteo ?? null,
    temperatura: ricordo?.temperatura ?? null,
    conChi:      ricordo?.con_chi ?? [],
    risposte:    ricordo?.risposte ?? [],
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

  // ── Contesto: meteo, posizione, compagni ────────────────────
  const dataValue = watch('data')
  const latValue  = watch('lat')
  const lngValue  = watch('lng')
  const meteoValue = watch('meteo')
  const temperaturaValue = watch('temperatura')
  const conChiValue = watch('conChi') ?? []
  const risposteValue = watch('risposte') ?? []

  // Se l'utente ha scelto il meteo a mano (o il ricordo già ce l'ha)
  // non lo sovrascriviamo più col suggerimento automatico.
  const meteoManuale = useRef(!!ricordo?.meteo)
  const [meteoCaricamento, setMeteoCaricamento] = useState(false)
  const [meteoSuggerito, setMeteoSuggerito] = useState(false)

  // Punto per il meteo: il luogo del ricordo, altrimenti la destinazione del viaggio
  const meteoLat = latValue ?? bias?.lat ?? null
  const meteoLng = lngValue ?? bias?.lng ?? null

  useEffect(() => {
    if (meteoManuale.current || !dataValue || meteoLat == null || meteoLng == null) return
    const ctrl = new AbortController()
    setMeteoCaricamento(true)
    getMeteoGiorno(dataValue, meteoLat, meteoLng, ctrl.signal)
      .then((m) => {
        if (!m || meteoManuale.current) return
        setValue('meteo', m.meteo)
        setValue('temperatura', m.temperatura)
        setMeteoSuggerito(true)
      })
      .catch(() => { /* offline o servizio giù: il campo resta vuoto */ })
      .finally(() => { if (!ctrl.signal.aborted) setMeteoCaricamento(false) })
    return () => ctrl.abort()
  }, [dataValue, meteoLat, meteoLng, setValue])

  const { user } = useAuth()
  const { data: membri } = useMembriViaggio(viaggioId ?? ricordo?.viaggio_id)
  const compagni = (membri ?? [])
    .filter((m) => m.user_id !== user?.id)
    .map((m) => m.display_name?.trim())
    .filter((n): n is string => !!n)

  const [posCaricamento, setPosCaricamento] = useState(false)
  const [posErrore, setPosErrore] = useState<string | null>(null)

  function usaPosizione() {
    if (!('geolocation' in navigator)) {
      setPosErrore('Il dispositivo non supporta la posizione.')
      return
    }
    setPosErrore(null)
    setPosCaricamento(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setValue('lat', latitude)
        setValue('lng', longitude)
        try {
          const nome = await nomeDaCoordinate(latitude, longitude)
          setValue('luogo', (nome ?? 'Posizione attuale').slice(0, 80), { shouldDirty: true })
        } catch {
          setValue('luogo', 'Posizione attuale', { shouldDirty: true })
        }
        setPosCaricamento(false)
      },
      () => {
        setPosCaricamento(false)
        setPosErrore('Non riesco a leggere la posizione. Controlla i permessi o cercala a mano.')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    )
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
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

      {/* Emozione a mano — libera, in aggiunta al mood guidato sopra */}
      <div className="flex flex-col gap-1.5">
        <label className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70">
          Come ti senti, con parole tue <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </label>
        <input
          type="text"
          placeholder="Agrodolce, felice ma già con la nostalgia del rientro..."
          autoComplete="off"
          maxLength={300}
          className="
            h-[46px] px-4
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl
            font-dm-sans text-sm text-roamly-text
            placeholder:text-roamly-text/30
            transition-all duration-150
            outline-none
            focus:border-roamly-g3 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
          "
          {...register('emozioneTesto')}
        />
        {errors.emozioneTesto && (
          <p className="text-xs font-dm-sans text-red-500">{errors.emozioneTesto.message}</p>
        )}
      </div>

      {beforeTitolo}

      {/* 2. Titolo */}
      <div className="flex flex-col gap-1.5">
        <label className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70">
          Titolo <span className="text-roamly-coral">*</span>
        </label>
        <input
          type="text"
          placeholder="Un momento da ricordare..."
          autoComplete="off"
          className="
            h-[46px] px-4
            bg-white border border-roamly-g5
            rounded-2xl
            font-dm-sans text-sm text-roamly-text
            placeholder:text-roamly-text/30
            transition-all duration-150
            outline-none
            focus:border-roamly-g3 focus:ring-2 focus:ring-roamly-g3/20
            disabled:opacity-50
            ${errors.titolo ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
          "
          {...register('titolo')}
        />
        {errors.titolo && (
          <p className="text-xs font-dm-sans text-red-500">{errors.titolo.message}</p>
        )}
      </div>

      {/* 3. Descrizione */}
      <div className="flex flex-col gap-1.5">
        <label className="font-dm-sans text-[12.5px] font-medium text-roamly-text/70">
          Racconta <span className="text-roamly-text/35 font-normal">(come ti pare)</span>
        </label>
        <textarea
          placeholder="Siamo saliti in tre, ce n'erano venti…"
          rows={5}
          id={`${formId}-testo`}
          className="
            w-full px-4 py-3.5
            bg-roamly-g7 border border-roamly-g5
            rounded-2xl
            font-dm-sans text-sm leading-relaxed text-roamly-text
            placeholder:text-roamly-text/30
            resize-none
            transition-all duration-150
            outline-none
            focus:border-roamly-g3 focus:bg-white focus:ring-2 focus:ring-roamly-g3/20
          "
          {...register('testo')}
        />
        {errors.testo && (
          <p className="text-xs font-dm-sans text-red-500">{errors.testo.message}</p>
        )}
      </div>

      <DomandeRicordo
        value={risposteValue}
        onChange={(v) => setValue('risposte', v, { shouldDirty: true })}
      />

      {/* 4. Luogo */}
      <Controller
        name="luogo"
        control={control}
        render={({ field }) => (
          <LuogoSearchInput
            label="Dove"
            placeholder="Dove eri?"
            value={field.value ?? ''}
            onChangeValue={field.onChange}
            onSelectLuogo={(luogo) => {
              setValue('luogo', luogo.label)
              setValue('lat', luogo.lat)
              setValue('lng', luogo.lng)
            }}
            error={errors.luogo?.message}
            bias={bias}
          />
        )}
      />
      <PosizioneButton onClick={usaPosizione} caricamento={posCaricamento} errore={posErrore} />

      {/* 5. Data */}
      <Input
        label="Data"
        type="date"
        error={errors.data?.message}
        {...register('data')}
      />

      {/* Contesto della giornata */}
      <MeteoPicker
        meteo={meteoValue}
        temperatura={temperaturaValue}
        caricamento={meteoCaricamento}
        suggerito={meteoSuggerito}
        onMeteo={(m) => {
          meteoManuale.current = true
          setMeteoSuggerito(false)
          setValue('meteo', m)
          if (!m) setValue('temperatura', null)
        }}
        onTemperatura={(t) => { meteoManuale.current = true; setValue('temperatura', t) }}
      />
      <ConChiPicker
        value={conChiValue}
        suggeriti={compagni}
        onChange={(v) => setValue('conChi', v, { shouldDirty: true })}
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
          className={preferitoValue ? 'fill-roamly-coral-dark text-roamly-coral-dark' : 'text-roamly-text/40'}
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

      {/* 7. Colonna sonora */}
      <Controller
        name="spotifyTrack"
        control={control}
        render={({ field }) => (
          <SpotifyTrackPicker
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {!hideSubmitButton && (
        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          size="lg"
        >
          {label}
        </Button>
      )}
    </form>
  )
}
