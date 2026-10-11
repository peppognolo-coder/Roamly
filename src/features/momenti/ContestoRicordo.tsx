import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sun, Cloud, CloudFog, CloudRain, CloudLightning, Snowflake, Wind, Plus, X, Loader2, LocateFixed, ChevronDown, Check } from 'lucide-react'
import { METEO_OPTIONS } from '@/types'
import type { Meteo, RispostaRicordo } from '@/types'
import { DOMANDE_RICORDO, MAX_RISPOSTE, MAX_CARATTERI_RISPOSTA } from '@/lib/risposte-ricordo'

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
// Domande — blocchi facoltativi "domanda → risposta".
// Ogni blocco: intestazione con la domanda (tocca per cambiarla,
// si apre un pannello con l'elenco) e sotto la casella di risposta.
// ------------------------------------------------------------

function PannelloDomande({ usate, corrente, onScegli, onClose }: {
  usate: Set<string>
  corrente: string
  onScegli: (d: string) => void
  onClose: () => void
}) {
  // Portal su body: gli antenati con transform (AnimatedPage) romperebbero `fixed`
  return createPortal(
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
      <motion.div key="panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center"
        role="dialog" aria-label="Scegli una domanda">
        <div className="w-full max-w-[430px] bg-roamly-bg rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-roamly-g5 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pt-2 pb-2">
            <h2 className="font-lora text-xl font-semibold text-roamly-g0">Scegli una domanda</h2>
            <button type="button" onClick={onClose} aria-label="Chiudi"
              className="w-9 h-9 rounded-full bg-roamly-g6 flex items-center justify-center text-roamly-g1">
              <X size={18} />
            </button>
          </div>
          <ul className="px-5 pb-8 flex flex-col gap-2"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
            {DOMANDE_RICORDO.map((d) => {
              const scelta = d === corrente
              const occupata = usate.has(d) && !scelta
              return (
                <li key={d}>
                  <button
                    type="button"
                    disabled={occupata}
                    onClick={() => onScegli(d)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-2xl border text-left
                      flex items-center justify-between gap-3
                      font-dm-sans text-sm transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                      ${scelta ? 'bg-roamly-g6 border-roamly-g3 text-roamly-g1 font-medium'
                        : occupata ? 'bg-roamly-g7 border-roamly-g6 text-roamly-text/30'
                        : 'bg-white border-roamly-g5 text-roamly-text active:bg-roamly-g6'}`}
                  >
                    {d}
                    {scelta && <Check size={16} />}
                    {occupata && <span className="text-[11px]">già usata</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export function DomandeRicordo({ value, onChange }: {
  value: RispostaRicordo[]
  onChange: (v: RispostaRicordo[]) => void
}) {
  // indice del blocco per cui è aperto il pannello (null = chiuso)
  const [aperto, setAperto] = useState<number | null>(null)
  const usate = new Set(value.map((v) => v.domanda).filter(Boolean))
  const disponibili = DOMANDE_RICORDO.some((d) => !usate.has(d))
  const puoAggiungere = value.length < MAX_RISPOSTE && disponibili

  const aggiorna = (i: number, patch: Partial<RispostaRicordo>) =>
    onChange(value.map((v, k) => (k === i ? { ...v, ...patch } : v)))

  const rimuovi = (i: number) => onChange(value.filter((_, k) => k !== i))

  const aggiungi = () => {
    onChange([...value, { domanda: '', risposta: '' }])
    setAperto(value.length)
  }

  const scegli = (i: number, domanda: string) => {
    aggiorna(i, { domanda })
    setAperto(null)
    setTimeout(() => document.getElementById(`domanda-risposta-${i}`)?.focus(), 320)
  }

  return (
    <div className="flex flex-col gap-3">
      <span className={labelClass}>
        Aiutati con delle domande <span className="text-roamly-text/35 font-normal">(opzionale)</span>
      </span>

      {value.map((v, i) => (
        <div key={i} className="bg-white border border-roamly-g5 rounded-2xl overflow-hidden">
          <div className="flex items-stretch">
            <button
              type="button"
              onClick={() => setAperto(i)}
              aria-label={v.domanda ? `Cambia domanda: ${v.domanda}` : 'Scegli una domanda'}
              className="flex-1 min-w-0 min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left
                focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-roamly-g3"
            >
              <span className={`font-dm-sans text-sm font-medium ${v.domanda ? 'text-roamly-g1' : 'text-roamly-muted'}`}>
                {v.domanda || 'Scegli una domanda'}
              </span>
              <ChevronDown size={16} className="shrink-0 text-roamly-g2" />
            </button>
            <button
              type="button"
              onClick={() => rimuovi(i)}
              aria-label="Togli questa domanda"
              className="w-12 flex items-center justify-center text-roamly-text/40 border-l border-roamly-g6
                focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-roamly-g3"
            >
              <X size={16} />
            </button>
          </div>

          {v.domanda && (
            <textarea
              id={`domanda-risposta-${i}`}
              value={v.risposta}
              onChange={(e) => aggiorna(i, { risposta: e.target.value })}
              maxLength={MAX_CARATTERI_RISPOSTA}
              rows={3}
              placeholder="Rispondi qui…"
              className="w-full px-4 py-3 bg-roamly-g7 border-t border-roamly-g6
                font-dm-sans text-sm leading-relaxed text-roamly-text
                placeholder:text-roamly-text/30 resize-none outline-none
                focus:bg-white"
            />
          )}
        </div>
      ))}

      {puoAggiungere && (
        <button
          type="button"
          onClick={aggiungi}
          className="self-start inline-flex items-center gap-1.5 h-10 px-4 rounded-full
            bg-roamly-g6 border border-roamly-g5 font-dm-sans text-sm font-medium text-roamly-g1
            active:scale-95 transition-transform
            focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3"
        >
          <Plus size={16} />
          {value.length === 0 ? 'Aggiungi una domanda' : 'Aggiungi un’altra domanda'}
        </button>
      )}

      {aperto !== null && value[aperto] && (
        <PannelloDomande
          usate={usate}
          corrente={value[aperto].domanda}
          onScegli={(d) => scegli(aperto, d)}
          onClose={() => setAperto(null)}
        />
      )}
    </div>
  )
}

// ------------------------------------------------------------
// Visualizzazione delle risposte (dettaglio, Racconto, pagina pubblica)
// ------------------------------------------------------------

export function RisposteRicordo({ risposte, className = '' }: {
  risposte: RispostaRicordo[] | null | undefined
  className?: string
}) {
  const lista = (risposte ?? []).filter((r) => r.domanda && r.risposta)
  if (lista.length === 0) return null
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {lista.map((r, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-wider text-roamly-g2">
            {r.domanda}
          </p>
          <p className="font-dm-sans text-base text-roamly-text/80 leading-[1.7] whitespace-pre-wrap">
            {r.risposta}
          </p>
        </div>
      ))}
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
