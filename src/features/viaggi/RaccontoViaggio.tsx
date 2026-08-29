import { useMemo }           from 'react'
import { useNavigate }       from 'react-router-dom'
import { motion }            from 'framer-motion'
import { buildRacconto }     from '@/lib/racconto-utils'
import { formatDataViaggio } from '@/lib/viaggi-utils'
import { MOOD_OPTIONS }      from '@/types'
import type { ViaggioConStato, Ricordo } from '@/types'
import type { RicordoRacconto, CapitoloRacconto } from '@/lib/racconto-utils'

// ============================================================
// RaccontoViaggio — esperienza editoriale immersiva
//
// Layout full-bleed, mobile-first.
// Struttura:
//   Copertina    — 100dvh, foto protagonista, indicatore scroll
//   Separatori   — data centrata con numero capitolo watermark
//   Blocco foto  — full-bleed, titolo sovrapposto, testo sotto
//   Blocco testo — per ricordi senza foto (gradiente mood)
//   Speciale     — dimensioni aumentate, badge ambra
//   Striscia     — max 3 foto secondarie scrollabili
//
// Zero query aggiuntive. Tutti i dati da props (già in cache).
// ============================================================

// ── Gradienti mood per blocchi senza foto ─────────────────────
const MOOD_GRADIENT_LIGHT: Record<string, string> = {
  felice:       'from-amber-50   to-yellow-50',
  meravigliato: 'from-pink-50    to-rose-50',
  sereno:       'from-roamly-g7  to-roamly-g6',
  entusiasta:   'from-orange-50  to-amber-50',
  ispirato:     'from-violet-50  to-purple-50',
}

// ── Props ─────────────────────────────────────────────────────
interface RaccontoViaggioProps {
  viaggioId:    string
  viaggio:      ViaggioConStato
  ricordi:      Ricordo[]
  coversMap?:   Map<string, string>
  fotoCount?:   Map<string, number>
  coverViaggio?: string | null
  numRicordi:   number
  isLoading:    boolean
}

// ============================================================
// Copertina — 100dvh, full-bleed, indicatore scroll
// ============================================================

