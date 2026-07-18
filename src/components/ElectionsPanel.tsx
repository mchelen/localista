import { formatDate } from '../lib/format'
import type { ElectionInfo, Loadable } from '../lib/types'
import { Panel } from './Panel'

export function ElectionsPanel({ state }: { state: Loadable<ElectionInfo[]> }) {
  return (
    <Panel title="Upcoming elections" state={state} emptyMessage="No upcoming elections listed.">
      {(elections) => (
        <ul className="election-list">
          {elections.map((e) => (
            <li key={`${e.name}-${e.date}`} className="election">
              <span className="election-date">{formatDate(e.date)}</span>
              <div>
                <p className="election-name">{e.name}</p>
                <p className="source">Source: {e.source}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
