import { useState } from 'react'
import { Sun, Cloud, CloudFog, CloudRain, CloudLightning, Snowflake, Wind, Plus, X, Loader2, LocateFixed } from 'lucide-react'
import { METEO_OPTIONS } from '@/types'
import type { Meteo } from '@/types'

// ============================================================
// ROAMLY — Contesto del ricordo
// Pezzi del "Ricordo ricco": spunti di scrittura, meteo, con chi,
// pulsante posizione. Stile: chip g6/g5 + corallo solo per l'azione.
// ============================================================

export const METEO_ICONE: Record<Meteo, typeof Sun> = {
  sole: Sun,
  nuvoloso: Cloud,
  nebbia: CloudFog,
  pioggia: CloudRain,
  temporale: CloudLightning,
  neve: Snowflake,
  vento: Wind,
}

const labelClass = 'font-dm-sans text-[12.5px] font-medium text-roamly-text/70'

// ------------------------------------------------------------
// Spunti — frasi da cui partire; toccando si aggiunge la domanda
// al testo, l'utente risponde sotto.
// ------------------------------------------------------------

const SPUNTI = [
  'Cosa hai mangiato?',
  'Cosa ti ha sorpreso?',
  'Chi hai incontrato?',
  'Cosa non vuoi dimenticare?',
  'Cosa rifaresti?',
  'Un suono o un profumo di oggi',
]

