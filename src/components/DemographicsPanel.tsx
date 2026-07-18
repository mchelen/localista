import type { JurisdictionDemographics, Loadable } from '../lib/types'
import { Panel } from './Panel'

export function DemographicsPanel({
  state
}: {
  state: Loadable<JurisdictionDemographics[]>
}) {
  return (
    <Panel
      title="About your jurisdictions"
      state={state}
      emptyMessage="No demographic data available."
    >
      {(profiles) => (
        <div className="demo-grid">
          {profiles.map((p) => (
            <article key={`${p.level}-${p.jurisdictionName}`} className="demo-card">
              <h3>{p.jurisdictionName}</h3>
              <p className="muted">{p.level}</p>
              <dl>
                {p.rows.map((row) => (
                  <div className="demo-row" key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="source">Source: {p.source}</p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
