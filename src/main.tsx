import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles/globals.css'

// ============================================================
// Registrazione esplicita del Service Worker.
//
// Prima si contava sull'iniezione automatica di vite-plugin-pwa
// (injectRegister: 'auto', il default) — che in teoria fa già
// skipWaiting + clientsClaim + reload con registerType:
// 'autoUpdate'. Farlo esplicitamente qui dà due cose in più:
//   1. Un controllo periodico dell'aggiornamento (ogni 60 minuti,
//      utile per chi tiene l'app aperta a lungo senza mai
//      ricaricarla) — altrimenti si controlla solo al primo carico.
//   2. Un punto solo dove, in futuro, intercettare `onNeedRefresh`
//      per mostrare un avviso invece di ricaricare "in silenzio".
// ============================================================

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => {
      registration.update()
    }, 60 * 60 * 1000)
  },
  onRegisterError(error) {
    // eslint-disable-next-line no-console
    console.error('[Roamly] Registrazione Service Worker fallita:', error)
  },
})
void updateSW

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
