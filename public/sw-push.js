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

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
