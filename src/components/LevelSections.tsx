import {
  classifyBill,
  classifyDemographics,
  classifyElection,
  classifyJurisdiction,
  classifyRep,
  classifyResource,
  isDc,
  LEVEL_ORDER,
  levelSubtitle,
  levelTitle,
  type CivicLevel
} from '../lib/civicLevels'
import { formatDate } from '../lib/format'
import { bySalience } from '../lib/salience'
import { CATEGORY, levelSection } from '../lib/sections'
import type {
  Bill,
  CivicResource,
  ElectionInfo,
  GeoContext,
  JurisdictionDemographics,
  Loadable,
  Representative
} from '../lib/types'
import type { LocalistaState } from '../hooks/useLocalista'
import { openStatesKey } from '../services/openstates'
import { PanelHeading } from './Panel'
import { RepCard } from './RepCard'

/**
 * Locality-first results (docs/UX_DESIGN.md §6): one section per level of
 * government, most local → least local. Each section bundles that level's
 * representatives, services, bills, next elections, and facts — so the
 * city's rep, the city's services, and the city's next election sit
 * together instead of being scattered across content-type panels.
 */

function ready<T>(l: Loadable<T[]>): T[] {
  return l.status === 'ready' ? l.data : []
}

function SubHeading({ cat }: { cat: keyof typeof CATEGORY }) {
  return (
    <h3 className="subsection-title">
      <span aria-hidden="true">{CATEGORY[cat].icon} </span>
      {CATEGORY[cat].label}
    </h3>
  )
}

function Loading({ what }: { what: string }) {
  return <p className="muted subsection-loading">Loading {what}…</p>
}

