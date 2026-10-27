import { useEffect, useRef, useState } from 'react'

// ============================================================
// DiagnosticaPage — /diagnostica
// Strumento per capire come un dispositivo (es. iPad) misura lo schermo.
// Mostra le altezze che il browser dichiara e tre barre di prova in basso:
//   A rossa  — position: fixed; bottom: 0              (come la barra dell'app)
//   B blu    — posizionata con window.visualViewport    (area davvero visibile)
//   C verde  — position: fixed; top: 0
// Si apre da /diagnostica e non cambia nulla nell'app.
// ============================================================

interface Misure { [k: string]: string }

function leggi(sonda: HTMLDivElement | null): Misure {
  const m: Misure = {}
  const de = document.documentElement
  const vv = window.visualViewport
  m['versione app'] = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'sconosciuta'
  m['innerWidth × innerHeight'] = `${window.innerWidth} × ${window.innerHeight}`
  m['outerHeight'] = String(window.outerHeight)
  m['screen (w × h)'] = `${screen.width} × ${screen.height}`
  m['clientHeight (html)'] = String(de.clientHeight)
  m['scrollHeight (html)'] = String(de.scrollHeight)
  m['scrollY'] = String(Math.round(window.scrollY))
  m['visualViewport w × h'] = vv ? `${Math.round(vv.width)} × ${Math.round(vv.height)}` : 'n/d'
  m['visualViewport offsetTop'] = vv ? String(Math.round(vv.offsetTop)) : 'n/d'
  m['visualViewport scale'] = vv ? vv.scale.toFixed(2) : 'n/d'
  m['devicePixelRatio'] = String(window.devicePixelRatio)
  m['standalone (app installata)'] = String(
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
  if (sonda) {
    for (const [nome, valore] of [['100vh', '100vh'], ['100svh', '100svh'], ['100lvh', '100lvh'], ['100dvh', '100dvh']]) {
      sonda.style.height = valore
      m[`altezza ${nome}`] = String(sonda.offsetHeight)
    }
    sonda.style.height = ''
    const lati: Array<[string, string]> = [['top', 'padding-top'], ['bottom', 'padding-bottom'], ['left', 'padding-left'], ['right', 'padding-right']]
    for (const [lato, prop] of lati) {
      sonda.style.cssText = `position:absolute;visibility:hidden;${prop}:env(safe-area-inset-${lato},0px)`
      m[`area sicura ${lato}`] = String(parseFloat(getComputedStyle(sonda).getPropertyValue(prop)) || 0)
    }
    sonda.style.cssText = 'position:absolute;visibility:hidden;width:1px'
  }
  const nav = document.querySelector('nav[aria-label="Navigazione principale"]')
  m['barra dell’app presente'] = nav ? 'sì' : 'no (questa pagina non la mostra)'
  m['browser'] = navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90)
  return m
}

export function DiagnosticaPage() {
  const sonda = useRef<HTMLDivElement>(null)
  const barraB = useRef<HTMLDivElement>(null)
  const [misure, setMisure] = useState<Misure>({})

  useEffect(() => {
    const aggiorna = () => {
      setMisure(leggi(sonda.current))
      const vv = window.visualViewport
      if (vv && barraB.current) {
        barraB.current.style.transform = `translateY(${Math.round(vv.offsetTop + vv.height - 44)}px)`
      }
    }
    aggiorna()
    const vv = window.visualViewport
    window.addEventListener('resize', aggiorna)
    window.addEventListener('scroll', aggiorna, { passive: true })
    vv?.addEventListener('resize', aggiorna)
    vv?.addEventListener('scroll', aggiorna)
    return () => {
      window.removeEventListener('resize', aggiorna)
      window.removeEventListener('scroll', aggiorna)
      vv?.removeEventListener('resize', aggiorna)
      vv?.removeEventListener('scroll', aggiorna)
    }
  }, [])

  const barra = (colore: string): React.CSSProperties => ({
    position: 'fixed', height: 44, width: '33.33%', color: '#fff', font: '600 13px system-ui',
    display: 'flex', alignItems: 'center', justifyContent: 'center', background: colore, zIndex: 99999,
  })

  return (
    <div style={{ minHeight: '200dvh', padding: '72px 16px 120px', background: '#F4F9FC', color: '#0C2A3D', font: '14px/1.5 system-ui' }}>
      <div ref={sonda} style={{ position: 'absolute', visibility: 'hidden', width: 1 }} />
      <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>Diagnostica schermo</h1>
      <p style={{ margin: '0 0 16px', color: '#4B6577' }}>
        Fai uno screenshot di questa schermata (con le tre barre colorate in basso e in alto), poi scorri un po&rsquo; la pagina e fanne un secondo.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 560 }}>
        <tbody>
          {Object.entries(misure).map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid #D5E1E9' }}>
              <td style={{ padding: '5px 8px 5px 0', color: '#4B6577', verticalAlign: 'top' }}>{k}</td>
              <td style={{ padding: '5px 0', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-word' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 40, color: '#4B6577' }}>Continua a scorrere: la pagina è lunga apposta (200% dello schermo).</p>

      <div style={{ ...barra('#D93A2B'), left: 0, bottom: 0 }}>A · fixed bottom 0</div>
      <div ref={barraB} style={{ ...barra('#1F6FD6'), left: '33.33%', top: 0 }}>B · visualViewport</div>
      <div style={{ ...barra('#1E9E5A'), left: '66.66%', top: 0 }}>C · fixed top 0</div>
    </div>
  )
}
