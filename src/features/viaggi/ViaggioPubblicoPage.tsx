import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { RoamlyMark } from '@/components/ui/RoamlyMark'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { METEO_ICONE } from '@/features/momenti/ContestoRicordo'
import { useViaggioPubblico } from '@/hooks/useCondivisione'
import { METEO_OPTIONS, MOOD_OPTIONS } from '@/types'
import { formatDataViaggio, calcolaDurataViaggio } from '@/lib/viaggi-utils'
import { formatKm, lunghezzaPercorso, numeroGiorno, parseISO } from '@/lib/giorno-utils'
import type { PuntoMappa } from '@/lib/giorno-utils'

// ============================================================
// ViaggioPubblicoPage — /v/:token
// La pagina che vede chi riceve il link: nessun account, nessun
// guard. Mostra solo ciò che il database restituisce da
// viaggio_pubblico(): viaggio + ricordi non nascosti + foto.
// Il vero obiettivo è l'invito a provare Roamly.
// ============================================================

const MappaPercorso = lazy(() => import('./MappaPercorso'))

function BarraSuperiore() {
  return (
    <header className="sticky top-0 z-20 bg-roamly-g0/95 backdrop-blur-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-[430px] mx-auto h-14 px-5 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2" aria-label="Roamly">
          <RoamlyMark size={22} />
          <span className="font-dm-sans text-xs font-semibold tracking-[0.16em] text-white uppercase">Roamly</span>
        </Link>
        <Link to="/login"
          className="h-9 px-4 rounded-full bg-roamly-coral text-white font-dm-sans text-xs font-semibold
            inline-flex items-center shadow-roamly-coral">
          Prova Roamly
        </Link>
      </div>
    </header>
  )
}

function CTA() {
  return (
    <section className="mx-5 my-10 p-6 rounded-3xl bg-roamly-g0 text-center flex flex-col items-center gap-4">
      <RoamlyMark size={44} />
      <h2 className="font-lora text-2xl leading-tight font-semibold text-white">
        Anche tu hai un viaggio<br />da raccontare?
      </h2>
      <p className="font-dm-sans text-sm text-white/65 leading-relaxed">
        Ricordi, foto, mappa e un riepilogo da condividere. Il diario di viaggio che vorrai rileggere.
      </p>
      <Link to="/login"
        className="h-12 px-7 rounded-2xl bg-roamly-coral text-white font-dm-sans font-semibold text-sm shadow-roamly-coral
          inline-flex items-center">
        Crea il tuo diario, è gratis
      </Link>
    </section>
  )
}

