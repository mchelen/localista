import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
        start_url: '/',
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
        runtimeCaching: [
          {
            // Large, slow-changing roster of Congress members: serve from
            // cache, refresh daily.
            urlPattern: /^https:\/\/unitedstates\.github\.io\/congress-legislators\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'congress-legislators',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern:
              /^https:\/\/(geocoding\.geo\.census\.gov|api\.census\.gov|maps2\.dcgis\.dc\.gov|v3\.openstates\.org|api\.congress\.gov|www\.googleapis\.com)\//,
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
    include: ['src/**/*.test.ts']
  }
} as Parameters<typeof defineConfig>[0])
