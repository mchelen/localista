import type { CivicResource, Loadable } from '../lib/types'
import { Panel } from './Panel'

/** Task-oriented civic services for this location (docs/UX_DESIGN.md §4). */
export function ServicesPanel({ state }: { state: Loadable<CivicResource[]> }) {
  return (
    <Panel
      title="Local services & resources"
      state={state}
      emptyMessage="No service links for this location yet."
    >
      {(resources) => (
        <div className="resource-grid">
          {resources.map((r) => (
            <a
              key={r.url}
              className="resource-card"
              href={r.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="resource-label">
                {r.label} <span aria-hidden="true">↗</span>
              </span>
              {r.description && <span className="resource-desc">{r.description}</span>}
              <span className="resource-meta">
                {r.jurisdiction}
                {r.phone ? ` · ☎ ${r.phone}` : ''}
              </span>
            </a>
          ))}
        </div>
      )}
    </Panel>
  )
}