export function ViaggioPubblicoPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError } = useViaggioPubblico(token)

  // Pagina privata per i motori di ricerca: il link si condivide, non si indicizza
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { document.head.removeChild(meta) }
  }, [])

  useEffect(() => {
    if (data?.viaggio.nome) document.title = `${data.viaggio.nome} · Roamly`
  }, [data?.viaggio.nome])

  const giorni = useMemo(() => {
    if (!data) return []
    const mappa = new Map<string, typeof data.ricordi>()
    data.ricordi.forEach((r) => mappa.set(r.data, [...(mappa.get(r.data) ?? []), r]))
    return Array.from(mappa.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  const punti: PuntoMappa[] = useMemo(
    () =>
      (data?.ricordi ?? [])
        .filter((r) => r.lat != null && r.lng != null)
        .map((r, i) => ({ id: r.id, tipo: 'ricordo' as const, nome: r.titolo, lat: r.lat as number, lng: r.lng as number, ordine: i + 1 })),
    [data]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-roamly-g0 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-roamly-bg flex flex-col">
        <BarraSuperiore />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
          <RoamlyMark size={56} ink="#0C2A3D" />
          <h1 className="font-lora text-2xl font-semibold text-roamly-g0">Questo viaggio non è più visibile</h1>
          <p className="font-dm-sans text-sm text-roamly-muted max-w-[280px]">
            Chi l'ha condiviso potrebbe aver disattivato il link o averlo cambiato.
          </p>
          <Link to="/login" className="mt-3 h-12 px-7 rounded-2xl bg-roamly-coral text-white font-dm-sans font-semibold text-sm inline-flex items-center">
            Scopri Roamly
          </Link>
        </div>
      </div>
    )
  }

  const { viaggio, ricordi, urlFoto } = data
  const luogo = [viaggio.destinazione, viaggio.paese].filter(Boolean).join(', ')
  const durata = calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine)
  const nFoto = ricordi.reduce((n, r) => n + r.foto.length, 0)
  const km = lunghezzaPercorso(punti)
  // Copertina: la foto di un ricordo preferito se c'è, altrimenti la prima del viaggio
  const ricordoCopertina = ricordi.find((r) => r.preferito && r.foto.some((p) => urlFoto.get(p))) ??
    ricordi.find((r) => r.foto.some((p) => urlFoto.get(p)))
  const pathCopertina = ricordoCopertina?.foto.find((p) => urlFoto.get(p))
  const copertina = pathCopertina ? urlFoto.get(pathCopertina) : undefined

  const numeri: { val: string; label: string }[] = [
    ...(durata ? [{ val: String(durata), label: durata === 1 ? 'giorno' : 'giorni' }] : []),
    { val: String(ricordi.length), label: ricordi.length === 1 ? 'ricordo' : 'ricordi' },
    ...(nFoto ? [{ val: String(nFoto), label: 'foto' }] : []),
    ...(km >= 1 ? [{ val: formatKm(km), label: "in linea d'aria" }] : []),
  ]

  return (
    <div className="min-h-screen bg-roamly-bg">
      <BarraSuperiore />
      <main className="max-w-[430px] mx-auto">
        {/* Hero */}
        <div className="relative h-[68vh] min-h-[420px] max-h-[620px] bg-roamly-g0 overflow-hidden flex flex-col justify-end">
          {copertina ? (
            <>
              <img src={copertina} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0C2A3D 0%,#154B63 60%,#0F7EA8 130%)' }} />
          )}
          <div className="relative px-6 pb-8 flex flex-col gap-3">
            {luogo && (
              <p className="font-dm-sans text-sm text-white/90 inline-flex items-center gap-1.5 font-medium [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                <MapPin size={13} /> {luogo}
              </p>
            )}
            <h1 className="font-lora text-[40px] leading-[1.05] font-semibold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]">
              {viaggio.nome}
            </h1>
            <p className="font-dm-sans text-sm text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">{formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)}</p>
            <div className="flex gap-6 pt-4 mt-1 border-t border-white/25 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              {numeri.map((n) => (
                <div key={n.label} className="flex flex-col gap-0.5">
                  <span className="font-dm-mono text-xl font-bold text-white leading-none">{n.val}</span>
                  <span className="font-dm-sans text-[11px] text-white/80">{n.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mappa */}
        {punti.length >= 2 && (
          <section className="px-5 pt-6">
            <Suspense fallback={<div className="h-[240px] rounded-2xl bg-roamly-g6 animate-pulse" />}>
              <MappaPercorso punti={punti} altezza={240} />
            </Suspense>
          </section>
        )}

        {/* Giorni */}
        {ricordi.length === 0 ? (
          <p className="px-6 py-16 text-center font-lora text-lg text-roamly-g0">Qui non c'è ancora niente da vedere.</p>
        ) : (
          giorni.map(([data_, lista]) => {
            const n = numeroGiorno({ data_inizio: viaggio.data_inizio }, data_)
            const mood = lista.map((r) => r.mood).filter((m, i, a) => a.indexOf(m) === i).slice(0, 3)
            return (
              <section key={data_} className="pt-10">
                <div className="px-6 flex items-center gap-3 mb-5">
                  <div className="flex -space-x-1.5">{mood.map((m) => <MoodIcon key={m} mood={m} size={26} />)}</div>
                  <div className="flex flex-col">
                    <span className="font-dm-mono text-[10px] uppercase tracking-widest text-roamly-muted">{n ? `Giorno ${n}` : 'Giorno'}</span>
                    <span className="font-dm-sans text-sm font-medium text-roamly-ink-soft capitalize">
                      {parseISO(data_).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-8">
                  {lista.map((r) => {
                    let foto = r.foto.map((p) => urlFoto.get(p)).filter((u): u is string => !!u)
                    // la foto già usata come copertina non si ripete subito sotto: se il
                    // ricordo ha altre foto, passa in fondo alla sequenza
                    if (r.id === ricordoCopertina?.id && copertina && foto.length > 1 && foto[0] === copertina) {
                      foto = [...foto.slice(1), copertina]
                    }
                    const MeteoIcona = r.meteo ? METEO_ICONE[r.meteo] : null
                    const moodLabel = MOOD_OPTIONS.find((m) => m.value === r.mood)?.label
                    return (
                      <article key={r.id} className="flex flex-col gap-3">
                        {foto[0] && <img src={foto[0]} alt="" loading="lazy" className="w-full aspect-[4/5] object-cover" />}
                        {foto.length > 1 && (
                          <div className="px-5 grid grid-cols-3 gap-1.5 -mt-1">
                            {foto.slice(1, 4).map((u) => (
                              <img key={u} src={u} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-xl" />
                            ))}
                          </div>
                        )}
                        <div className="px-6 flex flex-col gap-2">
                          <h2 className="font-lora text-[22px] leading-snug font-semibold text-roamly-g0">{r.titolo}</h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-dm-sans text-xs text-roamly-muted">
                            {r.luogo && <span className="inline-flex items-center gap-1"><MapPin size={11} />{r.luogo.split(',').slice(0, 2).join(',')}</span>}
                            <span className="inline-flex items-center gap-1.5"><MoodIcon mood={r.mood} size={16} />{moodLabel}</span>
                            {MeteoIcona && (
                              <span className="inline-flex items-center gap-1">
                                <MeteoIcona size={12} strokeWidth={1.9} />
                                {METEO_OPTIONS.find((m) => m.value === r.meteo)?.label}
                                {r.temperatura != null && <span className="font-dm-mono">{r.temperatura}°</span>}
                              </span>
                            )}
                          </div>
                          {r.testo && <p className="font-dm-sans text-base text-roamly-text/80 leading-[1.75] whitespace-pre-wrap">{r.testo}</p>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}

        <CTA />
        <p className="pb-10 text-center font-dm-sans text-[11px] text-roamly-muted">
          Pagina condivisa da un utente di Roamly.
        </p>
      </main>
    </div>
  )
}
