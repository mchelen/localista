import type { ReactNode } from 'react'
import type { Loadable } from '../lib/types'

/**
 * Panel identity system: every section has an emoji glyph in a tinted
 * chip and a stable id (jump-nav target). The tint comes from the
 * `panel-tint-*` class so section color-coding stays consistent between
 * the panel headers, the jump chips, and (where applicable) the map
 * legend / level badges.
 */
export function PanelHeading({
  icon,
  tint,
  children
}: {
  icon: string
  tint: string
  children: ReactNode
}) {
  return (
    <h2 className="panel-title">
      <span className={`panel-glyph panel-tint-${tint}`} aria-hidden="true">
        {icon}
      </span>
      {children}
    </h2>
  )
}

interface PanelProps<T> {
  title: string
  icon: string
  tint: string
  id?: string
  className?: string
  state: Loadable<T>
  children: (data: T) => ReactNode
  emptyMessage?: string
}

/** Section wrapper: every data panel loads, fails, and renders on its own. */
export function Panel<T>({
  title,
  icon,
  tint,
  id,
  className,
  state,
  children,
  emptyMessage
}: PanelProps<T>) {
  return (
    <section
      className={className ? `panel ${className}` : 'panel'}
      id={id}
      aria-busy={state.status === 'loading'}
    >
      <PanelHeading icon={icon} tint={tint}>
        {title}
      </PanelHeading>
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
