import { useEffect, useMemo, useState } from 'react'
import { motion, animate } from 'framer-motion'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { RoamlyMark } from '@/components/ui/RoamlyMark'
import { METEO_ICONE } from '@/features/momenti/ContestoRicordo'
import { METEO_OPTIONS, MOOD_OPTIONS } from '@/types'
import { formatKm, parseISO } from '@/lib/giorno-utils'
import type { Storia } from '@/lib/wrapped-utils'

// ============================================================
// ROAMLY — Storie del riepilogo animato
// Ogni storia è disegnata su una tela fissa 360×640 (9:16); la
// pagina la scala a schermo, l'export la rende a 1080×1920.
// `statico` = niente animazioni, valori finali: serve all'export
// in immagine e a chi ha disattivato le animazioni.
// ============================================================

export const TELA = { w: 360, h: 640 }

const ease = [0.22, 1, 0.36, 1] as const

function Appare({ children, delay = 0, statico, className = '', y = 14 }: {
  children: React.ReactNode; delay?: number; statico: boolean; className?: string; y?: number
}) {
  if (statico) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

function Conta({ a, statico, delay = 0, formato }: {
  a: number; statico: boolean; delay?: number; formato?: (n: number) => string
}) {
  const [v, setV] = useState(statico ? a : 0)
  useEffect(() => {
    if (statico) { setV(a); return }
    const c = animate(0, a, { duration: 1.3, delay, ease, onUpdate: (x) => setV(x) })
    return () => c.stop()
  }, [a, statico, delay])
  return <>{formato ? formato(v) : Math.round(v)}</>
}

const Etichetta = ({ children }: { children: React.ReactNode }) => (
  <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{children}</p>
)

function Marchio() {
  return (
    <div className="absolute bottom-7 left-0 right-0 flex items-center justify-center gap-2 opacity-70">
      <RoamlyMark size={18} />
      <span className="font-dm-sans text-[11px] font-semibold tracking-[0.16em] text-white uppercase">Roamly</span>
    </div>
  )
}

function Sfondo({ foto, children }: { foto?: string | null; children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-roamly-g0">
      {foto ? (
        <>
          <img src={foto} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/80" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0C2A3D 0%,#154B63 60%,#0F7EA8 130%)' }} />
      )}
      {children}
    </div>
  )
}

// ── Singole storie ──────────────────────────────────────────

type P<T extends Storia['tipo']> = { s: Extract<Storia, { tipo: T }>; statico: boolean }

function Copertina({ s, statico }: P<'copertina'>) {
  return (
    <Sfondo foto={s.fotoUrl}>
      <div className="absolute inset-x-7 bottom-24 flex flex-col gap-3">
        <Appare statico={statico}><Etichetta>Il tuo viaggio, raccontato</Etichetta></Appare>
        <Appare statico={statico} delay={0.15}>
          <h1 className="font-lora text-[44px] leading-[1.05] font-semibold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]">{s.nome}</h1>
        </Appare>
        <Appare statico={statico} delay={0.3} className="flex flex-col gap-0.5">
          {s.luogo && <p className="font-dm-sans text-sm text-white/80">{s.luogo}</p>}
          <p className="font-dm-sans text-sm text-white/55">{s.date}</p>
        </Appare>
      </div>
      <Marchio />
    </Sfondo>
  )
}

function Numeri({ s, statico }: P<'numeri'>) {
  const righe = [
    ...(s.giorni ? [{ n: s.giorni, l: s.giorni === 1 ? 'giorno' : 'giorni' }] : []),
    { n: s.ricordi, l: s.ricordi === 1 ? 'ricordo' : 'ricordi' },
    ...(s.foto ? [{ n: s.foto, l: s.foto === 1 ? 'foto' : 'foto' }] : []),
    ...(s.luoghi ? [{ n: s.luoghi, l: s.luoghi === 1 ? 'luogo' : 'luoghi' }] : []),
  ]
  return (
    <Sfondo>
      <div className="absolute inset-x-8 top-24 flex flex-col gap-7">
        <Appare statico={statico}><Etichetta>In numeri</Etichetta></Appare>
        {righe.map((r, i) => (
          <Appare key={r.l} statico={statico} delay={0.25 + i * 0.35} className="flex items-baseline gap-3">
            <span className="font-dm-mono text-[64px] leading-none font-bold text-white tabular-nums">
              <Conta a={r.n} statico={statico} delay={0.25 + i * 0.35} />
            </span>
            <span className="font-lora italic text-2xl text-roamly-g4">{r.l}</span>
          </Appare>
        ))}
      </div>
      <Marchio />
    </Sfondo>
  )
}

function Percorso({ s, statico }: P<'percorso'>) {
  const W = 296, H = 330
  const { d, pts } = useMemo(() => {
    const lat0 = s.punti.reduce((a, p) => a + p.lat, 0) / s.punti.length
    const k = Math.cos((lat0 * Math.PI) / 180)
    const xs = s.punti.map((p) => p.lng * k)
    const ys = s.punti.map((p) => -p.lat)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const scala = Math.min((W - 40) / ((x1 - x0) || 1), (H - 40) / ((y1 - y0) || 1))
    const ox = (W - (x1 - x0) * scala) / 2
    const oy = (H - (y1 - y0) * scala) / 2
    const pts = s.punti.map((_, i) => ({ x: ox + (xs[i] - x0) * scala, y: oy + (ys[i] - y0) * scala }))
    return { pts, d: pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') }
  }, [s.punti])

  return (
    <Sfondo>
      <div className="absolute inset-x-8 top-20 flex flex-col gap-2">
        <Appare statico={statico}><Etichetta>Il percorso</Etichetta></Appare>
        <Appare statico={statico} delay={0.1}>
          <p className="font-lora text-[34px] leading-tight font-semibold text-white">
            {s.km >= 1 ? <><Conta a={s.km} statico={statico} formato={(n) => formatKm(n)} /> </> : null}
            <span className="text-roamly-g4 italic font-normal">{s.km >= 1 ? "in linea d'aria" : 'tutto a due passi'}</span>
          </p>
        </Appare>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute left-[32px] top-[200px]" aria-hidden>
        {statico ? (
          <path d={d} fill="none" stroke="#5FB8D9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" />
        ) : (
          <motion.path d={d} fill="none" stroke="#5FB8D9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, delay: 0.4, ease: 'easeInOut' }} />
        )}
        {pts.map((p, i) => (
          statico ? <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 7 : 4.5} fill={i === pts.length - 1 ? '#FF6B4A' : '#fff'} />
          : <motion.circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 7 : 4.5} fill={i === pts.length - 1 ? '#FF6B4A' : '#fff'}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + (2.4 * i) / Math.max(1, pts.length - 1), duration: 0.3 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }} />
        ))}
      </svg>
      <Marchio />
    </Sfondo>
  )
}

