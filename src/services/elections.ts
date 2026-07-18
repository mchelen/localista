import { isoDate, nextFederalGeneralElection } from '../lib/civics'
import type { ElectionInfo, GeoContext } from '../lib/types'
import { env, fetchJson } from './http'

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

/**
 * Official upcoming-elections list from Google Civic Information, filtered
 * to national entries plus the user's state. (The Civic Info
 * `representatives` endpoint is retired; `elections` remains available.)
 */
export async function getElections(geo: GeoContext, now: Date): Promise<ElectionInfo[]> {
  const computed = computedElections(now)
  const key = googleCivicKey()
  if (!key) return computed

  const url = `https://www.googleapis.com/civicinfo/v2/elections?key=${key}`
  const data = await fetchJson<{ elections?: CivicElection[] }>(url)
  const stateToken = geo.stateAbbr?.toLowerCase()
  const relevant = (data.elections ?? []).filter((e) => {
    if (!e.electionDay || !e.name) return false
    const ocd = e.ocdDivisionId ?? ''
    if (ocd === 'ocd-division/country:us') return true
    if (!stateToken) return false
    return (
      ocd.includes(`state:${stateToken}`) || ocd.includes(`district:${stateToken}`)
    )
  })
  const official: ElectionInfo[] = relevant.map((e) => ({
    name: e.name as string,
    date: e.electionDay as string,
    jurisdiction: e.ocdDivisionId,
    source: 'Google Civic Information API'
  }))
  // Official list supersedes the computed fallback when non-empty.
  const merged = official.length > 0 ? official : computed
  return merged.sort((a, b) => a.date.localeCompare(b.date))
}