export function SpuntiRicordo({ onScegli }: { onScegli: (spunto: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-dm-sans text-xs text-roamly-muted">Non sai da dove iniziare? Tocca uno spunto</span>
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-hide">
        {SPUNTI.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScegli(s)}
            className="flex-none h-8 px-3 rounded-full bg-roamly-g6 border border-roamly-g5
              font-dm-sans text-xs text-roamly-ink-soft whitespace-nowrap
              active:scale-95 transition-transform
              focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Meteo
// ------------------------------------------------------------

interface MeteoPickerProps {
  meteo: Meteo | null
  temperatura: number | null
  caricamento: boolean
  suggerito: boolean
  onMeteo: (m: Meteo | null) => void
  onTemperatura: (t: number | null) => void
}

export function MeteoPicker({ meteo, temperatura, caricamento, suggerito, onMeteo, onTemperatura }: MeteoPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={labelClass}>
          Che tempo faceva <span className="text-roamly-text/35 font-normal">(opzionale)</span>
        </span>
        {caricamento && <Loader2 size={14} className="animate-spin text-roamly-muted" aria-label="Cerco il meteo" />}
        {!caricamento && suggerito && meteo && (
          <span className="font-dm-sans text-[11px] text-roamly-muted">suggerito dal luogo e dalla data</span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-hide">
        {METEO_OPTIONS.map((o) => {
          const Icona = METEO_ICONE[o.value]
          const attivo = meteo === o.value
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={attivo}
              onClick={() => onMeteo(attivo ? null : o.value)}
              className={`flex-none flex flex-col items-center justify-center gap-1 w-[62px] h-[58px] rounded-2xl border
                font-dm-sans text-[11px] transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                ${attivo
                  ? 'bg-roamly-g6 border-roamly-g3 text-roamly-g1'
                  : 'bg-white border-roamly-g5 text-roamly-muted'}`}
            >
              <Icona size={20} strokeWidth={1.8} />
              {o.label}
            </button>
          )
        })}
      </div>

      {meteo && (
        <label className="flex items-center gap-2 self-start">
          <input
            type="number"
            inputMode="numeric"
            min={-60}
            max={60}
            value={temperatura ?? ''}
            onChange={(e) => {
              const v = e.target.value
              onTemperatura(v === '' ? null : Math.max(-60, Math.min(60, Math.round(Number(v)))))
            }}
            placeholder="—"
            aria-label="Temperatura in gradi"
            className="w-16 h-10 px-3 bg-white border border-roamly-g5 rounded-xl
              font-dm-mono text-sm text-roamly-text outline-none
              focus:border-roamly-g3 focus:ring-1 focus:ring-roamly-g3"
          />
          <span className="font-dm-sans text-sm text-roamly-muted">°C</span>
        </label>
      )}
    </div>
  )
}

// ------------------------------------------------------------
// Con chi
// ------------------------------------------------------------

interface ConChiPickerProps {
  value: string[]
  /** Nomi dei compagni di viaggio (esclusa la persona stessa) */
  suggeriti: string[]
  onChange: (v: string[]) => void
}

export function ConChiPicker({ value, suggeriti, onChange }: ConChiPickerProps) {
  const [bozza, setBozza] = useState('')

  const toggle = (nome: string) =>
    onChange(value.includes(nome) ? value.filter((n) => n !== nome) : [...value, nome])

  const aggiungi = () => {
    const nome = bozza.trim().slice(0, 40)
    setBozza('')
    if (!nome || value.some((n) => n.toLowerCase() === nome.toLowerCase()) || value.length >= 12) return
    onChange([...value, nome])
  }

  const extra = value.filter((n) => !suggeriti.includes(n))

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>
        Con chi eri <span className="text-roamly-text/35 font-normal">(opzionale)</span>
      </span>

      <div className="flex flex-wrap gap-2">
        {suggeriti.map((nome) => {
          const attivo = value.includes(nome)
          return (
            <button
              key={nome}
              type="button"
              aria-pressed={attivo}
              onClick={() => toggle(nome)}
              className={`h-9 px-3.5 rounded-full border font-dm-sans text-sm transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                ${attivo ? 'bg-roamly-g6 border-roamly-g3 text-roamly-g1' : 'bg-white border-roamly-g5 text-roamly-ink-soft'}`}
            >
              {nome}
            </button>
          )
        })}
        {extra.map((nome) => (
          <span key={nome} className="h-9 pl-3.5 pr-2 rounded-full border border-roamly-g3 bg-roamly-g6
            inline-flex items-center gap-1 font-dm-sans text-sm text-roamly-g1">
            {nome}
            <button type="button" onClick={() => toggle(nome)} aria-label={`Rimuovi ${nome}`}
              className="w-6 h-6 inline-flex items-center justify-center rounded-full">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); aggiungi() } }}
          placeholder="Aggiungi un nome (anche chi non è su Roamly)"
          maxLength={40}
          autoComplete="off"
          className="flex-1 h-10 px-3.5 bg-white border border-roamly-g5 rounded-xl font-dm-sans text-sm
            text-roamly-text placeholder:text-roamly-muted outline-none
            focus:border-roamly-g3 focus:ring-1 focus:ring-roamly-g3"
        />
        <button type="button" onClick={aggiungi} disabled={!bozza.trim()} aria-label="Aggiungi"
          className="w-10 h-10 rounded-xl bg-roamly-g6 border border-roamly-g5 text-roamly-g1
            inline-flex items-center justify-center disabled:opacity-40">
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Pulsante "Usa la mia posizione"
// ------------------------------------------------------------

export function PosizioneButton({ onClick, caricamento, errore }: {
  onClick: () => void; caricamento: boolean; errore: string | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={caricamento}
        className="self-start inline-flex items-center gap-1.5 h-9 px-3 rounded-full
          bg-roamly-g6 border border-roamly-g5 font-dm-sans text-xs font-medium text-roamly-g1
          disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
      >
        {caricamento ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
        Usa la mia posizione
      </button>
      {errore && <p className="text-xs font-dm-sans text-red-600">{errore}</p>}
    </div>
  )
}

// ------------------------------------------------------------
// Versione compatta per card e liste: icona meteo + gradi, compagni.
// Non renderizza nulla se il ricordo non ha contesto.
// ------------------------------------------------------------

export function ContestoInline({ ricordo, className = '' }: {
  ricordo: { meteo: Meteo | null; temperatura: number | null; con_chi: string[] }
  className?: string
}) {
  const Icona = ricordo.meteo ? METEO_ICONE[ricordo.meteo] : null
  const compagni = ricordo.con_chi ?? []
  if (!Icona && compagni.length === 0) return null

  return (
    <span className={`inline-flex items-center gap-2 font-dm-sans text-xs text-roamly-muted min-w-0 ${className}`}>
      {Icona && (
        <span className="inline-flex items-center gap-1 shrink-0">
          <Icona size={12} strokeWidth={1.9} />
          {ricordo.temperatura != null && <span className="font-dm-mono">{ricordo.temperatura}°</span>}
        </span>
      )}
      {compagni.length > 0 && <span className="truncate">con {compagni.join(', ')}</span>}
    </span>
  )
}

/** Testo semplice per le share card (niente icone): "Sole 24° · con Anna, Luca". */
export function testoContesto(ricordo: { meteo: Meteo | null; temperatura: number | null; con_chi: string[] }): string {
  const meteo = METEO_OPTIONS.find((m) => m.value === ricordo.meteo)?.label
  const parti = [
    meteo ? `${meteo}${ricordo.temperatura != null ? ` ${ricordo.temperatura}°` : ''}` : null,
    (ricordo.con_chi ?? []).length > 0 ? `con ${ricordo.con_chi.join(', ')}` : null,
  ].filter(Boolean)
  return parti.join(' · ')
}