function Umore({ s, statico }: P<'umore'>) {
  const label = MOOD_OPTIONS.find((m) => m.value === s.mood)?.label ?? ''
  // curva decorativa dietro l'icona
  const W = 360, H = 130
  const curva = s.curva.length >= 2 ? s.curva.map((p, i) => {
    const x = (i * W) / (s.curva.length - 1)
    const y = H - ((p.valore - 1) / 4) * (H - 30) - 15
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') : null
  return (
    <Sfondo>
      {curva && (
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute left-0 right-0 bottom-[70px] w-full h-[130px] opacity-25" aria-hidden>
          <path d={curva} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <div className="absolute inset-x-8 top-24 flex flex-col items-start gap-5">
        <Appare statico={statico}><Etichetta>Il tuo umore</Etichetta></Appare>
        {statico ? (
          <MoodIcon mood={s.mood} size={170} />
        ) : (
          <motion.div initial={{ scale: 0.4, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 13, delay: 0.2 }}>
            <MoodIcon mood={s.mood} size={170} />
          </motion.div>
        )}
        <Appare statico={statico} delay={0.6}>
          <p className="font-lora text-[40px] leading-tight font-semibold text-white">{label}</p>
          <p className="font-dm-sans text-base text-white/70 mt-1">
            è tornato {s.quanti === 1 ? 'una volta' : `${s.quanti} volte`} su {s.totale} ricordi
          </p>
        </Appare>
      </div>
      <Marchio />
    </Sfondo>
  )
}

function GiornoBello({ s, statico }: P<'giornoBello'>) {
  const data = parseISO(s.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <Sfondo foto={s.fotoUrl}>
      <div className="absolute inset-x-7 bottom-24 flex flex-col gap-3">
        <Appare statico={statico}>
          <Etichetta>{s.preferito ? 'Il tuo preferito' : 'Il momento più bello'}</Etichetta>
        </Appare>
        <Appare statico={statico} delay={0.15}>
          <h2 className="font-lora text-[36px] leading-[1.1] font-semibold text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.35)]">{s.titolo}</h2>
        </Appare>
        <Appare statico={statico} delay={0.3} className="flex items-center gap-3">
          <MoodIcon mood={s.mood} size={36} />
          <div className="flex flex-col">
            <span className="font-dm-sans text-sm text-white/85 capitalize">{data}</span>
            {s.luogo && <span className="font-dm-sans text-xs text-white/60">{s.luogo.split(',').slice(0, 2).join(',')}</span>}
          </div>
        </Appare>
      </div>
      <Marchio />
    </Sfondo>
  )
}

function Compagni({ s, statico }: P<'compagni'>) {
  return (
    <Sfondo>
      <div className="absolute inset-x-8 top-24 flex flex-col gap-6">
        <Appare statico={statico}><Etichetta>Non eri solo</Etichetta></Appare>
        {s.nomi.map((n, i) => (
          <Appare key={n.nome} statico={statico} delay={0.2 + i * 0.3} className="flex flex-col">
            <span className="font-lora text-[44px] leading-[1.05] font-semibold text-white truncate">{n.nome}</span>
            <span className="font-dm-sans text-sm text-roamly-g4">in {n.volte} {n.volte === 1 ? 'ricordo' : 'ricordi'}</span>
          </Appare>
        ))}
      </div>
      <Marchio />
    </Sfondo>
  )
}

function Meteo({ s, statico }: P<'meteo'>) {
  return (
    <Sfondo>
      <div className="absolute inset-x-8 top-24 flex flex-col gap-6">
        <Appare statico={statico}><Etichetta>Che tempo ha fatto</Etichetta></Appare>
        {s.conteggi.slice(0, 4).map((c, i) => {
          const Icona = METEO_ICONE[c.meteo]
          const label = METEO_OPTIONS.find((m) => m.value === c.meteo)?.label ?? ''
          return (
            <Appare key={c.meteo} statico={statico} delay={0.2 + i * 0.3} className="flex items-center gap-4">
              <Icona size={40} strokeWidth={1.5} className="text-roamly-g4 shrink-0" />
              <span className="font-dm-mono text-[44px] leading-none font-bold text-white w-14">
                <Conta a={c.giorni} statico={statico} delay={0.2 + i * 0.3} />
              </span>
              <span className="font-lora italic text-xl text-white/85">{c.giorni === 1 ? 'giorno' : 'giorni'} di {label.toLowerCase()}</span>
            </Appare>
          )
        })}
        {s.tMax != null && (
          <Appare statico={statico} delay={1.6}>
            <p className="font-dm-sans text-sm text-white/60">Il più caldo: <span className="font-dm-mono text-white">{s.tMax}°</span></p>
          </Appare>
        )}
      </div>
      <Marchio />
    </Sfondo>
  )
}

function Chiusura({ s, statico }: P<'chiusura'>) {
  return (
    <Sfondo>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-9 text-center">
        <Appare statico={statico}><RoamlyMark size={64} /></Appare>
        <Appare statico={statico} delay={0.2}>
          <p className="font-lora text-[34px] leading-tight font-semibold text-white">Questo era <span className="italic text-roamly-g4">{s.nome}</span>.</p>
        </Appare>
        <Appare statico={statico} delay={0.4}>
          <p className="font-dm-sans text-base text-white/70">Grazie per averlo scritto. Tra qualche anno vorrai rileggerlo.</p>
        </Appare>
      </div>
    </Sfondo>
  )
}

// ── Dispatcher ──────────────────────────────────────────────

export function StoriaView({ storia, statico = false }: { storia: Storia; statico?: boolean }) {
  switch (storia.tipo) {
    case 'copertina':   return <Copertina s={storia} statico={statico} />
    case 'numeri':      return <Numeri s={storia} statico={statico} />
    case 'percorso':    return <Percorso s={storia} statico={statico} />
    case 'umore':       return <Umore s={storia} statico={statico} />
    case 'giornoBello': return <GiornoBello s={storia} statico={statico} />
    case 'compagni':    return <Compagni s={storia} statico={statico} />
    case 'meteo':       return <Meteo s={storia} statico={statico} />
    case 'chiusura':    return <Chiusura s={storia} statico={statico} />
  }
}
