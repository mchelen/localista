import { SECTIONS } from '../lib/sections'
import type { GeoContext } from '../lib/types'
import { PanelHeading } from './Panel'

export function JurisdictionPanel({ geo }: { geo: GeoContext }) {
  return (
    <section className="panel" id={SECTIONS.where.id}>
      <PanelHeading icon={SECTIONS.where.icon} tint={SECTIONS.where.tint}>
        Where you are
      </PanelHeading>
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
