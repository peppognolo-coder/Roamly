/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Splash di apertura: definita in index.html (script inline), prima del bundle.
// ready() dice alla splash che l'app è pronta e può sfumare. Può mancare
// (test, SSR, script rimosso): chiamare sempre con ?.
interface Window {
  __roamlySplash?: { ready: () => void }
}

interface ImportMetaEnv {
  // 'true' mostra "Continua con Apple" nel login. Va attivato solo dopo aver
  // configurato Apple Developer + Supabase (vedi docs/apple-login.md).
  readonly VITE_APPLE_LOGIN?: string
}
