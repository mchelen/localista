import { acsNumber, formatCount, formatMoney, formatPercent } from '../lib/format'
import type { DemographicRow, GeoContext, JurisdictionDemographics } from '../lib/types'
import { env, fetchJson } from './http'

const ACS_VINTAGE = '2023'
const BASE = `https://api.census.gov/data/${ACS_VINTAGE}/acs/acs5/profile`
const SOURCE = `Census ACS 5-year (${ACS_VINTAGE})`

// Profile variable ids shift between vintages — re-verify on vintage bump.
const VARS = [
  { id: 'DP05_0001E', label: 'Population', fmt: formatCount },
  { id: 'DP05_0018E', label: 'Median age', fmt: (n: number) => n.toLocaleString('en-US') },
  { id: 'DP03_0062E', label: 'Median household income', fmt: formatMoney },
  { id: 'DP02_0068PE', label: "Bachelor's degree or higher", fmt: formatPercent },
  { id: 'DP03_0009PE', label: 'Unemployment rate', fmt: formatPercent }
] as const

async function fetchProfile(
  forClause: string,
  inClause: string | undefined,
  level: string
): Promise<JurisdictionDemographics | undefined> {
  const key = env('VITE_CENSUS_API_KEY')
  const params = new URLSearchParams({
    get: `NAME,${VARS.map((v) => v.id).join(',')}`,
    for: forClause
  })
  if (inClause) params.set('in', inClause)
  if (key) params.set('key', key)

  // ACS responds as a 2-row array: header row then value row.
  const data = await fetchJson<string[][]>(`${BASE}?${params.toString()}`)
  if (!Array.isArray(data) || data.length < 2) return undefined
  const [header, values] = data
  const byName = new Map(header.map((h, i) => [h, values[i]]))

  const rows: DemographicRow[] = []
  for (const v of VARS) {
    const n = acsNumber(byName.get(v.id))
    if (n !== undefined) rows.push({ label: v.label, value: v.fmt(n) })
  }
  if (rows.length === 0) return undefined
  return {
    jurisdictionName: byName.get('NAME') ?? level,
    level,
    rows,
    source: SOURCE
  }
}

/** Demographic profiles for each enclosing jurisdiction with ACS coverage. */
export async function getDemographics(
  geo: GeoContext
): Promise<JurisdictionDemographics[]> {
  if (!geo.stateFips) throw new Error('State could not be determined.')
  const tasks: Promise<JurisdictionDemographics | undefined>[] = [
    fetchProfile(`state:${geo.stateFips}`, undefined, 'State')
  ]
  if (geo.countyFips) {
    tasks.push(
      fetchProfile(`county:${geo.countyFips}`, `state:${geo.stateFips}`, 'County')
    )
  }
  if (geo.placeFips) {
    tasks.push(
      fetchProfile(`place:${geo.placeFips}`, `state:${geo.stateFips}`, 'City / Place')
    )
  }
  const results = await Promise.allSettled(tasks)
  const profiles = results
    .filter(
      (r): r is PromiseFulfilledResult<JurisdictionDemographics | undefined> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((p): p is JurisdictionDemographics => p !== undefined)
  if (profiles.length === 0) throw new Error('No demographic data available.')
  return profiles
}