function Copertina({
  viaggio,
  coverUrl,
  numRicordi,
  numFoto,
  durataGiorni,
}: {
  viaggio:       ViaggioConStato
  coverUrl?:     string | null
  numRicordi:    number
  numFoto:       number
  durataGiorni:  number | null
}) {
  const emoji   = viaggio.cover_emoji ?? '✈️'
  const dataStr = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)

  return (
    <div
      className="relative w-full bg-roamly-g0 overflow-hidden flex flex-col"
      style={{ height: '100dvh' }}
    >
      {/* Foto full-screen */}
      {coverUrl ? (
        <>
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Doppio gradiente: top per leggibilità header, bottom per testo */}
          <div className="absolute inset-0 bg-gradient-to-b
            from-black/50 via-black/10 to-black/80" />
        </>
      ) : (
        /* Fallback: gradiente brand con emoji centrata */
        <div className="absolute inset-0 bg-gradient-to-br from-roamly-g0 to-roamly-g1
          flex items-center justify-center">
          <span className="text-[120px] leading-none opacity-20 select-none">{emoji}</span>
        </div>
      )}

      {/* Contenuto posizionato */}
      <div className="relative z-10 flex flex-col h-full px-6">

        {/* Emoji in alto — ancorata al top */}
        <div className="pt-16 pb-0">
          <span className="text-4xl leading-none">{emoji}</span>
        </div>

        {/* Testo principale — ancorato in basso */}
        <div className="mt-auto pb-16 flex flex-col gap-4">

          {/* Meta — luogo */}
          {(viaggio.destinazione || viaggio.paese) && (
            <p className="font-dm-sans text-sm text-white/65
              flex items-center gap-1.5 font-medium tracking-wide">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {[viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Titolo viaggio */}
          <h1 className="font-lora text-display text-white
            [text-shadow:0_2px_16px_rgba(0,0,0,0.4)]">
            {viaggio.nome}
          </h1>

          {/* Date */}
          <p className="font-dm-sans text-sm text-white/55 font-medium">
            {dataStr}
          </p>

          {/* Statistiche */}
          <div className="flex gap-7 pt-4 border-t border-white/15">
            {([
              { val: durataGiorni ?? '—', label: durataGiorni === 1 ? 'giorno' : 'giorni' },
              { val: numRicordi,           label: numRicordi === 1 ? 'ricordo' : 'ricordi' },
              { val: numFoto,              label: 'foto' },
            ] as const).map(({ val, label }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="font-dm-mono text-2xl font-bold text-white leading-none">
                  {val}
                </span>
                <span className="font-dm-sans text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Indicatore scroll — bounce animato */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10
          flex flex-col items-center gap-1"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-px h-8 bg-white/40 rounded-full" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-50">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </div>
  )
}

// ============================================================
// SeparatoreGiorno — numero capitolo watermark + data
// ============================================================

function SeparatoreGiorno({
  capitolo,
}: {
  capitolo: CapitoloRacconto
}) {
  return (
    <div className="relative flex items-center justify-center py-10 overflow-hidden select-none">
      {/* Numero capitolo watermark */}
      <span
        className="absolute font-dm-mono font-bold text-roamly-g0 pointer-events-none"
        style={{ fontSize: '7rem', opacity: 0.06, lineHeight: 1 }}
        aria-hidden="true"
      >
        {capitolo.numeroCapitolo.toString().padStart(2, '0')}
      </span>

      {/* Linee + data centrata */}
      <div className="relative z-10 flex items-center gap-4 w-full px-6">
        <div className="flex-1 h-px bg-roamly-g6" />
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <span className="font-dm-mono text-[10px] text-roamly-text/30
            uppercase tracking-widest">
            {capitolo.numeroCapitolo.toString().padStart(2, '0')}
          </span>
          <span className="font-dm-sans text-sm font-medium text-roamly-text/60">
            {capitolo.dataFormattata}
          </span>
        </div>
        <div className="flex-1 h-px bg-roamly-g6" />
      </div>
    </div>
  )
}

// ============================================================
// BloccoFoto — foto protagonista full-bleed + titolo sovrapposto
// ============================================================

function BloccoFoto({
  rr,
  isSpeciale,
  navigate,
}: {
  rr:         RicordoRacconto
  isSpeciale: boolean
  navigate:   ReturnType<typeof useNavigate>
}) {
  const moodOpt = MOOD_OPTIONS.find((m) => m.value === rr.ricordo.mood)
  // Altezza: 65dvh per standard, 72dvh per momenti speciali
  const altezza = isSpeciale ? '72dvh' : '62dvh'

  return (
    <div className="flex flex-col gap-0">

      {/* ── Foto hero ── */}
      <button
        onClick={() => navigate(`/ricordi/${rr.ricordo.id}`)}
        className="relative w-full overflow-hidden block focus:outline-none"
        style={{ height: altezza }}
      >
        <img
          src={rr.coverUrl!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Gradiente scuro in basso per leggibilità testo */}
        <div className="absolute inset-0 bg-gradient-to-t
          from-black/75 via-black/20 to-transparent" />

        {/* Badge momento speciale */}
        {isSpeciale && (
          <div className="absolute top-4 left-4
            flex items-center gap-1.5 px-3 py-1.5
            bg-amber-400/90 backdrop-blur-sm rounded-full">
            <span className="text-xs leading-none">✨</span>
            <span className="font-dm-sans text-xs font-semibold text-white">
              Momento speciale
            </span>
          </div>
        )}

        {/* Testo sovrapposto in basso */}
        <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1.5">
          {rr.ricordo.luogo && (
            <p className="font-dm-sans text-xs text-white/65
              flex items-center gap-1 font-medium uppercase tracking-wider">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {rr.ricordo.luogo}
            </p>
          )}
          <h2
            className="font-lora font-semibold text-white leading-snug
              [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
            style={{ fontSize: isSpeciale ? '1.6rem' : '1.375rem' }}
          >
            {rr.ricordo.titolo}
          </h2>
        </div>
      </button>

      {/* ── Corpo testuale — solo se presente ── */}
      {rr.ricordo.testo && (
        <div className="px-6 pt-5 pb-2">
          <p className="font-dm-sans text-base text-roamly-text/80 leading-[1.75]">
            {rr.ricordo.testo}
          </p>
        </div>
      )}

      {/* ── Mood badge ── */}
      {moodOpt && (
        <div className="px-6 pt-3 pb-2">
          <span className="inline-flex items-center gap-1.5
            font-dm-sans text-xs text-roamly-text/45 font-medium">
            <span className="text-sm">{moodOpt.emoji}</span>
            {moodOpt.label}
          </span>
        </div>
      )}

      {/* ── Striscia foto secondarie (max 3) ── */}
      {rr.fotoCount > 1 && (
        <div className="pt-3 pb-5">
          {/* Le foto secondarie vengono caricate dall'hook — qui usiamo un
              placeholder con il count. La striscia reale richiede useFotoRicordo
              che è lazy-mounted solo nel dettaglio ricordo.
              Mostriamo il link al dettaglio per le foto aggiuntive. */}
          <button
            onClick={() => navigate(`/ricordi/${rr.ricordo.id}`)}
            className="mx-6 flex items-center gap-2
              font-dm-sans text-xs text-roamly-g2 font-medium"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {rr.fotoCount - 1} {rr.fotoCount === 2 ? 'altra foto' : 'altre foto'} →
          </button>
        </div>
      )}

    </div>
  )
}

// ============================================================
// BloccoTesto — ricordo senza foto (gradiente mood)
// ============================================================

function BloccoTesto({
  rr,
  isSpeciale,
  navigate,
}: {
  rr:         RicordoRacconto
  isSpeciale: boolean
  navigate:   ReturnType<typeof useNavigate>
}) {
  const moodOpt = MOOD_OPTIONS.find((m) => m.value === rr.ricordo.mood)
  const gradient = isSpeciale
    ? 'from-amber-400/20 to-yellow-300/10'
    : `${MOOD_GRADIENT_LIGHT[rr.ricordo.mood] ?? 'from-roamly-g7 to-roamly-g6'}`

  // Altezza ridotta senza foto — non cerca di riempire la viewport
  return (
    <button
      onClick={() => navigate(`/ricordi/${rr.ricordo.id}`)}
      className={`
        relative mx-4 rounded-3xl overflow-hidden
        bg-gradient-to-br
        ${gradient}
        ${isSpeciale ? 'border-2 border-amber-300 shadow-roamly-lg' : 'shadow-roamly'}
        text-left w-[calc(100%-32px)]
        focus:outline-none active:scale-[0.98] transition-transform duration-150
      `}
    >
      {/* Emoji mood come sfondo decorativo */}
      <div className="absolute top-4 right-5 text-6xl leading-none opacity-[0.12]
        select-none pointer-events-none">
        {moodOpt?.emoji}
      </div>

      {/* Badge speciale */}
      {isSpeciale && (
        <div className="flex items-center gap-1.5 px-5 pt-5 pb-0">
          <span className="text-sm">✨</span>
          <span className="font-dm-sans text-xs font-semibold text-amber-600
            uppercase tracking-wider">
            Momento speciale
          </span>
        </div>
      )}

      <div className="relative z-10 p-5 flex flex-col gap-3">
        {rr.ricordo.luogo && (
          <p className="font-dm-sans text-xs text-roamly-text/40
            flex items-center gap-1 font-medium uppercase tracking-wider">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {rr.ricordo.luogo}
          </p>
        )}

        <h2
          className="font-lora font-semibold text-roamly-g0 leading-snug"
          style={{ fontSize: isSpeciale ? '1.5rem' : '1.25rem' }}
        >
          {rr.ricordo.titolo}
        </h2>

        {rr.ricordo.testo && (
          <p className="font-dm-sans text-base text-roamly-text/70 leading-[1.75]">
            {rr.ricordo.testo}
          </p>
        )}

        {moodOpt && (
          <span className="inline-flex items-center gap-1.5
            font-dm-sans text-xs text-roamly-text/45 font-medium mt-1">
            <span className="text-sm">{moodOpt.emoji}</span>
            {moodOpt.label}
          </span>
        )}
      </div>
    </button>
  )
}

// ============================================================
// Capitolo — un giorno del viaggio
// ============================================================

function Capitolo({
  capitolo,
  navigate,
  delay,
}: {
  capitolo: CapitoloRacconto
  navigate: ReturnType<typeof useNavigate>
  delay:    number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="flex flex-col gap-8"
    >
      <SeparatoreGiorno capitolo={capitolo} />

      <div className="flex flex-col gap-10">
        {capitolo.ricordi.map((rr) => (
          <div key={rr.ricordo.id}>
            {rr.coverUrl ? (
              <BloccoFoto rr={rr} isSpeciale={rr.isSpeciale} navigate={navigate} />
            ) : (
              <BloccoTesto rr={rr} isSpeciale={rr.isSpeciale} navigate={navigate} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================================
// RaccontoViaggio — componente principale (esportato)
// ============================================================

export function RaccontoViaggio({
  viaggioId,
  viaggio,
  ricordi,
  coversMap,
  fotoCount,
  coverViaggio,
  numRicordi,
  isLoading,
}: RaccontoViaggioProps) {
  const navigate = useNavigate()

  const dati = useMemo(
    () => buildRacconto(viaggio, ricordi, coversMap, fotoCount),
    [viaggio, ricordi, coversMap, fotoCount]
  )

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-0">
        <div className="bg-roamly-g6 animate-pulse" style={{ height: '100dvh' }} />
        <div className="p-6 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-roamly-g6 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Empty state ──
  if (!dati.haContenuto) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-5 py-12 text-center
          bg-white rounded-3xl shadow-roamly mx-0"
      >
        <div className="w-16 h-16 rounded-2xl bg-roamly-g7 shadow-roamly
          flex items-center justify-center text-3xl">
          📖
        </div>
        <div className="flex flex-col gap-2 px-8 max-w-[280px]">
          <p className="font-lora text-lg font-semibold text-roamly-g0 leading-snug">
            Non ci sono ancora abbastanza ricordi per creare un racconto.
          </p>
          <p className="font-dm-sans text-sm text-roamly-text/50 leading-relaxed">
            Aggiungi qualche ricordo e torna qui per rileggere il tuo viaggio.
          </p>
        </div>
        <button
          onClick={() => navigate(`/nuovo-ricordo?viaggioId=${viaggioId}`)}
          className="px-5 py-2.5 bg-roamly-g0 rounded-xl
            font-dm-sans text-sm font-medium text-white
            hover:bg-roamly-g1 active:scale-[0.98] transition-all duration-150"
        >
          Aggiungi il primo ricordo
        </button>
      </motion.div>
    )
  }

  // ── Racconto completo ──
  // Il Racconto è fuori dal PageLayout padding per permettere
  // il full-bleed. Il componente usa margini negativi interni
  // tramite classi -mx-5 (corrispondente al px-5 di PageLayout).
  return (
    <div className="flex flex-col gap-0 -mx-5">

      {/* Copertina 100dvh */}
      <Copertina
        viaggio={viaggio}
        coverUrl={coverViaggio}
        numRicordi={numRicordi}
        numFoto={dati.totaleFoto}
        durataGiorni={dati.durataGiorni}
      />

      {/* Capitoli */}
      <div className="flex flex-col gap-0 pt-4 pb-16">
        {dati.capitoli.map((capitolo, i) => (
          <Capitolo
            key={capitolo.data}
            capitolo={capitolo}
            navigate={navigate}
            delay={i * 0.05}
          />
        ))}
      </div>

      {/* Colophon */}
      <div className="flex items-center justify-center pb-12 px-6">
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-roamly-g6" />
          <p className="font-dm-mono text-[10px] text-roamly-text/25
            tracking-widest uppercase shrink-0">
            Fine del racconto
          </p>
          <div className="flex-1 h-px bg-roamly-g6" />
        </div>
      </div>

    </div>
  )
}
