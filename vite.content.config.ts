import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { contentInputs } from './vite.config'

/**
 * Content-only build: just the standalone informational pages (blog,
 * help, faq, about) — no app entry, no PWA/service worker. CI's deploy
 * workflow uses this as a fallback when the app build is broken: it
 * builds fresh content pages and overlays them onto the last-known-good
 * deployed site, so documentation updates always publish
 * (docs/ci/deploy.yml). Also useful locally: npm run build:content.
 *
 * Not emitting a service worker here is load-bearing — the overlay must
 * never clobber the deployed app's sw.js/manifest with a content-only
 * precache.
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist-content',
    rollupOptions: { input: contentInputs }
  }
})
