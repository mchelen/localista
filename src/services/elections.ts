import { isoDate, nextFederalGeneralElection } from '../lib/civics'
import type { ElectionsFile } from '../lib/staticShapes'
import type { ElectionInfo, GeoContext } from '../lib/types'
import { env, fetchJson } from './http'
import { fetchStatic } from './staticData'

export function googleCivicKey(): string | undefined {
  return env('VITE_GOOGLE_CIVIC_API_KEY')
}

/** Always available: the computed next federal general election. */
export function computedElections(now: Date): ElectionInfo[] {
  return [
    {
      name: 'Federal general election (computed)',
      date: isoDate(nextFederalGeneralElection(now)),
      jurisdiction: 'United States',
      source: 'Computed (first Tuesday after first Monday in November, even years)'
    }
  ]
}

interface CivicElection {
  name?: string
  electionDay?: string
  ocdDivisionId?: string
}

/** Keep national entries plus the user's state; drop past dates. */
export function filterCivicElections(
  entries: CivicElection[],
  stateAbbr: string | undefined,
  now: Date,
  source: string
): ElectionInfo[] {
  const today = isoDate(now)
  const stateToken = stateAbbr?.toLowerCase()
  return entries
    .filter((e) => {
      if (!e.electionDay || !e.name || e.electionDay < today) return false
      const ocd = e.ocdDivisionId ?? ''
      if (ocd === 'ocd-division/country:us') return true
      if (!stateToken) return false
      return (
        ocd.includes(`state:${stateToken}`) || ocd.includes(`district:${stateToken}`)
      )
    })
    .map((e) => ({
      name: e.name as string,
      date: e.electionDay as string,
      jurisdiction: e.ocdDivisionId,
      source
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Upcoming elections: precompiled snapshot (Google Civic, fetched in CI)
 * first, live Google Civic if a client key is configured, computed federal
 * general election as the always-available floor.
 */
export async function getElections(geo: GeoContext, now: Date): Promise<ElectionInfo[]> {
  const staticFile = await fetchStatic<ElectionsFile>('data/elections.json')
  if (staticFile) {
    const filtered = filterCivicElections(
      staticFile.elections.map((e) => ({
        name: e.name,
        electionDay: e.date,
        ocdDivisionId: e.ocdDivisionId
      })),
      geo.stateAbbr,
      now,
      staticFile.source
    )
    if (filtered.length > 0) return filtered
  }

  const key = googleCivicKey()
  if (key) {
    const url = `https://www.googleapis.com/civicinfo/v2/elections?key=${key}`
    const data = await fetchJson<{ elections?: CivicElection[] }>(url)
    const filtered = filterCivicElections(
      data.elections ?? [],
      geo.stateAbbr,
      now,
      'Google Civic Information API'
    )
    if (filtered.length > 0) return filtered
  }

  return computedElections(now)
}
