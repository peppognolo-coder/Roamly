import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Share2, Loader2, Globe } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useReducedMotion } from 'framer-motion'
import { StoriaView, TELA } from './StorieViews'
import { LinkPubblicoSheet } from '@/features/viaggi/LinkPubblicoSheet'
import { useMioRuolo } from '@/hooks/useMembri'
import { useViaggio } from '@/hooks/useViaggi'
import { useRicordi } from '@/hooks/useRicordi'
import { useCoversByViaggio, useCoverViaggio, useFotoCountByViaggio } from '@/hooks/useFoto'
import { buildStorie } from '@/lib/wrapped-utils'
import type { Storia } from '@/lib/wrapped-utils'
import { formatDataViaggio, calcolaDurataViaggio } from '@/lib/viaggi-utils'
import { urlToDataUrl } from '@/lib/share-utils'

// ============================================================
// WrappedPage — /viaggi/:id/wrapped
// Il riepilogo animato del viaggio, a storie verticali a tutto
// schermo. Tocca a destra = avanti, a sinistra = indietro,
// tieni premuto = pausa. Ogni storia si condivide come immagine
// 1080×1920. Tutti i dati arrivano dalle query già in cache.
// ============================================================

const DURATA_MS: Record<Storia['tipo'], number> = {
  copertina: 5000, numeri: 7000, percorso: 6500, umore: 6000,
  giornoBello: 6000, compagni: 6000, meteo: 6000, chiusura: 8000,
}

