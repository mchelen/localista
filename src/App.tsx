import { BillsPanel } from './components/BillsPanel'
import { DemographicsPanel } from './components/DemographicsPanel'
import { ElectionsPanel } from './components/ElectionsPanel'
import { JurisdictionPanel } from './components/JurisdictionPanel'
import { LocationBar } from './components/LocationBar'
import { RepsPanel } from './components/RepsPanel'
import { useLocalista } from './hooks/useLocalista'
import { DEMO_LABEL } from './services/demo'

export default function App() {
  const { state, locate, lookupAddress, loadDemo, reset } = useLocalista()
  const busy = state.phase === 'locating' || state.phase === 'resolving'
  const showResults = state.phase === 'ready' || state.phase === 'demo'

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span aria-hidden="true">🏛️ </span>Localista
        </h1>
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
      </header>

      <main>
        {state.phase === 'idle' && (
          <p className="intro">
            Localista never stores your location — it’s used once, in your browser, to
            look up your districts, then discarded. Start with the button above, type
            an address, or try the demo.
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
            <JurisdictionPanel geo={state.geo} />
            <RepsPanel state={state.reps} />
            <BillsPanel state={state.bills} />
            <ElectionsPanel state={state.elections} />
            <DemographicsPanel state={state.demographics} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Data: U.S. Census Bureau · unitedstates/congress-legislators · DC Open Data ·
          Open States · Congress.gov · Google Civic Information. Your location is sent
          only to these providers to answer your query, and never stored by Localista.
        </p>
      </footer>
    </div>
  )
}
