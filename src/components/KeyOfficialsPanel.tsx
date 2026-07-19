import { salienceTier } from '../lib/salience'
import type { GeoContext, Loadable, Representative } from '../lib/types'
import { RepCard } from './RepCard'

/**
 * Tier-1 officials (docs/UX_DESIGN.md §2): the people with the most
 * practical impact on this location — e.g. in DC, the mayor and the
 * user's own ward councilmember. Renders nothing until reps are ready;
 * loading/error states are handled by the full reps panel below it.
 */
export function KeyOfficialsPanel({
  state,
  geo
}: {
  state: Loadable<Representative[]>
  geo: GeoContext
}) {
  if (state.status !== 'ready') return null
  const key = state.data.filter((r) => salienceTier(r, geo) === 1)
  if (key.length === 0) return null
  return (
    <section className="panel key-panel">
      <h2>Most impactful for you</h2>
      <p className="muted">
        The officials with the most direct power over daily life at this location.
      </p>
      <div className="rep-grid">
        {key.map((r) => (
          <RepCard key={`${r.office}-${r.name}`} rep={r} />
        ))}
      </div>
    </section>
  )
}
