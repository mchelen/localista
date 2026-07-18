import { isAtLargeLike, matchDistrict } from '../lib/districts'
import type { StateRepsFile } from '../lib/staticShapes'
import type { GeoContext, LatLng, Representative } from '../lib/types'
import { getStateReps as getStateRepsLive, openStatesKey } from './openstates'
import { fetchStatic } from './staticData'

function fromStatic(file: StateRepsFile, geo: GeoContext): Representative[] {
  const reps: Representative[] = []

  const upper = file.chambers.upper ?? {}
  const lower = file.chambers.lower ?? {}
  const legislature = file.chambers.legislature ?? {}

  reps.push(...(matchDistrict(upper, [geo.slduBase, geo.slduName]) ?? []))
  reps.push(...(matchDistrict(lower, [geo.sldlBase, geo.sldlName]) ?? []))

  // DC Council (and any body Open States classifies as "legislature"):
  // ward seat by district match, plus seats the whole city votes for.
  for (const [key, members] of Object.entries(legislature)) {
    if (isAtLargeLike(key)) {
      reps.push(...members)
    }
  }
  const wardSeat = matchDistrict(legislature, [
    geo.slduBase,
    geo.slduName,
    geo.sldlBase,
    geo.sldlName
  ])
  if (wardSeat) reps.push(...wardSeat)

  // Dedupe (a member could match through more than one path).
  const seen = new Set<string>()
  return reps.filter((r) => {
    const key = `${r.name}|${r.office}|${r.jurisdiction ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * State legislators (incl. DC Council): precompiled per-state file first
 * (key-free); live Open States `people.geo` as fallback — the live spatial
 * query also rescues locations where district-name matching fails.
 */
export async function getStateRepsSmart(
  point: LatLng,
  geo: GeoContext
): Promise<Representative[]> {
  if (geo.stateAbbr) {
    const file = await fetchStatic<StateRepsFile>(
      `data/reps/state/${geo.stateAbbr.toLowerCase()}.json`
    )
    if (file) {
      const reps = fromStatic(file, geo)
      if (reps.length > 0) return reps
    }
  }
  if (openStatesKey()) return getStateRepsLive(point)
  throw new Error('missing-key')
}
