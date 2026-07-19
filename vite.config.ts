import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project sites serve from /<repo>/ — CI sets BASE_PATH.
const base = process.env.BASE_PATH ?? '/'

const entry = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * The site is a multi-page build: the app (index.html) plus standalone
 * content pages with real URLs. Keeping the content pages OUT of the app
 * bundle lets CI publish content updates even when the app build is
 * broken (vite.content.config.ts builds just these entries as a
 * fallback — keep the two input lists in sync).
 */
export const contentInputs = {
  blog: entry('blog/index.html'),
  help: entry('help/index.html'),
  faq: entry('faq/index.html'),
  about: entry('about/index.html')
}

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: { main: entry('index.html'), ...contentInputs }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/localista.svg'],
      manifest: {
        name: 'Localista',
        short_name: 'Localista',
        description:
          'Hyperlocal civic information: your representatives, bills, elections, and jurisdiction facts based on where you are.',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/localista.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icons/localista-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Content pages are served network-first (below), not precached:
        // CI may republish fresh content pages alongside a carried-forward
        // app (broken-build fallback), and a stale precache would mask
        // those updates for installed-PWA users.
        globIgnores: [
          'blog/**',
          'help/**',
          'faq/**',
          'about/**',
          'assets/blog-*',
          'assets/help-*',
          'assets/faq-*',
          'assets/about-*'
        ],
        runtimeCaching: [
          {
            // Standalone content pages + their entry chunks: fresh when
            // online, last-seen copy offline.
            urlPattern: /\/((blog|help|faq|about)\/(index\.html)?|assets\/(blog|help|faq|about)-[^/]+)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'localista-content-pages',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // Precompiled static data API (same origin): fresh when online,
            // last-known-good offline. Not precached — refreshes daily
            // without invalidating the app shell.
            urlPattern: /\/data\/.+\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'localista-static-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // Large, slow-changing roster of Congress members (live
            // fallback path): serve from cache, refresh daily.
            urlPattern: /^https:\/\/unitedstates\.github\.io\/congress-legislators\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'congress-legislators',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            // OSM raster tiles for the map: cache-first — tiles are
            // immutable enough and this keeps repeat pans/zooms light on
            // the volunteer-run tile servers.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 256, maxAgeSeconds: 60 * 60 * 24 * 14 }
            }
          },
          {
            urlPattern:
              /^https:\/\/(geocoding\.geo\.census\.gov|api\.census\.gov|tigerweb\.geo\.census\.gov|maps2\.dcgis\.dc\.gov|v3\.openstates\.org|api\.congress\.gov|www\.googleapis\.com)\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'civic-data',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'pipeline/**/*.test.ts']
  }
} as Parameters<typeof defineConfig>[0])
