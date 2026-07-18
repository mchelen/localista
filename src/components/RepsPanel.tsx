import type { Loadable, RepLevel, Representative } from '../lib/types'
import { openStatesKey } from '../services/openstates'
import { Panel } from './Panel'
import { RepCard } from './RepCard'

const GROUPS: Array<{ level: RepLevel; heading: string }> = [
  { level: 'federal', heading: 'Federal' },
  { level: 'state', heading: 'State' },
  { level: 'local', heading: 'Hyperlocal' }
]

export function RepsPanel({ state }: { state: Loadable<Representative[]> }) {
  const hasOpenStates = Boolean(openStatesKey())
  return (
    <Panel
      title="Your elected representatives"
      state={state}
      emptyMessage="No representatives found for this location."
    >
      {(reps) => (
        <>
          {GROUPS.map(({ level, heading }) => {
            const group = reps.filter((r) => r.level === level)
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
      )}
    </Panel>
  )
}