export function LevelSections({ state, geo }: { state: LocalistaState; geo: GeoContext }) {
  const byLevel = <T,>(items: T[], classify: (item: T, geo: GeoContext) => CivicLevel) => {
    const map = new Map<CivicLevel, T[]>()
    for (const item of items) {
      const level = classify(item, geo)
      map.set(level, [...(map.get(level) ?? []), item])
    }
    return map
  }

  const reps = byLevel(ready(state.reps).sort(bySalience(geo)), classifyRep)
  const resources = byLevel(ready(state.resources), classifyResource)
  const bills = byLevel(ready(state.bills), classifyBill)
  const elections = byLevel(ready(state.elections), classifyElection)
  const facts = byLevel(ready(state.demographics), classifyDemographics)

  const loading = {
    reps: state.reps.status === 'loading',
    resources: state.resources.status === 'loading',
    bills: state.bills.status === 'loading',
    elections: state.elections.status === 'loading',
    facts: state.demographics.status === 'loading'
  }

  /** Where loading hints / data may appear even before items arrive. */
  const applies = (level: CivicLevel, cat: keyof typeof CATEGORY): boolean => {
    const stateish: CivicLevel = isDc(geo) ? 'city' : 'state'
    switch (cat) {
      case 'reps':
      case 'services':
        return true
      case 'bills':
        return level === stateish || level === 'federal'
      case 'elections':
        return level === stateish || level === 'federal'
      case 'facts':
        return level === 'city' || level === 'county' || level === 'state'
    }
  }

  const missingStateReps =
    state.reps.status === 'ready' &&
    !openStatesKey() &&
    (reps.get(isDc(geo) ? 'city' : 'state') ?? []).every((r) => r.level !== 'state')

  const sections = LEVEL_ORDER.filter((level) => {
    const hasItems =
      (reps.get(level)?.length ?? 0) > 0 ||
      (resources.get(level)?.length ?? 0) > 0 ||
      (bills.get(level)?.length ?? 0) > 0 ||
      (elections.get(level)?.length ?? 0) > 0 ||
      (facts.get(level)?.length ?? 0) > 0
    const stillLoading = Object.entries(loading).some(
      ([cat, isLoading]) => isLoading && applies(level, cat as keyof typeof CATEGORY)
    )
    const hasDistricts = geo.jurisdictions.some(
      (j) => classifyJurisdiction(j, geo) === level
    )
    // A level with no data and nothing pending isn't worth a section; a
    // level the geocoder didn't even resolve (e.g. neighborhood outside
    // DC) never is.
    return hasDistricts && (hasItems || stillLoading)
  })

  return (
    <>
      {sections.map((level) => {
        const meta = levelSection(level)
        const subtitle = levelSubtitle(level, geo)
        const districts = geo.jurisdictions.filter(
          (j) => classifyJurisdiction(j, geo) === level && j.kind !== 'country'
        )
        const levelReps = reps.get(level) ?? []
        const levelResources = resources.get(level) ?? []
        const levelBills = bills.get(level) ?? []
        const levelElections = elections.get(level) ?? []
        const levelFacts = facts.get(level) ?? []
        return (
          <section className="panel level-section" id={meta.id} key={level}>
            <PanelHeading icon={meta.icon} tint={meta.tint}>
              {levelTitle(level, geo)}
            </PanelHeading>
            {subtitle && <p className="muted level-subtitle">{subtitle}</p>}
            {districts.length > 0 && (
              <p className="district-chips">
                {districts.map((j) => (
                  <span className="district-chip" key={`${j.kind}-${j.name}`}>
                    <span className="district-chip-label">{j.label}</span> {j.name}
                  </span>
                ))}
              </p>
            )}

            {(levelReps.length > 0 || (loading.reps && applies(level, 'reps'))) && (
              <>
                <SubHeading cat="reps" />
                {loading.reps ? (
                  <Loading what="representatives" />
                ) : (
                  <div className="rep-grid">
                    {levelReps.map((r: Representative, i) => (
                      <RepCard key={`${r.office}-${r.name}-${i}`} rep={r} />
                    ))}
                  </div>
                )}
              </>
            )}
            {level === (isDc(geo) ? 'city' : 'state') && missingStateReps && (
              <p className="note">
                No state-legislator data for this location yet. Deploy the CI data
                pipeline snapshots, or add a free Open States API key in{' '}
                <code>.env.local</code>.
              </p>
            )}

            {(levelResources.length > 0 ||
              (loading.resources && applies(level, 'services'))) && (
              <>
                <SubHeading cat="services" />
                {loading.resources ? (
                  <Loading what="services" />
                ) : (
                  <div className="resource-grid">
                    {levelResources.map((r: CivicResource) => (
                      <a
                        key={r.url}
                        className="resource-card"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="resource-label">
                          {r.label} <span aria-hidden="true">↗</span>
                        </span>
                        {r.description && (
                          <span className="resource-desc">{r.description}</span>
                        )}
                        <span className="resource-meta">
                          {r.jurisdiction}
                          {r.phone ? ` · ☎ ${r.phone}` : ''}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}

            {(levelBills.length > 0 || (loading.bills && applies(level, 'bills'))) && (
              <>
                <SubHeading cat="bills" />
                {loading.bills ? (
                  <Loading what="bills" />
                ) : (
                  <ul className="bill-list">
                    {levelBills.map((b: Bill) => (
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
                            Latest action
                            {b.lastActionDate ? ` (${formatDate(b.lastActionDate)})` : ''}:{' '}
                            {b.lastAction}
                          </p>
                        )}
                        <p className="source">Source: {b.source}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {(levelElections.length > 0 ||
              (loading.elections && applies(level, 'elections'))) && (
              <>
                <SubHeading cat="elections" />
                {loading.elections ? (
                  <Loading what="elections" />
                ) : (
                  <ul className="election-list">
                    {levelElections.map((e: ElectionInfo) => (
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
              </>
            )}

            {(levelFacts.length > 0 || (loading.facts && applies(level, 'facts'))) && (
              <>
                <SubHeading cat="facts" />
                {loading.facts ? (
                  <Loading what="facts" />
                ) : (
                  <div className="demo-grid">
                    {levelFacts.map((p: JurisdictionDemographics) => (
                      <article
                        key={`${p.level}-${p.jurisdictionName}`}
                        className="demo-card"
                      >
                        <h4>{p.jurisdictionName}</h4>
                        <dl>
                          {p.rows.map((row) => (
                            <div className="demo-row" key={row.label}>
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="source">Source: {p.source}</p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )
      })}
      <DataNotes state={state} />
    </>
  )
}

/** Unavailable/error statuses, reported once instead of per-section. */
function DataNotes({ state }: { state: LocalistaState }) {
  const entries: Array<{ key: string; label: string; l: Loadable<unknown[]> }> = [
    { key: 'reps', label: 'Representatives', l: state.reps },
    { key: 'services', label: 'Services', l: state.resources },
    { key: 'bills', label: 'Bills', l: state.bills },
    { key: 'elections', label: 'Elections', l: state.elections },
    { key: 'facts', label: 'Facts & figures', l: state.demographics }
  ]
  const notes = entries.filter(
    (e) => e.l.status === 'unavailable' || e.l.status === 'error'
  )
  if (notes.length === 0) return null
  return (
    <section className="panel data-notes" aria-label="Data availability notes">
      {notes.map(({ key, label, l }) =>
        l.status === 'unavailable' ? (
          <p className="note" key={key}>
            <strong>{label}:</strong> {l.reason}
          </p>
        ) : l.status === 'error' ? (
          <p className="error" role="alert" key={key}>
            <strong>{label}:</strong> couldn’t load — {l.message}
          </p>
        ) : null
      )}
    </section>
  )
}
