import { ACS_PROFILE_BASE, ACS_SOURCE, acsRows, acsVarList } from '../lib/acs'
import type { DemographicsFile } from '../lib/staticShapes'
import type { GeoContext, JurisdictionDemographics } from '../lib/types'
import { env, fetchJson } from './http'
import { fetchStatic } from './staticData'

async function fetchProfile(
  forClause: string,
  inClause: string | undefined,
  level: string
): Promise<JurisdictionDemographics | undefined> {
  const key = env('VITE_CENSUS_API_KEY')
  const params = new URLSearchParams({ get: `NAME,${acsVarList()}`, for: forClause })
  if (inClause) params.set('in', inClause)
  if (key) params.set('key', key)

  // ACS responds as a 2-row array: header row then value row.
  const data = await fetchJson<string[][]>(`${ACS_PROFILE_BASE}?${params.toString()}`)
  if (!Array.isArray(data) || data.length < 2) return undefined
  const [header, values] = data
  const rows = acsRows(header, values)
  if (rows.length === 0) return undefined
  const nameIdx = header.indexOf('NAME')
  return {
    jurisdictionName: (nameIdx >= 0 ? values[nameIdx] : undefined) ?? level,
    level,
    rows,
    source: ACS_SOURCE
  }
}

/**
 * Demographic profiles for each enclosing jurisdiction with ACS coverage:
 * precompiled per-state file first, live ACS API as fallback.
 */
export async function getDemographics(
  geo: GeoContext
): Promise<JurisdictionDemographics[]> {
  if (!geo.stateFips) throw new Error('State could not be determined.')

  const staticFile = await fetchStatic<DemographicsFile>(
    `data/demographics/${geo.stateFips}.json`
  )
  if (staticFile) {
    const profiles: JurisdictionDemographics[] = []
    if (staticFile.state) profiles.push(staticFile.state)
    if (geo.countyFips && staticFile.counties[geo.countyFips]) {
      profiles.push(staticFile.counties[geo.countyFips])
    }
    if (geo.placeFips && staticFile.places[geo.placeFips]) {
      profiles.push(staticFile.places[geo.placeFips])
    }
    if (profiles.length > 0) return profiles
  }

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
