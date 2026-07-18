import {
  currentTerm,
  legislatorToRepresentative,
  LEGISLATORS_CURRENT_URL,
  type Legislator
} from '../lib/congressRoster'
import type { FederalRepsFile } from '../lib/staticShapes'
import type { GeoContext, Representative } from '../lib/types'
import { fetchJson } from './http'
import { fetchStatic } from './staticData'

let cache: Legislator[] | undefined

async function loadLegislators(): Promise<Legislator[]> {
  if (!cache) {
    cache = await fetchJson<Legislator[]>(LEGISLATORS_CURRENT_URL, { timeoutMs: 30000 })
  }
  return cache
}

function sortSenatorsFirst(reps: Representative[]): Representative[] {
  return reps.sort((a, b) =>
    a.office === b.office
      ? a.name.localeCompare(b.name)
      : a.office.includes('Senator')
        ? -1
        : 1
  )
}

/**
 * Federal delegation for the resolved location: both senators (none for DC
 * and the territories) plus the House member/delegate for the district.
 * Prefers the precompiled per-state file (small, key-free, CI-refreshed);
 * falls back to fetching the full live congress-legislators roster.
 */
export async function getFederalReps(geo: GeoContext): Promise<Representative[]> {
  if (!geo.stateAbbr) throw new Error('State could not be determined for this point.')

  const staticFile = await fetchStatic<FederalRepsFile>(
    `data/reps/federal/${geo.stateAbbr.toLowerCase()}.json`
  )
  if (staticFile) {
    const reps = [...staticFile.senators]
    if (geo.cdNumber !== undefined) {
      const houseRep = staticFile.house[String(geo.cdNumber)]
      if (houseRep) reps.push(houseRep)
    }
    if (reps.length > 0) return sortSenatorsFirst(reps)
  }

  const legislators = await loadLegislators()
  const reps: Representative[] = []
  for (const person of legislators) {
    const term = currentTerm(person)
    if (!term || term.state !== geo.stateAbbr) continue
    if (term.type === 'sen') {
      reps.push(legislatorToRepresentative(person, term))
    } else if (geo.cdNumber !== undefined && (term.district ?? 0) === geo.cdNumber) {
      reps.push(legislatorToRepresentative(person, term))
    }
  }
  return sortSenatorsFirst(reps)
}
