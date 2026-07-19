import { JurisdictionPanel } from '../components/JurisdictionPanel'
import { LevelSections } from '../components/LevelSections'
import { LocationBar } from '../components/LocationBar'
import { MapPanel } from '../components/MapPanel'
import { pageHref } from '../components/SiteChrome'
import { useLocalista } from '../hooks/useLocalista'
import { classifyJurisdiction, LEVEL_ORDER } from '../lib/civicLevels'
import { levelSection, SECTIONS } from '../lib/sections'
import type { GeoContext } from '../lib/types'
import { DEMO_LABEL } from '../services/demo'

/** Chips to every section this location resolves to, most local first. */
function JumpNav({ geo }: { geo: GeoContext }) {
  const levels = LEVEL_ORDER.filter((level) =>
    geo.jurisdictions.some((j) => classifyJurisdiction(j, geo) === level)
  )
  const targets = [SECTIONS.where, SECTIONS.map, ...levels.map(levelSection)]
  return (
    <nav className="jump-nav" aria-label="Jump to section">
      {targets.map((t) => (
        <a className={`jump-chip panel-tint-${t.tint}`} href={`#${t.id}`} key={t.id}>
          <span aria-hidden="true">{t.icon} </span>
          {t.short}
        </a>
      ))}
    </nav>
  )
}

export function HomePage() {
  const { state, locate, lookupAddress, loadDemo, reset } = useLocalista()
  const busy = state.phase === 'locating' || state.phase === 'resolving'
  const showResults = state.phase === 'ready' || state.phase === 'demo'

  return (
    <>
      <p className="tagline">
        Your representatives, bills, elections, and local facts — based on where you
        are.
      </p>
      <LocationBar
        busy={busy}
        onLocate={locate}
        onAddress={(a) => void lookupAddress(a)}
        onDemo={loadDemo}
      />

      <main>
        {state.phase === 'idle' && (
          <p className="intro">
            Localista never stores your location — it’s used once, in your browser, to
            look up your districts, then discarded. Start with the button above, type
            an address, or try the demo. New here? Read the{' '}
            <a href={pageHref('blog/')}>introduction</a> or the{' '}
            <a href={pageHref('help/')}>help guide</a>.
          </p>
        )}
        {state.phase === 'locating' && <p className="status">Getting your location…</p>}
        {state.phase === 'resolving' && (
          <p className="status">Figuring out your districts…</p>
        )}
        {state.phase === 'error' && (
          <div className="error-box" role="alert">
            <p>{state.error}</p>
            <button type="button" onClick={reset}>
              Start over
            </button>
          </div>
        )}
        {state.phase === 'demo' && <p className="demo-banner">{DEMO_LABEL}</p>}

        {showResults && state.geo && (
          <>
            <JumpNav geo={state.geo} />
            {/* Orientation first (where + map), then one section per level
                of government, most local → least local, each bundling that
                level's reps, services, bills, elections, and facts
                (docs/UX_DESIGN.md §6). */}
            <JurisdictionPanel geo={state.geo} />
            <MapPanel geo={state.geo} />
            <LevelSections state={state} geo={state.geo} />
          </>
        )}
      </main>
    </>
  )
}
