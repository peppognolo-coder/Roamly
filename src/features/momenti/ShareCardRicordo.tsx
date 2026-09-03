import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { urlToDataUrl } from '@/lib/share-utils'
import { MOOD_OPTIONS } from '@/types'
import type { Ricordo, ViaggioConStato } from '@/types'

// ============================================================
// ShareCardRicordo — genera e scarica una share card di un ricordo
// Stesso pattern di ShareCardViaggio: anteprima scalata, due
// formati (Story 9:16 · Square 1:1), export PNG via html-to-image,
// download + Web Share API. Vedi ShareCardViaggio per le note
// tecniche complete su questo approccio.
// ============================================================

interface ShareCardRicordoProps {
  ricordo:   Ricordo
  viaggio?:  ViaggioConStato | null
  coverUrl?: string | null   // signed URL della foto di copertina del ricordo, se presente
  onClose:   () => void
}

type Formato = 'story' | 'square'

const DIMENSIONI: Record<Formato, { w: number; h: number }> = {
  story:  { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
}

const SCALA_ANTEPRIMA = 0.28

// Gradient per mood — coerente con RicordoCard/HeroCardDiario (qui
// come colori hex diretti, servono per lo sfondo della card esportata)
const MOOD_COLORI: Record<string, [string, string]> = {
  felice:       ['#F5A623', '#C77800'],
  meravigliato: ['#EC4899', '#9D1D63'],
  sereno:       ['#0F7EA8', '#0C2A3D'],
  entusiasta:   ['#FF6B4A', '#C23A1E'],
  ispirato:     ['#C084FC', '#6B21A8'],
}

// ============================================================
// CardContent — il contenuto visivo della card (anteprima + export)
// ============================================================

interface CardContentProps {
  ricordo:    Ricordo
  viaggio?:   ViaggioConStato | null
  coverData:  string | null
  formato:    Formato
  width:      number
  height:     number
}

function CardContent({ ricordo, viaggio, coverData, formato, width, height }: CardContentProps) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === ricordo.mood)
  const [colA, colB] = MOOD_COLORI[ricordo.mood] ?? MOOD_COLORI.sereno
  const isStory = formato === 'story'

  const [ry, rm, rd] = ricordo.data.split('-').map(Number)
  const dataStr = new Date(ry, rm - 1, rd).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const scale = width / 1080
  const fs = {
    tag:    Math.round(22 * scale),
    titolo: Math.round(isStory ? 64 * scale : 52 * scale),
    testo:  Math.round(30 * scale),
    meta:   Math.round(26 * scale),
    brand:  Math.round(24 * scale),
    emoji:  Math.round(isStory ? 120 * scale : 96 * scale),
  }
  const pad   = Math.round(60 * scale)
  const padSm = Math.round(40 * scale)
  const gap   = Math.round(20 * scale)

  // Estratto breve del testo — una card non è la pagina intera
  const estrattoTesto = ricordo.testo && ricordo.testo.length > 160
    ? ricordo.testo.slice(0, 160).trim() + '…'
    : ricordo.testo

  return (
    <div
      style={{
        width, height,
        position: 'relative',
        overflow: 'hidden',
        background: coverData ? '#0C2A3D' : `linear-gradient(160deg, ${colA} 0%, ${colB} 100%)`,
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Background foto, se presente ── */}
      {coverData && (
        <>
          <img
            src={coverData}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: 0.4,
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: isStory
              ? 'linear-gradient(to bottom, rgba(12,42,61,0.55) 0%, rgba(12,42,61,0.15) 35%, rgba(12,42,61,0.2) 60%, rgba(12,42,61,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(12,42,61,0.65) 0%, rgba(12,42,61,0.25) 50%, rgba(12,42,61,0.75) 100%)',
          }} />
        </>
      )}

      {/* ── Contenuto ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: pad, gap,
      }}>

        {/* Header brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(10 * scale) }}>
          <div style={{
            width: Math.round(36 * scale), height: Math.round(36 * scale),
            borderRadius: Math.round(8 * scale),
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: Math.round(18 * scale),
          }}>
            📖
          </div>
          <span style={{
            fontSize: fs.brand, color: 'rgba(255,255,255,0.75)',
            fontWeight: 500, letterSpacing: '0.05em',
          }}>
            Roamly
          </span>
        </div>

        {/* Spacer superiore su story */}
        {isStory && <div style={{ flex: 1 }} />}

        {/* Emoji mood grande — solo se nessuna foto */}
        {!coverData && (
          <div style={{ display: 'flex', justifyContent: isStory ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: fs.emoji, lineHeight: 1 }}>{moodOption?.emoji}</span>
          </div>
        )}

        {/* Titolo + testo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(14 * scale) }}>
          <h1 style={{
            fontSize: fs.titolo, fontWeight: 700, color: '#ffffff',
            lineHeight: 1.15, margin: 0,
            fontFamily: "'Lora', Georgia, serif",
            textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          }}>
            {ricordo.titolo}
          </h1>

          {estrattoTesto && (
            <p style={{
              fontSize: fs.testo,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
              margin: 0,
              fontStyle: 'italic',
            }}>
              “{estrattoTesto}”
            </p>
          )}
        </div>

        {/* Spacer inferiore su square */}
        {!isStory && <div style={{ flex: 1 }} />}

        {/* Meta: mood label + luogo + data */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: Math.round(6 * scale),
          paddingTop: Math.round(20 * scale),
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}>
          {ricordo.luogo && (
            <span style={{ fontSize: fs.meta, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              📍 {ricordo.luogo}
            </span>
          )}
          <span style={{ fontSize: fs.meta, color: 'rgba(255,255,255,0.55)' }}>
            {moodOption?.label} · {dataStr}
          </span>
        </div>

        {/* Footer brand */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: padSm,
        }}>
          <span style={{ fontSize: fs.brand, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
            {viaggio ? `Da: ${viaggio.nome}` : ''}
          </span>
          <span style={{
            fontSize: fs.brand, color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em', textTransform: 'uppercase' as const, fontWeight: 500,
          }}>
            roamly.app
          </span>
        </div>

      </div>
    </div>
  )
}

// ============================================================
// ShareCardRicordo — modal principale
// ============================================================

export function ShareCardRicordo({ ricordo, viaggio, coverUrl, onClose }: ShareCardRicordoProps) {
  const [formato, setFormato]         = useState<Formato>('square')
  const [coverData, setCoverData]     = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported]       = useState<string | null>(null)
  const exportRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!coverUrl) { setCoverData(null); return }
    urlToDataUrl(coverUrl).then(setCoverData)
  }, [coverUrl])

  const dim = DIMENSIONI[formato]

  const handleExport = useCallback(async () => {
    if (!exportRef.current || isExporting) return
    setIsExporting(true)

    try {
      await document.fonts.ready

      const dataUrl = await toPng(exportRef.current, {
        width:  dim.w,
        height: dim.h,
        pixelRatio: 1,
        filter: (node) => node !== document.body,
      })

      setExported(dataUrl)

      const a = document.createElement('a')
      a.href     = dataUrl
      a.download = `roamly-${ricordo.titolo.toLowerCase().replace(/\s+/g, '-')}-${formato}.png`
      a.click()
    } catch (err) {
      console.error('Export fallito:', err)
    } finally {
      setIsExporting(false)
    }
  }, [dim, formato, ricordo.titolo, isExporting])

  const handleShare = useCallback(async () => {
    if (!exported) return
    try {
      const resp  = await fetch(exported)
      const blob  = await resp.blob()
      const file  = new File([blob], `roamly-${ricordo.titolo}.png`, { type: 'image/png' })
      await navigator.share({ files: [file], title: ricordo.titolo })
    } catch {
      const a = document.createElement('a')
      a.href     = exported
      a.download = `roamly-${ricordo.titolo}.png`
      a.click()
    }
  }, [exported, ricordo.titolo])

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
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
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
              Condividi ricordo
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
                width: dim.w, height: dim.h,
              }}>
                <CardContent
                  ricordo={ricordo}
                  viaggio={viaggio}
                  coverData={coverData}
                  formato={formato}
                  width={dim.w}
                  height={dim.h}
                />
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex flex-col gap-3 px-5 pb-8 shrink-0">
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
          <div style={{ position: 'fixed', top: -9999, left: -9999, width: dim.w, height: dim.h, pointerEvents: 'none' }}>
            <div ref={exportRef} style={{ width: dim.w, height: dim.h }}>
              <CardContent
                ricordo={ricordo}
                viaggio={viaggio}
                coverData={coverData}
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
