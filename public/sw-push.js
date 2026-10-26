// ============================================================
// ROAMLY — Push handler per il Service Worker
//
// Importato dal Service Worker generato da Workbox (vedi
// vite.config.ts → workbox.importScripts) — Workbox gestisce
// solo caching/precache, gli event listener custom (push,
// notificationclick) vivono qui.
//
// Inerte finché N3 (motore di invio) non manda davvero un push:
// questo file si limita ad ASCOLTARE, non manda nulla da solo.
// ============================================================

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Roamly', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Roamly'
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  const target = new URL(url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      // App già aperta (anche in background): la porta in primo piano e la
      // manda alla pagina della notifica. Prima si usava client.url.includes(url)
      // con url '/', che combaciava sempre e si limitava a riaprire l'app
      // dov'era rimasta.
      for (const client of windowClients) {
        if (new URL(client.url).origin !== self.location.origin || !('focus' in client)) continue
        try {
          const focused = await client.focus()
          if (focused && 'navigate' in focused && focused.url !== target) {
            return await focused.navigate(target)
          }
          return focused
        } catch {
          // navigate() non disponibile o rifiutato: ripiega su una nuova finestra
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
