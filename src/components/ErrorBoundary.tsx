import { Component } from 'react'
import type { ReactNode } from 'react'

// ============================================================
// ErrorBoundary — rete di sicurezza globale
// Senza questo, un errore JS non gestito durante il render
// smonta tutto React e lascia una schermata bianca — nessun
// indizio per chi la vede, e nessuna traccia se non si apre la
// console. Da qui in poi, un errore così mostra un messaggio con
// un pulsante "Ricarica" invece del bianco, e lo stampa in
// console con dettagli, in modo che sia diagnosticabile.
// ============================================================

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error('[Roamly] Errore non gestito nel render:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 32,
            textAlign: 'center',
            fontFamily: '"DM Sans", sans-serif',
            background: '#F9FBFC',
            color: '#0C2A3D',
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Qualcosa è andato storto
          </p>
          <p style={{ fontSize: 14, opacity: 0.55, maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
            Prova a ricaricare la pagina. Se il problema persiste, potrebbe
            essere una versione vecchia rimasta in cache sul dispositivo.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              height: 46,
              padding: '0 26px',
              borderRadius: 999,
              border: 'none',
              background: '#FF6B4A',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Ricarica
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