export function WrappedPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const ridotto = !!useReducedMotion()

  const { data: viaggio } = useViaggio(viaggioId)
  const { data: ricordi, isLoading } = useRicordi(viaggioId)
  const { data: coversMap } = useCoversByViaggio(viaggioId)
  const { data: coverViaggio } = useCoverViaggio(viaggioId)
  const { data: fotoCount } = useFotoCountByViaggio(viaggioId)
  const { data: mioRuolo } = useMioRuolo(viaggioId)
  const [mostraLink, setMostraLink] = useState(false)

  const storie = useMemo(
    () =>
      viaggio && ricordi
        ? buildStorie({
            viaggio, ricordi, coversMap, fotoCount, coverViaggio,
            durataGiorni: calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine),
            dateStr: formatDataViaggio(viaggio.data_inizio, viaggio.data_fine),
          })
        : [],
    [viaggio, ricordi, coversMap, fotoCount, coverViaggio]
  )

  const [indice, setIndice] = useState(0)
  const [progresso, setProgresso] = useState(0) // 0..1 della storia corrente
  const [inPausa, setInPausa] = useState(false)
  const [condivisione, setCondivisione] = useState(false)
  const [daEsportare, setDaEsportare] = useState<Storia | null>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const esci = useCallback(() => navigate(`/viaggi/${viaggioId}`, { replace: true }), [navigate, viaggioId])
  const storia = storie[indice]
  const ultima = indice === storie.length - 1

  const avanti = useCallback(() => {
    setProgresso(0)
    setIndice((i) => (i < storie.length - 1 ? i + 1 : i))
  }, [storie.length])
  const indietro = useCallback(() => {
    setProgresso(0)
    setIndice((i) => Math.max(0, i - 1))
  }, [])

  // ── Timer (requestAnimationFrame, in pausa si ferma) ─────────
  useEffect(() => {
    if (!storia || inPausa || condivisione || mostraLink || ultima) return
    const durata = DURATA_MS[storia.tipo] * (ridotto ? 1.4 : 1)
    let raf = 0
    let ultimo = performance.now()
    let acc = progresso * durata
    const tick = (now: number) => {
      acc += now - ultimo
      ultimo = now
      if (acc >= durata) { avanti(); return }
      setProgresso(acc / durata)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `progresso` è volutamente fuori: lo riprendiamo solo alla ripartenza
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, inPausa, condivisione, mostraLink, storia, ultima, ridotto, avanti])

  // Tastiera (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') avanti()
      else if (e.key === 'ArrowLeft') indietro()
      else if (e.key === 'Escape') esci()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [avanti, indietro, esci])

  // Blocca lo scroll della pagina sotto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Scala della tela 360×640 allo schermo ────────────────────
  const [scala, setScala] = useState(1)
  useEffect(() => {
    const calcola = () => setScala(Math.min(window.innerWidth / TELA.w, window.innerHeight / TELA.h))
    calcola()
    window.addEventListener('resize', calcola)
    return () => window.removeEventListener('resize', calcola)
  }, [])

  // ── Tocco: tap = avanti/indietro, tieni premuto = pausa ──────
  const pressione = useRef<{ t: number; timer: number | null }>({ t: 0, timer: null })
  const onDown = () => {
    pressione.current.t = Date.now()
    pressione.current.timer = window.setTimeout(() => setInPausa(true), 220)
  }
  const onUp = (e: React.PointerEvent) => {
    if (pressione.current.timer) window.clearTimeout(pressione.current.timer)
    const durata = Date.now() - pressione.current.t
    setInPausa(false)
    if (durata < 220) {
      const x = e.clientX / window.innerWidth
      if (x < 0.3) indietro()
      else avanti()
    }
  }

  // ── Condivisione della storia corrente ───────────────────────
  const condividi = useCallback(async () => {
    if (!storia || condivisione) return
    setCondivisione(true)
    try {
      // le foto vanno incorporate (dataURL) o l'export fallisce per CORS
      let s: Storia = storia
      if ((s.tipo === 'copertina' || s.tipo === 'giornoBello') && s.fotoUrl) {
        const dataUrl = await urlToDataUrl(s.fotoUrl)
        s = { ...s, fotoUrl: dataUrl }
      }
      setDaEsportare(s)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      await document.fonts.ready
      if (!exportRef.current) return
      const png = await toPng(exportRef.current, { width: TELA.w, height: TELA.h, pixelRatio: 3 })
      const blob = await (await fetch(png)).blob()
      const nome = `roamly-${(viaggio?.nome ?? 'viaggio').toLowerCase().replace(/\s+/g, '-')}-${indice + 1}.png`
      const file = new File([blob], nome, { type: 'image/png' })
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: viaggio?.nome ?? 'Il mio viaggio', text: 'Il mio viaggio, raccontato su Roamly.' })
        } else throw new Error('no-share')
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        const a = document.createElement('a')
        a.href = png
        a.download = nome
        a.click()
      }
    } catch (err) {
      console.error('Condivisione storia fallita:', err)
    } finally {
      setDaEsportare(null)
      setCondivisione(false)
    }
  }, [storia, condivisione, viaggio?.nome, indice])

  // ── Stati di caricamento / vuoto ─────────────────────────────
  if (isLoading || !viaggio) {
    return (
      <div className="fixed inset-0 z-[60] bg-roamly-g0 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (storie.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-roamly-g0 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="font-lora text-2xl font-semibold text-white">Ancora niente da raccontare</p>
        <p className="font-dm-sans text-sm text-white/60">Aggiungi qualche ricordo al viaggio e il riepilogo prende forma.</p>
        <button onClick={esci} className="mt-2 h-11 px-6 rounded-2xl bg-white text-roamly-g0 font-dm-sans font-semibold text-sm">
          Torna al viaggio
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black select-none touch-none overflow-hidden">
      {/* Tela scalata */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ width: TELA.w, height: TELA.h, transform: `translate(-50%,-50%) scale(${scala})` }}
      >
        <div key={indice} className="absolute inset-0">
          <StoriaView storia={storia} statico={ridotto} />
        </div>

        {/* Barrette di progresso */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10" aria-hidden>
          {storie.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${i < indice ? 100 : i === indice ? (ultima ? 100 : progresso * 100) : 0}%` }}
              />
            </div>
          ))}
        </div>

        {/* Zona tocco (sotto ai pulsanti) */}
        <div className="absolute inset-0 z-[5]" onPointerDown={onDown} onPointerUp={onUp}
          onPointerLeave={() => { if (pressione.current.timer) window.clearTimeout(pressione.current.timer); setInPausa(false) }} />

        {/* Pulsanti alto */}
        <div className="absolute top-8 left-3 right-3 flex justify-between z-10">
          <button onClick={esci} aria-label="Chiudi"
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center">
            <X size={20} />
          </button>
          <button onClick={condividi} aria-label="Condividi questa storia" disabled={condivisione}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center disabled:opacity-60">
            {condivisione ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          </button>
        </div>

        {/* Ultima storia: azioni */}
        {ultima && (
          <div className="absolute left-7 right-7 bottom-20 z-10 flex flex-col gap-2.5">
            <button onClick={condividi} disabled={condivisione}
              className="h-12 rounded-2xl bg-roamly-coral text-white font-dm-sans font-semibold text-sm shadow-roamly-coral
                inline-flex items-center justify-center gap-2 disabled:opacity-70">
              <Share2 size={16} /> Condividi
            </button>
            <div className={`grid gap-2.5 ${mioRuolo === 'proprietario' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {mioRuolo === 'proprietario' && (
                <button onClick={() => setMostraLink(true)}
                  className="h-12 rounded-2xl bg-white/12 border border-white/20 text-white font-dm-sans font-medium text-sm
                    inline-flex items-center justify-center gap-1.5">
                  <Globe size={15} /> Link pubblico
                </button>
              )}
              <button onClick={() => navigate(`/viaggi/${viaggioId}/racconto`, { replace: true })}
                className="h-12 rounded-2xl bg-white/12 border border-white/20 text-white font-dm-sans font-medium text-sm">
                Leggi il racconto
              </button>
            </div>
            <button onClick={() => { setProgresso(0); setIndice(0) }}
              className="h-9 text-white/60 font-dm-sans text-xs">Rivedi dall'inizio</button>
          </div>
        )}
      </div>

      {mostraLink && viaggioId && (
        <LinkPubblicoSheet viaggioId={viaggioId} nomeViaggio={viaggio.nome} onClose={() => setMostraLink(false)} />
      )}

      {/* Nodo nascosto per l'export a 1080×1920 */}
      {daEsportare && (
        <div style={{ position: 'fixed', left: -10000, top: 0, width: TELA.w, height: TELA.h }} aria-hidden>
          <div ref={exportRef} style={{ position: 'relative', width: TELA.w, height: TELA.h }}>
            <StoriaView storia={daEsportare} statico />
          </div>
        </div>
      )}
    </div>
  )
}
