import { formatDate } from '../lib/format'
import type { Bill, Loadable } from '../lib/types'
import { Panel } from './Panel'

export function BillsPanel({ state }: { state: Loadable<Bill[]> }) {
  return (
    <Panel
      title="Bills & measures under consideration"
      state={state}
      emptyMessage="No recent bills found."
    >
      {(bills) => (
        <ul className="bill-list">
          {bills.map((b) => (
            <li key={`${b.jurisdiction}-${b.id}`} className="bill">
              <div className="bill-head">
                <span className="bill-id">{b.id}</span>
                <span className="bill-jurisdiction">{b.jurisdiction}</span>
              </div>
              <p className="bill-title">
                {b.url ? (
                  <a href={b.url} target="_blank" rel="noreferrer">
                    {b.title}
                  </a>
                ) : (
                  b.title
                )}
              </p>
              {b.lastAction && (
                <p className="muted">
                  Latest action{b.lastActionDate ? ` (${formatDate(b.lastActionDate)})` : ''}:{' '}
                  {b.lastAction}
                </p>
              )}
              <p className="source">Source: {b.source}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
