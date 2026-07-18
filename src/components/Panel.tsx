import type { ReactNode } from 'react'
import type { Loadable } from '../lib/types'

interface PanelProps<T> {
  title: string
  state: Loadable<T>
  children: (data: T) => ReactNode
  emptyMessage?: string
}

/** Section wrapper: every data panel loads, fails, and renders on its own. */
export function Panel<T>({ title, state, children, emptyMessage }: PanelProps<T>) {
  return (
    <section className="panel" aria-busy={state.status === 'loading'}>
      <h2>{title}</h2>
      {state.status === 'idle' && null}
      {state.status === 'loading' && <p className="muted">Loading…</p>}
      {state.status === 'unavailable' && <p className="note">{state.reason}</p>}
      {state.status === 'error' && (
        <p className="error" role="alert">
          Couldn’t load this section: {state.message}
        </p>
      )}
      {state.status === 'ready' &&
        (Array.isArray(state.data) && state.data.length === 0 ? (
          <p className="muted">{emptyMessage ?? 'Nothing to show here.'}</p>
        ) : (
          children(state.data)
        ))}
    </section>
  )
}
