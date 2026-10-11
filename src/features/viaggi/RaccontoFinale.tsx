import { lazy, Suspense, useMemo } from 'react'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { MOOD_OPTIONS } from '@/types'
import type { Mood, Ricordo } from '@/types'
import { curvaUmore, formatKm, lunghezzaPercorso, parseISO } from '@/lib/giorno-utils'
import type { PuntoMappa } from '@/lib/giorno-utils'

// ============================================================
// RaccontoFinale — chiusura del Racconto v2: il percorso su
// mappa, il viaggio in numeri, la curva dell'umore.
// Solo dati già in cache (ricordi del viaggio) — zero query.
// ============================================================

const MappaPercorso = lazy(() => import('./MappaPercorso'))

function Titolo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-ink-soft">
      {children}
    </h3>
  )
}

// ── Curva dell'umore (SVG) ──────────────────────────────────

function CurvaUmore({ ricordi }: { ricordi: Ricordo[] }) {
  const punti = useMemo(() => curvaUmore(ricordi), [ricordi])
  if (punti.length < 2) return null

  const W = 320, H = 110, PX = 22, PY = 16
  const x = (i: number) => PX + (i * (W - 2 * PX)) / (punti.length - 1)
  const y = (v: number) => PY + ((5 - v) * (H - 2 * PY)) / 4
  const d = punti.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.valore).toFixed(1)}`).join(' ')
  const area = `${d} L${x(punti.length - 1).toFixed(1)} ${H - PY} L${x(0).toFixed(1)} ${H - PY} Z`
  // Evidenzia il giorno più alto con l'icona del suo mood
  const top = punti.reduce((best, p, i) => (p.valore > punti[best].valore ? i : best), 0)

  return (
    <div className="flex flex-col gap-2">
      <Titolo>L'umore, giorno per giorno</Titolo>
      <div className="bg-white rounded-2xl shadow-roamly p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
          aria-label="Andamento dell'umore durante il viaggio">
          <defs>
            <linearGradient id="curva-umore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5FB8D9" stopOpacity="0.35" />
              <stop offset="1" stopColor="#5FB8D9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#curva-umore)" />
          <path d={d} fill="none" stroke="#2B8FB3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {punti.map((p, i) => (
            <circle key={p.data} cx={x(i)} cy={y(p.valore)} r={i === top ? 0 : 3} fill="#fff" stroke="#2B8FB3" strokeWidth="2" />
          ))}
          <foreignObject x={x(top) - 14} y={y(punti[top].valore) - 14} width="28" height="28">
            <MoodIcon mood={punti[top].mood} size={28} />
          </foreignObject>
        </svg>
        <div className="flex justify-between px-1 font-dm-mono text-[10px] text-roamly-muted">
          <span>{parseISO(punti[0].data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
          <span>{parseISO(punti[punti.length - 1].data).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  )
}

// ── Componente principale ───────────────────────────────────

interface Props {
  ricordi: Ricordo[]
  giorni: number | null
  totaleFoto: number
}

export function RaccontoFinale({ ricordi, giorni, totaleFoto }: Props) {
  const ordinati = useMemo(
    () => [...ricordi].sort((a, b) => a.data.localeCompare(b.data) || a.ordine - b.ordine),
    [ricordi]
  )

  const punti: PuntoMappa[] = useMemo(
    () =>
      ordinati
        .filter((r) => r.lat != null && r.lng != null)
        .map((r, i) => ({ id: r.id, tipo: 'ricordo' as const, nome: r.titolo, lat: r.lat!, lng: r.lng!, ordine: i + 1 })),
    [ordinati]
  )

  const luoghi = new Set(ricordi.map((r) => r.luogo?.split(',')[0]?.trim()).filter(Boolean)).size
  const km = lunghezzaPercorso(punti)

  const conta = new Map<Mood, number>()
  ricordi.forEach((r) => conta.set(r.mood, (conta.get(r.mood) ?? 0) + 1))
  const moodTop = Array.from(conta.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
  const moodTopLabel = MOOD_OPTIONS.find((m) => m.value === moodTop)?.label

  const numeri: { val: string; label: string }[] = [
    ...(giorni ? [{ val: String(giorni), label: giorni === 1 ? 'giorno' : 'giorni' }] : []),
    { val: String(ricordi.length), label: ricordi.length === 1 ? 'ricordo' : 'ricordi' },
    ...(totaleFoto ? [{ val: String(totaleFoto), label: 'foto' }] : []),
    ...(luoghi ? [{ val: String(luoghi), label: luoghi === 1 ? 'luogo' : 'luoghi' }] : []),
    ...(km >= 1 ? [{ val: formatKm(km), label: "in linea d'aria" }] : []),
  ]

  return (
    <section className="px-5 flex flex-col gap-7 pb-10">
      <div className="flex flex-col gap-2">
        <Titolo>Il viaggio in numeri</Titolo>
        <div className="bg-roamly-g0 rounded-3xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-y-4 gap-x-3">
            {numeri.map((n) => (
              <div key={n.label} className="flex flex-col gap-0.5">
                <span className="font-dm-mono text-2xl font-bold text-white leading-none">{n.val}</span>
                <span className="font-dm-sans text-[11px] text-white/55">{n.label}</span>
              </div>
            ))}
          </div>
          {moodTop && (
            <div className="flex items-center gap-3 pt-4 border-t border-white/15">
              <MoodIcon mood={moodTop} size={36} />
              <p className="font-dm-sans text-sm text-white/80">
                L'umore che è tornato più spesso: <span className="font-semibold text-white">{moodTopLabel}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {punti.length > 0 && (
        <div className="flex flex-col gap-2">
          <Titolo>Il percorso</Titolo>
          <Suspense fallback={<div className="h-[260px] rounded-2xl bg-roamly-g6 animate-pulse" />}>
            <MappaPercorso punti={punti} altezza={260} />
          </Suspense>
        </div>
      )}

      <CurvaUmore ricordi={ricordi} />
    </section>
  )
}
