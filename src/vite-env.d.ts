/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Splash di apertura: definita in index.html (script inline), prima del bundle.
// ready() dice alla splash che l'app è pronta e può sfumare. Può mancare
// (test, SSR, script rimosso): chiamare sempre con ?.
interface Window {
  __roamlySplash?: { ready: () => void }
}
