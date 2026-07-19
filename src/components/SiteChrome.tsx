import type { ReactNode } from 'react'

/**
 * Shared header/nav/footer for every page of the site.
 *
 * The informational pages (blog/help/faq/about) are standalone static
 * entries with real URLs — NOT hash routes inside the app bundle — so CI
 * can build and publish content updates even when the app build is broken
 * (see docs/ci/deploy.yml). Keep this file's dependency footprint prose-
 * light: no hooks, no services, no app state.
 */

/** Site pages as paths relative to the deploy base ('' = the app home). */
export type SitePage = '' | 'blog/' | 'help/' | 'faq/' | 'about/'

/** Absolute href for a site page under the configured base path. */
export function pageHref(page: SitePage): string {
  return import.meta.env.BASE_URL + page
}

const NAV: Array<{ page: SitePage; label: string }> = [
  { page: '', label: 'Home' },
  { page: 'blog/', label: 'Why Localista' },
  { page: 'help/', label: 'Help' },
  { page: 'faq/', label: 'FAQ' },
  { page: 'about/', label: 'About' }
]

export function SiteChrome({
  active,
  footerExtra,
  children
}: {
  active: SitePage
  /** Extra first line for the footer (the app adds its data-snapshot date). */
  footerExtra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <a href={pageHref('')} className="brand">
            <span aria-hidden="true">🏛️ </span>Localista
          </a>
        </h1>
        <nav className="site-nav" aria-label="Site">
          {NAV.map((item) => (
            <a
              key={item.page || 'home'}
              href={pageHref(item.page)}
              aria-current={active === item.page ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {children}

      <footer className="app-footer">
        {footerExtra}
        <p>
          Data: U.S. Census Bureau · unitedstates/congress-legislators · DC Open Data ·
          Open States · Congress.gov · Google Civic Information · OpenStreetMap (map
          tiles). Your location is sent only to these providers to answer your query,
          and never stored by Localista.
        </p>
        <p>
          <a href={pageHref('blog/')}>Why Localista</a> ·{' '}
          <a href={pageHref('help/')}>Help</a> · <a href={pageHref('faq/')}>FAQ</a> ·{' '}
          <a href={pageHref('about/')}>About</a>
        </p>
      </footer>
    </div>
  )
}
