import type { GeoContext } from '../lib/types'

export function JurisdictionPanel({ geo }: { geo: GeoContext }) {
  return (
    <section className="panel">
      <h2>Where you are</h2>
      {geo.matchedAddress && <p className="muted">{geo.matchedAddress}</p>}
      <dl className="jurisdiction-list">
        {geo.jurisdictions.map((j) => (
          <div className="jurisdiction-row" key={`${j.kind}-${j.name}`}>
            <dt>{j.label}</dt>
            <dd>{j.name}</dd>
          </div>
        ))}
      </dl>
      <p className="source">
        Source: U.S. Census Bureau geocoder{geo.stateAbbr === 'DC' ? ' + DC Open Data' : ''}
      </p>
    </section>
  )
}
