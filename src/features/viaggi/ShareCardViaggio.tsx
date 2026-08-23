import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion }  from 'framer-motion'
import { toPng }                   from 'html-to-image'
import { formatDataViaggio }        from '@/lib/viaggi-utils'
import { calcolaDurataViaggio }     from '@/lib/viaggi-utils'
import type { ViaggioConStato }     from '@/types'

// ============================================================
// ShareCardViaggio — genera e scarica una share card del viaggio
//
// Flusso:
//   1. Mostra modal con anteprima card (scalata al 35%)
//   2. Selector formato: Story 9:16 · Square 1:1
//   3. Export PNG via html-to-image sul DOM a dimensioni reali
//   4. Download automatico + pulsante Condividi (Web Share API)
//
// NOTA immagini crossorigin:
//   Le signed URL di Supabase non sono CORS-safe per canvas.
//   La cover viene pre-convertita in dataURL via fetch
//   prima di passarla alla card — html-to-image vede solo dati locali.
// ============================================================

interface ShareCardViaggioProps {
  viaggio:     ViaggioConStato
  coverUrl?:   string | null   // thumbnailSignedUrl da useCoverViaggio
  numRicordi:  number
  numFoto:     number
  onClose:     () => void
}

type Formato = 'story' | 'square'

// Dimensioni reali del PNG esportato
const DIMENSIONI: Record<Formato, { w: number; h: number }> = {
  story:  { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
}

// Scala dell'anteprima in-screen (la card reale è 1080px)
const SCALA_ANTEPRIMA = 0.28

// Converte URL remota in dataURL per html-to-image (bypass CORS canvas)
async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return new Promise((res) => {
      const reader = new FileReader()
      reader.onloadend = () => res(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ============================================================
// CardContent — il contenuto visivo della card (usato per anteprima e export)
// ============================================================

interface CardContentProps {
  viaggio:    ViaggioConStato
  coverData:  string | null      // dataURL della cover (o null)
  numRicordi: number
  numFoto:    number
  formato:    Formato
  // Dimensioni passate esplicitamente (anteprima vs export)
  width:      number
  height:     number
}

function CardContent({
  viaggio,
  coverData,
  numRicordi,
  numFoto,
  formato,
  width,
  height,
}: CardContentProps) {
  const durataGiorni = calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const dataStr      = formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const emoji        = viaggio.cover_emoji ?? '✈️'
  const isStory      = formato === 'story'

  // Font sizes scalati sulla larghezza reale (1080px base)
  const scale = width / 1080
  const fs = {
    tag:    Math.round(22 * scale),
    nome:   Math.round(isStory ? 72 * scale : 60 * scale),
    dest:   Math.round(36 * scale),
    date:   Math.round(28 * scale),
    stat:   Math.round(60 * scale),
    label:  Math.round(22 * scale),
    brand:  Math.round(24 * scale),
    emoji:  Math.round(isStory ? 140 * scale : 110 * scale),
  }
  const gap   = Math.round(20 * scale)
  const pad   = Math.round(60 * scale)
  const padSm = Math.round(40 * scale)
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#0C2A3D',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Background foto cover ── */}
      {coverData && (
        <>
          <img
            src={coverData}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
            }}
          />
          {/* Gradient overlay — più scuro ai bordi */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: isStory
              ? 'linear-gradient(to bottom, rgba(4,52,44,0.5) 0%, rgba(4,52,44,0.1) 35%, rgba(4,52,44,0.15) 65%, rgba(4,52,44,0.85) 100%)'
              : 'linear-gradient(135deg, rgba(4,52,44,0.6) 0%, rgba(4,52,44,0.2) 50%, rgba(4,52,44,0.7) 100%)',
          }} />
        </>
      )}

      {/* ── Contenuto ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: pad,
        gap,
      }}>

        {/* Header: tag Roamly */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: Math.round(10 * scale),
        }}>
          <div style={{
            width:  Math.round(36 * scale),
            height: Math.round(36 * scale),
            borderRadius: Math.round(8 * scale),
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(18 * scale),
          }}>
            📖
          </div>
          <span style={{
            fontSize: fs.brand,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}>
            Roamly
          </span>
        </div>

        {/* Spacer story */}
        {isStory && <div style={{ flex: 1 }} />}

        {/* Emoji/icona viaggio — solo se no cover */}
        {!coverData && (
          <div style={{
            fontSize: fs.emoji,
            lineHeight: 1,
            textAlign: isStory ? 'center' : 'left',
          }}>
            {emoji}
          </div>
        )}

        {/* Nome viaggio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(8 * scale) }}>
          <h1 style={{
            fontSize: fs.nome,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            margin: 0,
            fontFamily: "'Lora', Georgia, serif",
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            {viaggio.nome}
          </h1>

          {/* Destinazione */}
          {(viaggio.destinazione || viaggio.paese) && (
            <p style={{
              fontSize: fs.dest,
              color: 'rgba(255,255,255,0.8)',
              margin: 0,
              fontWeight: 400,
            }}>
              {[viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Date */}
          <p style={{
            fontSize: fs.date,
            color: 'rgba(255,255,255,0.6)',
            margin: 0,
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}>
            {dataStr}
          </p>
        </div>

        {/* Spacer */}
        {!isStory && <div style={{ flex: 1 }} />}

        {/* Statistiche */}
        <div style={{
          display: 'flex',
          gap: Math.round(isStory ? 48 * scale : 40 * scale),
          alignItems: 'flex-end',
          paddingTop: Math.round(24 * scale),
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          {[
            { valore: durataGiorni ?? '—', etichetta: durataGiorni === 1 ? 'giorno' : 'giorni' },
            { valore: numRicordi, etichetta: numRicordi === 1 ? 'ricordo' : 'ricordi' },
            { valore: numFoto, etichetta: numFoto === 1 ? 'foto' : 'foto' },
          ].map(({ valore, etichetta }) => (
            <div key={etichetta} style={{ display: 'flex', flexDirection: 'column', gap: Math.round(4 * scale) }}>
              <span style={{
                fontSize: fs.stat,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1,
                fontFamily: "'DM Mono', monospace",
              }}>
                {valore}
              </span>
              <span style={{
                fontSize: fs.label,
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 400,
                letterSpacing: '0.04em',
              }}>
                {etichetta}
              </span>
            </div>
          ))}
        </div>

        {/* Footer brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: padSm,
        }}>
          <span style={{
            fontSize: fs.brand,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            fontWeight: 500,
          }}>
            roamly.app
          </span>
          <span style={{ fontSize: fs.brand * 1.2, opacity: 0.4 }}>
            {emoji}
          </span>
        </div>

      </div>
    </div>
  )
}

// ============================================================
// ShareCardViaggio — modal principale
// ============================================================

export function ShareCardViaggio({
  viaggio,
  coverUrl,
  numRicordi,
  numFoto,
  onClose,
}: ShareCardViaggioProps) {
  const [formato, setFormato]         = useState<Formato>('story')
  const [coverData, setCoverData]     = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported]       = useState<string | null>(null)
  const exportRef                     = useRef<HTMLDivElement>(null)

  // Converte la cover in dataURL al mount / cambio URL
  useEffect(() => {
    if (!coverUrl) { setCoverData(null); return }
    urlToDataUrl(coverUrl).then(setCoverData)
  }, [coverUrl])

  const dim = DIMENSIONI[formato]

  // Export PNG — opera sul DOM a dimensioni reali (non scalate)
  const handleExport = useCallback(async () => {
    if (!exportRef.current || isExporting) return
    setIsExporting(true)

    try {
      // Forza il font Google Fonts nella card prima dell'export
      await document.fonts.ready

      const dataUrl = await toPng(exportRef.current, {
        width:  dim.w,
        height: dim.h,
        pixelRatio: 1,   // già a risoluzione piena
        // Esclude elementi non visibili (il ref è hidden off-screen)
        filter: (node) => node !== document.body,
      })

      setExported(dataUrl)

      // Download automatico
      const a = document.createElement('a')
      a.href     = dataUrl
      a.download = `roamly-${viaggio.nome.toLowerCase().replace(/\s+/g, '-')}-${formato}.png`
      a.click()
    } catch (err) {
      console.error('Export fallito:', err)
    } finally {
      setIsExporting(false)
    }
  }, [dim, formato, viaggio.nome, isExporting])

  // Web Share API — disponibile su mobile (iOS 15+, Android Chrome)
  const handleShare = useCallback(async () => {
    if (!exported) return
    try {
      const resp  = await fetch(exported)
      const blob  = await resp.blob()
      const file  = new File([blob], `roamly-${viaggio.nome}.png`, { type: 'image/png' })
      await navigator.share({ files: [file], title: viaggio.nome })
    } catch {
      // Fallback: riapre download
      const a = document.createElement('a')
      a.href     = exported
      a.download = `roamly-${viaggio.nome}.png`
      a.click()
    }
  }, [exported, viaggio.nome])

  const anteprimaW = Math.round(dim.w * SCALA_ANTEPRIMA)
  const anteprimaH = Math.round(dim.h * SCALA_ANTEPRIMA)
  const canShare   = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        key="panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="
          fixed bottom-0 left-0 right-0 z-50
          flex justify-center
        "
      >
        <div className="
          w-full max-w-[430px]
          bg-roamly-bg rounded-t-3xl
          shadow-2xl shadow-black/30
          flex flex-col
          max-h-[92vh]
          overflow-y-auto
        ">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-roamly-g5 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
            <h2 className="font-lora text-xl font-semibold text-roamly-g0">
              Condividi viaggio
            </h2>
            <button
              onClick={onClose}
              className="
                w-8 h-8 rounded-full bg-roamly-g6
                flex items-center justify-center
                hover:bg-roamly-g5 transition-colors
              "
              aria-label="Chiudi"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Selector formato */}
          <div className="flex gap-2 px-5 pb-5 shrink-0">
            {(['story', 'square'] as Formato[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFormato(f); setExported(null) }}
                className={`
                  flex-1 flex flex-col items-center gap-1.5 py-3
                  rounded-2xl border transition-all duration-150
                  ${formato === f
                    ? 'border-roamly-g2 bg-roamly-g7'
                    : 'border-roamly-g6 bg-white hover:border-roamly-g5'
                  }
                `}
              >
                {/* Icona formato */}
                <div className={`
                  border-2 rounded-md
                  ${formato === f ? 'border-roamly-g2' : 'border-roamly-g5'}
                  ${f === 'story' ? 'w-5 h-9' : 'w-7 h-7'}
                `} />
                <span className="font-dm-sans text-xs font-medium text-roamly-text/70">
                  {f === 'story' ? 'Story 9:16' : 'Square 1:1'}
                </span>
              </button>
            ))}
          </div>

          {/* Anteprima card */}
          <div className="flex justify-center px-5 pb-5">
            <div
              style={{ width: anteprimaW, height: anteprimaH }}
              className="rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
            >
              <div style={{
                transform: `scale(${SCALA_ANTEPRIMA})`,
                transformOrigin: 'top left',
                width: dim.w,
                height: dim.h,
              }}>
                <CardContent
                  viaggio={viaggio}
                  coverData={coverData}
                  numRicordi={numRicordi}
                  numFoto={numFoto}
                  formato={formato}
                  width={dim.w}
                  height={dim.h}
                />
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex flex-col gap-3 px-5 pb-8 shrink-0">

            {/* Scarica PNG */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="
                flex items-center justify-center gap-2 h-12 rounded-2xl
                bg-roamly-g0 hover:bg-roamly-g1
                font-dm-sans font-medium text-sm text-white
                disabled:opacity-60
                active:scale-[0.99] transition-all duration-150
              "
            >
              {isExporting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generazione…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Scarica PNG</span>
                </>
              )}
            </button>

            {/* Condividi — solo se Web Share API disponibile */}
            {canShare && exported && (
              <button
                onClick={handleShare}
                className="
                  flex items-center justify-center gap-2 h-12 rounded-2xl
                  bg-roamly-g7 border border-roamly-g5
                  font-dm-sans font-medium text-sm text-roamly-g0
                  hover:bg-roamly-g6
                  active:scale-[0.99] transition-all duration-150
                "
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                <span>Condividi</span>
              </button>
            )}

          </div>

          {/* Card a dimensioni reali — off-screen per export */}
          <div
            style={{
              position: 'fixed',
              top: -9999,
              left: -9999,
              width: dim.w,
              height: dim.h,
              pointerEvents: 'none',
            }}
          >
            <div ref={exportRef} style={{ width: dim.w, height: dim.h }}>
              <CardContent
                viaggio={viaggio}
                coverData={coverData}
                numRicordi={numRicordi}
                numFoto={numFoto}
                formato={formato}
                width={dim.w}
                height={dim.h}
              />
            </div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}
