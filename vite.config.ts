import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// ============================================================
// ROAMLY — Vite + PWA Configuration
//
// STRATEGIA SERVICE WORKER (approvata Sprint 8):
//   CacheFirst    → asset statici (JS, CSS, font, icone, manifest, offline.html)
//   NetworkOnly   → API Supabase REST (*.supabase.co/rest/*)
//   NetworkOnly   → Storage Supabase e signed URL (*.supabase.co/storage/*)
//
// Il Service Worker NON cachea:
//   - Risposte API Supabase (fonte di verità: React Query)
//   - Route React (la shell SPA è in cache, le route sono client-side)
//   - Signed URL foto (fonte di verità: React Query, staleTime 50 min)
//
// Una sola fonte di caching per i dati: React Query.
// Il SW gestisce esclusivamente la shell applicativa e gli asset statici.
// ============================================================

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // ── Manifest ────────────────────────────────────────────
      // NOTA: includeAssets rimosso — globPatterns: ['**/*.{js,css,html,ico,png,svg,...}']
      // copre già favicon.svg, offline.html e icons/*.png evitando duplicati nel precache.
      manifest: {
        name:        'Roamly',
        short_name:  'Roamly',
        description: 'Conserva ogni viaggio. Rivivilo quando vuoi.',
        theme_color:      '#0C2A3D',
        background_color: '#F9FBFC',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        prefer_related_applications: false,
        categories: ['lifestyle', 'travel'],
        icons: [
          {
            src:   '/icons/icon-192.png',
            sizes: '192x192',
            type:  'image/png',
          },
          {
            src:   '/icons/icon-512.png',
            sizes: '512x512',
            type:  'image/png',
          },
          {
            src:     '/icons/icon-maskable-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable',
          },
          {
            src:   '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type:  'image/png',
          },
        ],
      },

      // ── Workbox ─────────────────────────────────────────────
      workbox: {
        // Precache tutti gli asset statici generati da Vite
        // (JS chunks, CSS, font, icone già in includeAssets)
        // png escluse: le icone PWA vengono aggiunte automaticamente dal manifest
        // evita duplicati nel precache tra globPatterns e manifest icons
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],

        // NavigationFallback: richieste di navigazione SPA non in cache
        // → serve index.html (shell React) che gestisce il routing client-side
        navigateFallback:      'index.html',
        navigateFallbackDenylist: [
          // Non intercettare le route API o Storage con navigateFallback
          /^\/rest\//,
          /^\/storage\//,
        ],

        runtimeCaching: [
          // ── CacheFirst: asset statici già in precache ────────
          // (Workbox gestisce la precache automaticamente — questo
          //  handler copre asset non inclusi nel manifest di precache)
          {
            urlPattern: /\.(?:js|css|woff2?|png|svg|ico)$/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'roamly-static-v1',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 giorni
            },
          },

          // ── NetworkOnly: API Supabase REST ───────────────────
          // I dati sono gestiti esclusivamente da React Query.
          // Il SW non interferisce — passa tutto alla rete.
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/rest/'),
            handler: 'NetworkOnly',
          },

          // ── NetworkOnly: Supabase Storage e signed URL ───────
          // Le signed URL sono gestite da React Query (staleTime 50 min).
          // Il SW non cachea foto — evita di servire URL scadute.
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/storage/'),
            handler: 'NetworkOnly',
          },

          // ── NetworkOnly: Supabase Auth ───────────────────────
          // I token JWT devono sempre essere freschi.
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/auth/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
