import { BillsPanel } from '../components/BillsPanel'
import { DemographicsPanel } from '../components/DemographicsPanel'
import { ElectionsPanel } from '../components/ElectionsPanel'
import { JurisdictionPanel } from '../components/JurisdictionPanel'
import { KeyOfficialsPanel } from '../components/KeyOfficialsPanel'
import { LocationBar } from '../components/LocationBar'
import { RepsPanel } from '../components/RepsPanel'
import { ServicesPanel } from '../components/ServicesPanel'
import { useLocalista } from '../hooks/useLocalista'
import { DEMO_LABEL } from '../services/demo'

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
            <a href="#/blog">introduction</a> or the <a href="#/help">help guide</a>.
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
            {/* Order per docs/UX_DESIGN.md §6: orientation → power → tasks
                → reference → decisions → timing → context. */}
            <JurisdictionPanel geo={state.geo} />
            <KeyOfficialsPanel state={state.reps} geo={state.geo} />
            <ServicesPanel state={state.resources} />
            <RepsPanel state={state.reps} geo={state.geo} />
            <BillsPanel state={state.bills} />
            <ElectionsPanel state={state.elections} />
            <DemographicsPanel state={state.demographics} />
          </>
        )}
      </main>
    </>
  )
}
