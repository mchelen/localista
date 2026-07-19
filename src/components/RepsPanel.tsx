import { salienceTier } from '../lib/salience'
import type { GeoContext, Loadable, RepLevel, Representative } from '../lib/types'
import { openStatesKey } from '../services/openstates'
import { Panel } from './Panel'
import { RepCard } from './RepCard'

const GROUPS: Array<{ level: RepLevel; heading: string }> = [
  { level: 'federal', heading: 'Federal' },
  { level: 'state', heading: 'State' },
  { level: 'local', heading: 'Hyperlocal' }
]

/**
 * Complete grouped reference of the user's representatives, minus the
 * tier-1 "key officials" already featured above (docs/UX_DESIGN.md §6).
 */
export function RepsPanel({
  state,
  geo
}: {
  state: Loadable<Representative[]>
  geo: GeoContext
}) {
  const hasOpenStates = Boolean(openStatesKey())
  return (
    <Panel
      title="All your representatives"
      state={state}
      emptyMessage="No representatives found for this location."
    >
      {(reps) => {
        const rest = reps.filter((r) => salienceTier(r, geo) !== 1)
        return (
          <>
            {rest.length < reps.length && (
              <p className="muted">
                Key officials for this location are featured above; here is everyone
                you're eligible to elect, by level.
              </p>
            )}
            {GROUPS.map(({ level, heading }) => {
              const group = rest.filter((r) => r.level === level)
              if (group.length === 0 && level !== 'state') return null
              return (
                <div key={level}>
                  <h3 className="group-heading">{heading}</h3>
                  {group.length > 0 ? (
                    <div className="rep-grid">
                      {group.map((r, i) => (
                        <RepCard key={`${r.office}-${r.name}-${i}`} rep={r} />
                      ))}
                    </div>
                  ) : (
                    !hasOpenStates && (
                      <p className="note">
                        No state-legislator data for this location yet. Deploy the CI
                        data pipeline snapshots, or add a free Open States API key in{' '}
                        <code>.env.local</code>.
                      </p>
                    )
                  )}
                </div>
              )
            })}
          </>
        )
      }}
    </Panel>
  )
}
