import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteChrome, type SitePage } from '../components/SiteChrome'
import '../styles.css'

/**
 * Mount helper for the standalone content entries (blog/help/faq/about).
 * These pages deliberately avoid the app's hooks/services so they compile
 * even when app code is broken — the content-only CI fallback build
 * (vite.content.config.ts) depends on that isolation. No service-worker
 * registration here either: the SW belongs to the app entry.
 */
export function mountContentPage(active: SitePage, page: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SiteChrome active={active}>{page}</SiteChrome>
    </StrictMode>
  )
}
